import * as fs from 'fs/promises'
import * as path from 'path'
import mammoth from 'mammoth'
import { PolicyCategory, PolicyDocument, PolicyRule } from '../models/Policy'
import OCRService from './ocrService'

type ParseResult = {
  text: string
  usedOCR?: boolean
  parseDiagnostics?: {
    fallback?: 'PDF_OCR_FALLBACK_USED'
  }
}

type ParseHooks = {
  onOCRStart?: () => void
}

type PdfParseOutcome = {
  text: string
  pageCount?: number
}

// Dynamic import for pdf-parse (v1 and v2 module shapes)
const loadPdfParseModule = async (): Promise<any> => {
  return import('pdf-parse')
}

const resolvePdfParser = (moduleRef: any) => {
  const candidates = [
    moduleRef,
    moduleRef?.default,
    moduleRef?.pdf,
    moduleRef?.default?.pdf,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'function') {
      return async (buffer: Buffer): Promise<PdfParseOutcome> => {
        const result = await candidate(buffer)
        return {
          text: typeof result?.text === 'string' ? result.text : '',
          pageCount:
            typeof result?.numpages === 'number'
              ? result.numpages
              : typeof result?.numPages === 'number'
                ? result.numPages
                : undefined,
        }
      }
    }
  }

  const PDFParseCtor =
    moduleRef?.PDFParse ||
    moduleRef?.default?.PDFParse

  if (typeof PDFParseCtor === 'function') {
    return async (buffer: Buffer): Promise<PdfParseOutcome> => {
      const parser = new PDFParseCtor({ data: buffer })
      let textResult: any
      let infoResult: any
      try {
        textResult = await parser.getText()
        infoResult = await parser.getInfo().catch(() => undefined)
      } finally {
        await parser.destroy?.().catch(() => undefined)
      }

      return {
        text:
          typeof textResult?.text === 'string'
            ? textResult.text
            : Array.isArray(textResult?.pages)
              ? textResult.pages.map((p: any) => p?.text || '').join('\n')
              : '',
        pageCount:
          typeof infoResult?.total === 'number'
            ? infoResult.total
            : typeof textResult?.total === 'number'
              ? textResult.total
              : undefined,
      }
    }
  }

  throw new Error('PDF_IMPORT_ERROR: Unsupported pdf-parse module shape')
}

/**
 * Service for parsing policy documents (PDF, DOCX) and extracting structured data
 */
