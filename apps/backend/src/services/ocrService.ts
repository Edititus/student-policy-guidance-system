import Tesseract from 'tesseract.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * OCR Service for extracting text from scanned PDFs
 * Uses pdf-parse for rendering pages and tesseract.js for OCR
 */
export class OCRService {
  private static instance: OCRService;
  private worker: any = null;

  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Initialize the Tesseract worker
   */
  async initialize(): Promise<void> {
    if (this.worker) return;

    console.log('🔤 Initializing OCR worker...');
    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          // Only log progress at 25%, 50%, 75%, 100%
          const progress = Math.round(m.progress * 100);
          if (progress % 25 === 0) {
            console.log(`📝 OCR progress: ${progress}%`);
          }
        }
      },
    });
    console.log('✅ OCR worker ready');
  }

  /**
   * Extract text from a scanned PDF using OCR
   * @param filePath Path to the PDF file
   * @returns Extracted text from all pages
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    await this.initialize();

    const { PDFParse } = await import('pdf-parse');
    const dataBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: dataBuffer });

    // Get info to know total pages
    const info = await parser.getInfo();
    const totalPages = info.total;
    console.log(`📄 Processing ${totalPages} pages with OCR...`);

    const allText: string[] = [];

    // Process pages in batches to manage memory
    const batchSize = 5;
    for (let i = 1; i <= totalPages; i += batchSize) {
      const endPage = Math.min(i + batchSize - 1, totalPages);
      const pageNumbers = Array.from({ length: endPage - i + 1 }, (_, idx) => i + idx);

      console.log(`🔍 OCR processing pages ${i}-${endPage} of ${totalPages}...`);

      // Get screenshots for batch of pages
      const screenshots = await parser.getScreenshot({
        partial: pageNumbers,
        desiredWidth: 2000, // Higher resolution for better OCR
      });

      // OCR each page image
      for (let j = 0; j < screenshots.pages.length; j++) {
        const pageData = screenshots.pages[j];
        if (pageData?.data) {
          try {
            // Convert Uint8Array to Buffer for tesseract.js
            const buffer = Buffer.from(pageData.data);
            const text = await this.ocrImage(buffer);
            if (text.trim()) {
              allText.push(`--- Page ${pageNumbers[j]} ---\n${text}`);
            }
          } catch (err) {
            console.warn(`⚠️ OCR failed for page ${pageNumbers[j]}:`, err);
          }
        }
      }
    }

    await parser.destroy();

    const fullText = allText.join('\n\n');
    console.log(`✅ OCR complete: extracted ${fullText.length} characters from ${totalPages} pages`);
    return fullText;
  }

  /**
   * OCR a single image buffer
   */
  private async ocrImage(imageBuffer: Buffer): Promise<string> {
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    const result = await this.worker.recognize(imageBuffer);
    return result.data.text;
  }

  /**
   * Check if a PDF appears to be scanned (minimal extractable text)
   */
  static async isProbablyScanned(filePath: string, textContent: string, pageCount?: number): Promise<boolean> {
    // If we have a page count, check if text per page is suspiciously low
    if (pageCount && pageCount > 0) {
      const charsPerPage = textContent.length / pageCount;
      // Typical page has 2000-5000 chars. If <100 chars/page, likely scanned
      if (charsPerPage < 100) {
        console.log(`📊 Low text density: ${Math.round(charsPerPage)} chars/page - likely scanned`);
        return true;
      }
    }

    // Check for common OCR non-text patterns
    const textWithoutWhitespace = textContent.replace(/\s+/g, '');
    
    // If mostly page markers like "-- 1 of 73 --"
    const pageMarkerPattern = /--\s*\d+\s*of\s*\d+\s*--/gi;
    const markerMatches = textContent.match(pageMarkerPattern) || [];
    const markerCharCount = markerMatches.join('').length;
    
    if (markerCharCount > textWithoutWhitespace.length * 0.5) {
      console.log('📊 Text is mostly page markers - likely scanned');
      return true;
    }

    // Very little actual content
    if (textWithoutWhitespace.length < 500) {
      console.log(`📊 Very little text (${textWithoutWhitespace.length} chars) - likely scanned`);
      return true;
    }

    return false;
  }

  /**
   * Terminate the worker when done
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('🔤 OCR worker terminated');
    }
  }
}

export default OCRService;