export class PolicyParserService {
  /**
   * Parse a policy document file and extract text
   */
  async parseDocument(
    filePath: string,
    sourceFilename?: string,
    hooks?: ParseHooks
  ): Promise<ParseResult> {
    const ext = path.extname(sourceFilename || filePath).toLowerCase()

    try {
      if (ext === '.pdf') {
        return await this.parsePDF(filePath, hooks)
      } else if (ext === '.docx') {
        return { text: await this.parseDOCX(filePath) }
      } else if (ext === '.txt') {
        return { text: await this.parseTXT(filePath) }
      } else {
        throw new Error(`Unsupported file format: ${ext}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error'
      throw new Error(message.startsWith('PDF_') ? message : `DOCUMENT_PARSE_ERROR: ${message}`)
    }
  }

  /**
   * Parse PDF document
   */
  private async parsePDF(filePath: string, hooks?: ParseHooks): Promise<ParseResult> {
    const pdfModule = await loadPdfParseModule().catch((error) => {
      throw new Error(
        `PDF_IMPORT_ERROR: Failed to load pdf-parse (${error instanceof Error ? error.message : 'unknown'})`
      )
    })
    const parse = resolvePdfParser(pdfModule)
    const dataBuffer = await fs.readFile(filePath)
    const parsed = await parse(dataBuffer).catch((error: unknown) => {
      throw new Error(
        `PDF_PARSE_ERROR: ${
          error instanceof Error ? error.message : 'Failed to parse PDF document'
        }`
      )
    })

    const rawText = (parsed.text || '').trim()
    // pdf-parse inserts a form-feed (\f) between pages for text-based PDFs.
    // Convert those to the same `--- Page N ---` marker format that OCR produces
    // so the chunker can assign real page numbers instead of estimating.
    const parsedText = rawText.includes('\f')
      ? rawText
          .split('\f')
          .map((pg, i) => `--- Page ${i + 1} ---\n${pg.trimStart()}`)
          .join('\n')
      : rawText
    const scanned = await OCRService.isProbablyScanned(filePath, parsedText, parsed.pageCount)
    const shouldUseOCR = scanned || !parsedText

    if (shouldUseOCR) {
      hooks?.onOCRStart?.()
      const ocrText = (
        await OCRService.getInstance()
          .extractTextFromPDF(filePath)
          .catch((error: unknown) => {
            throw new Error(
              `PDF_PARSE_ERROR: OCR fallback failed (${
                error instanceof Error ? error.message : 'unknown OCR error'
              })`
            )
          })
      )
        .trim()
        .replace(/\u0000/g, '')
      if (!ocrText) {
        throw new Error(
          'PDF_EMPTY_TEXT: No extractable text found in PDF (standard parse and OCR fallback returned empty text)'
        )
      }
      return {
        text: ocrText,
        usedOCR: true,
        parseDiagnostics: { fallback: 'PDF_OCR_FALLBACK_USED' },
      }
    }

    return { text: parsedText, usedOCR: false }
  }

  /**
   * Parse DOCX document
   */
  private async parseDOCX(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  /**
   * Parse TXT document
   */
  private async parseTXT(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8')
  }

  /**
   * Extract policy metadata from document text
   * This uses simple heuristics - can be enhanced with NLP
   */
  extractMetadata(
    text: string,
    sourceFile: string
  ): {
    institution: string
    academicYear: string
    title: string
  } {
    // Simple pattern matching for common structures
    const institutionMatch = text.match(
      /(?:University|College|Institute) (?:of )?([A-Z][a-zA-Z\s]+)/i
    )
    const yearMatch = text.match(/(\d{4}[-\/]\d{4}|\d{4})\s*(?:Academic Year|Session)?/i)
    const titleMatch = text.match(/^([A-Z][^\n]{10,100})$/m)

    return {
      institution: institutionMatch?.[0] || 'Unknown',
      academicYear: yearMatch?.[1] || new Date().getFullYear().toString(),
      title: titleMatch?.[1] || path.basename(sourceFile, path.extname(sourceFile)),
    }
  }

  /**
   * Categorize policy based on content keywords
   */
  categorizePolicy(text: string): PolicyCategory {
    const lowerText = text.toLowerCase()

    // Academic keywords
    if (
      /registration|enrollment|course|grade|gpa|cgpa|probation|deferment|graduation|transcript/i.test(
        lowerText
      )
    ) {
      return PolicyCategory.ACADEMIC
    }

    // Financial keywords
    if (/tuition|fee|payment|scholarship|bursary|financial aid|refund/i.test(lowerText)) {
      return PolicyCategory.FINANCIAL
    }

    // Examination keywords
    if (/exam|assessment|test|quiz|evaluation|invigilation|misconduct/i.test(lowerText)) {
      return PolicyCategory.EXAMINATION
    }

    // Student Affairs keywords
    if (/conduct|discipline|housing|accommodation|health|welfare|organization/i.test(lowerText)) {
      return PolicyCategory.STUDENT_AFFAIRS
    }

    // Administrative keywords
    if (/id card|document|certificate|leave|transfer|change of programme/i.test(lowerText)) {
      return PolicyCategory.ADMINISTRATIVE
    }

    return PolicyCategory.OTHER
  }

  /**
   * Extract keywords from policy text
   */
  extractKeywords(text: string): string[] {
    const commonWords = new Set([
      'the',
      'and',
      'or',
      'is',
      'of',
      'to',
      'in',
      'for',
      'a',
      'an',
      'be',
      'as',
      'at',
      'by',
      'with',
      'from',
      'on',
      'shall',
      'must',
      'will',
      'may',
      'can',
      'should',
    ])

    // Extract words (3+ characters), convert to lowercase
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []

    // Count frequency
    const frequency: { [key: string]: number } = {}
    words.forEach((word) => {
      if (!commonWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1
      }
    })

    // Return top 10 keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Extract policy rules using simple pattern matching
   * This is a basic implementation - can be enhanced with NLP/LLM
   */
  extractRules(text: string): PolicyRule[] {
    const rules: PolicyRule[] = []

    // Pattern for IF-THEN structures
    const ifThenPattern = /(?:if|where|when)\s+([^,.]+?)\s+(?:then|shall|must|will)\s+([^,.]+)/gi

    let match
    let index = 0
    while ((match = ifThenPattern.exec(text)) !== null) {
      rules.push({
        id: `rule_${index++}`,
        condition: match[1].trim(),
        action: match[2].trim(),
        ambiguityLevel: 'MEDIUM',
      })
    }

    return rules
  }

  /**
   * Split long text into chunks for embedding
   * Chunks overlap to preserve context
   */
  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.slice(start, end))
      start += chunkSize - overlap
    }

    return chunks
  }

  /**
   * Main method: Parse file and create PolicyDocument
   */
  async parseAndStructure(
    filePath: string,
    institutionOverride?: string,
    sourceFilename?: string,
    hooks?: ParseHooks
  ): Promise<Partial<PolicyDocument>> {
    const parseResult = await this.parseDocument(filePath, sourceFilename, hooks)
    const text = parseResult.text
    const metadata = this.extractMetadata(text, sourceFilename || filePath)
    const category = this.categorizePolicy(text)
    const keywords = this.extractKeywords(text)
    const rules = this.extractRules(text)

    return {
      title: metadata.title,
      category,
      content: text,
      summary: text.slice(0, 200) + '...', // First 200 chars as summary
      rules,
      metadata: {
        institution: institutionOverride || metadata.institution,
        academicYear: metadata.academicYear,
        version: '1.0',
        lastUpdated: new Date(),
        sourceDocument: path.basename(sourceFilename || filePath),
        parseDiagnostics: {
          ocrUsed: !!parseResult.usedOCR,
        },
      },
      status: 'DRAFT' as any,
    }
  }
}
