import { OpenAI } from 'openai';
import { HfInference } from '@huggingface/inference';
import { v4 as uuidv4 } from 'uuid';
import { Response as ExpressResponse } from 'express';
import { VectorService, EMBEDDING_DIMENSION } from './vectorService';
import { PolicyModel } from '../models/PolicyModel';
import Query from '../models/QueryModel';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import {
  getCachedEmbedding, setCachedEmbedding,
  getCachedAnswer, setCachedAnswer,
  getCachedPolicyTitles, setCachedPolicyTitles,
} from './queryCache';

/**
 * Policy Query interface
 */
export interface PolicyQuery {
  query: string;
  studentContext?: StudentContext;
  schoolId?: string;
  userId?: string;
  conversationId?: string;
}

/**
 * Student Context interface
 */
export interface StudentContext {
  year?: string;
  department?: string;
  program?: string;
}

/**
 * Policy Response interface
 */
export interface PolicyResponse {
  id: string;
  query: string;
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sources: Array<{
    policyId: string | number;
    policyTitle: string;
    excerpt: string;
    similarity?: number;
    pageReference?: string;
  }>;
  requiresEscalation: boolean;
  timestamp: Date;
  studentContext?: StudentContext;
  responseTimeMs?: number;
  retrievalDiagnostics?: {
    schoolId?: string;
    topSimilarity: number | null;
    candidatesScanned: number;
    thresholdUsed: number;
    filteredOutCount: number;
    failureReason?: 'NO_CANDIDATES' | 'BELOW_THRESHOLD' | 'NO_GROUNDED_ANSWER';
  };
}

/**
 * Policy Document interface for ingestion
 */
export interface PolicyDocument {
  id?: string;
  title: string;
  content: string;
  category: string;
  schoolId: string;
  schoolName: string;
  metadata?: Record<string, unknown>;
}

/**
 * DatabaseRAGService - Production-ready RAG with pgvector
 * Stores embeddings in PostgreSQL and uses native vector similarity search
 */
export class DatabaseRAGService {
  private provider: 'openai' | 'huggingface';
  private openai?: OpenAI;
  private hf?: HfInference;
  private vectorService: VectorService;

  // Model configurations
  private openaiEmbeddingModel = 'text-embedding-3-small';
  private openaiGenerationModel = 'gpt-4o-mini';
  private hfEmbeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
  // Qwen2.5-72B-Instruct is reliably available on the HF free inference tier.
  // Override via HF_GENERATION_MODEL env var if needed.
  private hfGenerationModel = process.env.HF_GENERATION_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

  private static readonly DEFAULT_RETRIEVAL_TOP_K = 8;  // reduced for faster latency; covers most queries well
  private static readonly KEYWORD_FALLBACK_TOP_K = 5;   // extra chunks via keyword search when semantic scores are low
  private static readonly LOW_SIMILARITY_THRESHOLD = 0.50; // trigger keyword fallback below this top score
  // ~2500 chars/page ≈ 400-500 words — typical university handbook density
  private static readonly AVG_CHARS_PER_PAGE = 2500;

  constructor() {
    this.provider = (process.env.AI_PROVIDER as 'openai' | 'huggingface') || 'huggingface';
    this.vectorService = VectorService.getInstance();

    console.log(`🤖 Initializing Database RAG Service with provider: ${this.provider.toUpperCase()}`);

    if (this.provider === 'openai') {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY not found in environment');
      }
      this.openai = new OpenAI({ apiKey: openaiKey });
      console.log(`✓ Using OpenAI: ${this.openaiGenerationModel}`);
    } else {
      const hfKey = process.env.HUGGINGFACE_API_KEY;
      if (!hfKey) {
        throw new Error('HUGGINGFACE_API_KEY not found in environment');
      }
      this.hf = new HfInference(hfKey);
      console.log(`✓ Using Hugging Face: ${this.hfGenerationModel}`);
    }
  }

  private getRetrievalThreshold(): number {
    const envThreshold = parseFloat(process.env.RETRIEVAL_THRESHOLD || '');
    if (!isNaN(envThreshold)) return envThreshold;
    return this.provider === 'openai' ? 0.7 : 0.30;
  }

  private isLikelyUngroundedAnswer(answer: string): boolean {
    if (!answer || answer.trim().length < 20) return true;
    const normalized = answer.toLowerCase();
    const patterns = [
      "don't have enough information",
      'does not contain relevant information',
      "doesn't contain relevant information",
      'does not contain specific information',
      'does not contain information',
      'does not provide information',
      'no information about',
      'not mentioned in the provided',
      'not covered in the provided',
      'provided context does not',
      'context does not contain',
      'context does not include',
      'context does not provide',
      'cannot determine from the provided context',
      'not enough context',
      'insufficient context',
      'would need to refer to another section',
      'you would need to contact',
      // Hallucination signals: AI drawing on general training knowledge, not the policy doc
      'based on common',
      'based on general',
      'typically requires',
      'in most universities',
      'in many universities',
      'common grading scale',
      'common practice',
      'generally accepted',
      'general guideline',
      'commonly used',
      'consult the official grading',
      'for specific details',
      'variations may exist',
      'may vary by institution',
    ];
    return patterns.some((pattern) => normalized.includes(pattern));
  }

  /**
   * Extract meaningful keywords from a query for fallback text search.
   * Returns partial stems (min 4 chars) safe for ILIKE matching.
   */
  private extractKeywords(query: string): string[] {
    const stopwords = new Set([
      'what', 'which', 'where', 'when', 'who', 'how', 'why', 'are', 'the', 'and',
      'for', 'with', 'about', 'that', 'this', 'from', 'have', 'does', 'can', 'list',
      'tell', 'give', 'show', 'explain', 'describe', 'university', 'according',
    ]);
    return [
      ...new Set(
        query
          .toLowerCase()
          .replace(/[^a-z\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 4 && !stopwords.has(w))
          .map((w) => w.slice(0, 7)) // use stem so OCR variants still match
      ),
    ];
  }

  /**
   * Initialize pgvector (call once at app startup)
   * Uses graceful fallback - app will continue even if pgvector isn't installed
   */
  async initialize(): Promise<void> {
    const pgVectorEnabled = await this.vectorService.initializePgVectorSafe();
    
    if (pgVectorEnabled) {
      // Create HNSW index for faster similarity search
      await this.vectorService.createHnswIndex();
    }
    // If pgvector isn't available, VectorService.findSimilar() will
    // automatically use the JavaScript fallback implementation
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check embedding cache first
    const cached = getCachedEmbedding(text);
    if (cached) return cached;

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.embeddings.create({
        model: this.openaiEmbeddingModel,
        input: text,
      });
      const vector = response.data[0].embedding;
      setCachedEmbedding(text, vector);
      return vector;
    } else if (this.provider === 'huggingface' && this.hf) {
      const response = await this.hf.featureExtraction({
        model: this.hfEmbeddingModel,
        inputs: text,
      });
      const vector = Array.isArray(response) ? (response as number[]) : [];
      setCachedEmbedding(text, vector);
      return vector;
    }
    throw new Error('No AI provider configured');
  }

  /**
   * Generate answer using LLM
   */
  private async generateAnswer(
    query: string,
    context: string,
    schoolName?: string
  ): Promise<string> {
    const systemPrompt = `You are an AI Policy Assistant for ${schoolName || 'the university'}. Your sole purpose is to replace the need for students to manually read the student handbook. You must provide complete, thorough answers drawn directly from the policy context — reproducing all relevant rules, requirements, procedures, and details exactly as they appear in the source material.

CRITICAL RULES — follow these without exception:
1. NEVER tell the student to "refer to the handbook", "consult the handbook", "see the handbook for more details", or any similar phrase. You ARE the handbook. Provide the full information here.
2. NEVER truncate or summarise when the context contains specific details. If the policy lists 6 rules, present all 6. If it specifies exact numbers, deadlines, or procedures, state them verbatim.
3. Reproduce the relevant policy content completely — use numbered or bulleted lists exactly as structured in the source when appropriate.
4. The context comes from a scanned PDF handbook. Information may appear as bullet lists, numbered lists, or line-by-line text. Treat all of it as valid and include every relevant item in your answer.
5. If the context contains section headings or named items directly relevant to the question, include them.
6. Each context block includes a page number (e.g. "Page ~3" or "Page 16"). Cite sources like: "(p. ~3)" or "(p. 16)".
7. If the provided context does NOT contain information that actually answers the question, respond with EXACTLY the text "NO_GROUNDED_ANSWER" and nothing else. Do NOT write a long response explaining that you don't have the information or asking the student for more context. Just output "NO_GROUNDED_ANSWER".
8. Do NOT add phrases like "I hope this helps" or "feel free to ask more questions" — be direct and informative.`;

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: this.openaiGenerationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });
      return response.choices[0].message.content || 'No answer generated';
    } else if (this.provider === 'huggingface' && this.hf) {
      const response = await this.hf.chatCompletion({
        model: this.hfGenerationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });
      return response.choices[0].message.content?.trim() || 'No answer generated';
    }
    throw new Error('No AI provider configured');
  }

  /**
   * Stream the LLM answer token-by-token over an already-open SSE response.
   * Writes: data: {"token":"…"}\n\n  for each token
   * Returns the full accumulated answer string for post-stream processing.
   */
  async generateAnswerStream(
    query: string,
    context: string,
    schoolName: string | undefined,
    res: ExpressResponse,
  ): Promise<string> {
    const systemPrompt = `You are an AI Policy Assistant for ${schoolName || 'the university'}. Your sole purpose is to replace the need for students to manually read the student handbook. You must provide complete, thorough answers drawn directly from the policy context — reproducing all relevant rules, requirements, procedures, and details exactly as they appear in the source material.

CRITICAL RULES — follow these without exception:
1. NEVER tell the student to "refer to the handbook", "consult the handbook", "see the handbook for more details", or any similar phrase. You ARE the handbook. Provide the full information here.
2. NEVER truncate or summarise when the context contains specific details. If the policy lists 6 rules, present all 6. If it specifies exact numbers, deadlines, or procedures, state them verbatim.
3. Reproduce the relevant policy content completely — use numbered or bulleted lists exactly as structured in the source when appropriate.
4. The context comes from a scanned PDF handbook. Information may appear as bullet lists, numbered lists, or line-by-line text. Treat all of it as valid and include every relevant item in your answer.
5. If the context contains section headings or named items directly relevant to the question, include them.
6. Each context block includes a page number (e.g. "Page ~3" or "Page 16"). Cite sources like: "(p. ~3)" or "(p. 16)".
7. If the provided context does NOT contain information that actually answers the question, respond with EXACTLY the text "NO_GROUNDED_ANSWER" and nothing else. Do NOT write a long response explaining that you don't have the information or asking the student for more context. Just output "NO_GROUNDED_ANSWER".
8. Do NOT add phrases like "I hope this helps" or "feel free to ask more questions" — be direct and informative.`;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`,
      },
    ];

    let accumulated = '';

    if (this.provider === 'openai' && this.openai) {
      const stream = await this.openai.chat.completions.create({
        model: this.openaiGenerationModel,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        stream: true,
      });
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content ?? '';
        if (token) {
          accumulated += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }
    } else if (this.provider === 'huggingface' && this.hf) {
      const stream = this.hf.chatCompletionStream({
        model: this.hfGenerationModel,
        messages,
        max_tokens: 2000,
        temperature: 0.3,
      });
      for await (const chunk of stream) {
        const token =
          (chunk.choices && chunk.choices.length > 0
            ? (chunk.choices[0].delta as { content?: string | null }).content
            : null) ?? '';
        if (token) {
          accumulated += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }
    } else {
      throw new Error('No AI provider configured');
    }

    return accumulated;
  }

  /**
   * Build a map of physical-page-number → display label + char start position
   * by parsing `--- Page N ---` markers that OCR (and page-aware PDF parse) embed
   * in the text. Returns an empty array when no markers are present.
   */
  private buildPageMap(
    text: string
  ): Array<{ physPage: number; textStart: number; displayLabel: string }> {
    const markers: Array<{ physPage: number; matchStart: number; matchEnd: number }> = [];
    const re = /--- Page (\d+) ---\n?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      markers.push({ physPage: parseInt(m[1]), matchStart: m.index, matchEnd: m.index + m[0].length });
    }
    if (markers.length === 0) return [];

    return markers.map((marker, i) => {
      const bodyEnd = i + 1 < markers.length ? markers[i + 1].matchStart : text.length;
      const body = text.slice(marker.matchEnd, bodyEnd);
      return {
        physPage: marker.physPage,
        textStart: marker.matchEnd,
        displayLabel: this.detectPrintedPageLabel(body, marker.physPage),
      };
    });
  }

  /**
   * Detect the *printed* page label ("iv", "1", "23") from a single page's body
   * text. Checks the footer region first (last ~250 chars) because university
   * handbooks print page numbers at the bottom. Handles the common pattern where
   * frontmatter uses Roman numerals before switching to Arabic at Chapter 1.
   */
  private detectPrintedPageLabel(pageText: string, physPage: number): string {
    const footer = pageText.slice(-250);
    const header = pageText.slice(0, 120);

    // Roman numerals (i–xxiv) as a standalone line in the footer
    const romanRe = /(?:^|\n)\s*(x{0,3}(?:ix|iv|v?i{0,3}))\s*(?:\n|$)/i;
    const romanMatch = footer.match(romanRe);
    if (romanMatch?.[1]) {
      const r = romanMatch[1].trim().toLowerCase();
      if (r.length > 0 && /^[ivxlc]+$/.test(r)) return r;
    }

    // Arabic numeral as a standalone line — footer first, then header
    const arabicRe = /(?:^|\n)\s*(\d{1,4})\s*(?:\n|$)/;
    const af = footer.match(arabicRe);
    if (af?.[1]) return af[1];
    const ah = header.match(arabicRe);
    if (ah?.[1]) return ah[1];

    // Fallback: physical PDF page number
    return physPage.toString();
  }

  /**
   * Split text into chunks, assigning real page labels from `--- Page N ---`
   * markers when available; falls back to character-offset estimation otherwise.
   */
  private chunkText(
    text: string,
    chunkSize = 1000,
    overlap = 200
  ): Array<{ text: string; pageLabel: string; isEstimated: boolean }> {
    const pageMap = this.buildPageMap(text);
    const chunks: Array<{ text: string; pageLabel: string; isEstimated: boolean }> = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const raw = text.slice(startIndex, endIndex);
      // Strip markers from stored text so they don't pollute embeddings
      const clean = raw
        .replace(/--- Page \d+ ---\n?/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (clean.length > 50) {
        let pageLabel: string;
        let isEstimated: boolean;

        if (pageMap.length > 0) {
          // Last page map entry whose textStart ≤ this slice start
          let entry = pageMap[0];
          for (const p of pageMap) {
            if (p.textStart <= startIndex) entry = p;
            else break;
          }
          pageLabel = entry.displayLabel;
          isEstimated = false;
        } else {
          pageLabel = String(Math.max(1, Math.ceil((startIndex + 1) / DatabaseRAGService.AVG_CHARS_PER_PAGE)));
          isEstimated = true;
        }

        chunks.push({ text: clean, pageLabel, isEstimated });
      }

      startIndex += chunkSize - overlap;
    }

    return chunks;
  }

  /** Used only by the chunkText estimation fallback */
  private estimatePage(startChar: number): number {
    return Math.max(1, Math.ceil((startChar + 1) / DatabaseRAGService.AVG_CHARS_PER_PAGE));
  }

  /**
   * Add a policy to the knowledge base
   * Stores policy in database and creates embeddings in pgvector
   */
  async addPolicy(
    document: PolicyDocument,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ policyId: number; chunks: number }> {
    // Create or update policy in database
    const [policy, created] = await PolicyModel.findOrCreate({
      where: {
        title: document.title,
        schoolId: document.schoolId,
      },
      defaults: {
        policyId: uuidv4(),
        title: document.title,
        content: document.content,
        category: document.category,
        schoolId: document.schoolId,
        schoolName: document.schoolName,
        visibility: 'school_only',
        active: true,
        metadata: document.metadata || {},
      },
    });

    if (!created) {
      // Update existing policy
      await policy.update({
        content: document.content,
        category: document.category,
        metadata: document.metadata,
      });

      // Delete old embeddings
      await this.vectorService.deleteByPolicyId(policy.id);
    }

    // Chunk the document
    const chunks = this.chunkText(document.content);
    console.log(`Processing ${chunks.length} chunks for: ${document.title}`);

    // Generate and store embeddings
    const embeddingsToStore = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.generateEmbedding(chunks[i].text);

      embeddingsToStore.push({
        policyId: policy.id,
        chunkText: chunks[i].text,
        embedding,
        chunkIndex: i,
        schoolId: document.schoolId,
        schoolName: document.schoolName,
        metadata: {
          title: document.title,
          category: document.category,
          // pageLabel is the printed label ("iv", "1", "23"); backward-compat
          // estimatedPage kept for chunks stored before this change.
          pageLabel: chunks[i].pageLabel,
          pageIsEstimated: chunks[i].isEstimated,
          estimatedPage: chunks[i].isEstimated ? (parseInt(chunks[i].pageLabel) || undefined) : undefined,
        },
      });

      // Rate limiting for Hugging Face free tier
      if (this.provider === 'huggingface') {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Report per-chunk progress
      if (onProgress) onProgress(i + 1, chunks.length);
    }

    // Bulk store embeddings
    await this.vectorService.bulkStoreEmbeddings(embeddingsToStore);

    console.log(`✓ Added policy: ${document.title} (${chunks.length} chunks)`);

    return { policyId: policy.id, chunks: chunks.length };
  }

  /**
   * Embed an admin Q&A pair so future similar questions are answered by the AI
   * rather than escalated again. Called automatically after an admin responds
   * to an escalated query.
   */
  async embedAdminQA(
    question: string,
    answer: string,
    schoolId: string,
    schoolName: string
  ): Promise<void> {
    // Find or lazily create the per-school Admin Q&A knowledge bucket.
    const [policy] = await PolicyModel.findOrCreate({
      where: { title: 'Admin Q&A Knowledge Base', schoolId },
      defaults: {
        policyId: uuidv4(),
        title: 'Admin Q&A Knowledge Base',
        content: '',
        category: 'ADMIN_QA',
        schoolId,
        schoolName: schoolName || schoolId,
        visibility: 'school_only',
        active: true,
        metadata: { source: 'admin_qa' },
      },
    });

    // Store the question+answer pair as a single chunk.
    // We embed the *question* text so cosine similarity on incoming student
    // queries will reliably surface this chunk.
    const chunkText = `Question: ${question}\n\nAnswer: ${answer}`;
    const embedding = await this.generateEmbedding(question);

    await this.vectorService.bulkStoreEmbeddings([
      {
        policyId: policy.id,
        chunkText,
        embedding,
        chunkIndex: 0,
        schoolId,
        schoolName: schoolName || schoolId,
        metadata: {
          title: 'Admin Q&A Knowledge Base',
          category: 'ADMIN_QA',
          source: 'admin_qa',
        },
      },
    ]);

    console.log(`✓ Embedded admin Q&A pair for school ${schoolId}: "${question.slice(0, 60)}…"`);
  }

  /**
   * Produce a clean, compact sources array from raw retrieval chunks.
   *
   * Rules:
   * - Exclude keyword-synthetic fillers (similarity === 0.30 exactly) unless
   *   they are the only results.
   * - Sort by similarity descending.
   * - Keep at most MAX_SOURCES (default 3).
   * - Clean excerpt: collapse newlines/pipes/excess whitespace, truncate to
   *   150 characters so the UI stays readable.
   */
  private buildCleanSources(
    chunks: Array<{
      policyId: number;
      chunkText: string;
      similarity: number;
      metadata?: unknown;
    }>,
    policyTitleMap: Map<number, string>,
    maxSources = 3
  ): PolicyResponse['sources'] {
    const SYNTHETIC_SIMILARITY = 0.30;
    const MIN_SIMILARITY = 0.38; // below this the chunk is mostly noise for the student

    // Prefer real semantic hits; fall back to all chunks if nothing qualifies
    const meaningful = chunks.filter(
      (c) => c.similarity > SYNTHETIC_SIMILARITY && c.similarity >= MIN_SIMILARITY
    );
    const candidates = meaningful.length > 0 ? meaningful : chunks;

    // Sort best first, cap
    const top = [...candidates]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxSources);

    return top.map((chunk) => {
      const meta = chunk.metadata as Record<string, string | number | boolean> | undefined;
      // Prefer explicit pageLabel (new chunks); fall back to estimatedPage (old chunks)
      const pageLabel = meta?.pageLabel
        ? String(meta.pageLabel)
        : meta?.estimatedPage
          ? String(meta.estimatedPage)
          : undefined;
      const isEstimated = meta?.pageLabel ? Boolean(meta.pageIsEstimated) : true;

      // Clean the excerpt: join broken lines, strip OCR pipe artefacts,
      // collapse whitespace, hard-truncate.
      const cleanExcerpt = chunk.chunkText
        .replace(/\|/g, ' ')          // OCR table pipes
        .replace(/\n+/g, ' ')          // line breaks → space
        .replace(/\s{2,}/g, ' ')       // collapse runs of spaces
        .replace(/[\x00-\x1F]/g, '')   // control chars
        .trim()
        .slice(0, 150)
        .replace(/\s+\S*$/, '')        // avoid cutting mid-word
        .trimEnd() + '…';

      const policyTitle =
        policyTitleMap.get(chunk.policyId) ||
        String(meta?.title || 'Policy Document');

      return {
        policyId: chunk.policyId,
        policyTitle,
        excerpt: cleanExcerpt,
        similarity: chunk.similarity,
        pageReference: pageLabel ? `p. ${isEstimated ? '~' : ''}${pageLabel}` : undefined,
      };
    });
  }

  /**
   * Answer a student's query using RAG with database-backed search
   */
  async answerQuery(query: PolicyQuery): Promise<PolicyResponse> {
    const startTime = Date.now();

    // ── Fast path: answer cache ───────────────────────────────────────────────
    const cachedAnswer = getCachedAnswer(query.query, query.schoolId);
    if (cachedAnswer) {
      console.log(`[RAG] cache HIT for "${query.query.slice(0, 60)}" (${query.schoolId})`);
      const cachedResponse: PolicyResponse = {
        id: uuidv4(),
        query: query.query,
        answer: cachedAnswer.answer,
        confidence: cachedAnswer.confidence,
        sources: cachedAnswer.sources,
        requiresEscalation: cachedAnswer.requiresEscalation,
        timestamp: new Date(),
        studentContext: query.studentContext,
        responseTimeMs: Date.now() - startTime,
      };
      // Still persist to DB for audit trail (async, non-blocking)
      this.saveQuery(query, cachedResponse, Date.now() - startTime).catch(() => {});
      return cachedResponse;
    }

    // Initialised before try so the outer catch always has real retrieval
    // diagnostics if retrieval succeeded but generation threw.
    let retrievalDiagnosticsBase: {
      schoolId?: string;
      topSimilarity: number | null;
      candidatesScanned: number;
      thresholdUsed: number;
      filteredOutCount: number;
      failureReason?: 'NO_CANDIDATES' | 'BELOW_THRESHOLD' | 'NO_GROUNDED_ANSWER';
    } = {
      schoolId: query.schoolId,
      topSimilarity: null,
      candidatesScanned: 0,
      thresholdUsed: this.getRetrievalThreshold(),
      filteredOutCount: 0,
      failureReason: 'NO_CANDIDATES',
    };

    try {
      // Step 1: Generate query embedding + keyword extraction in parallel
      const t0 = Date.now();
      const keywords = this.extractKeywords(query.query);
      const [queryEmbedding, earlyKeywordChunks] = await Promise.all([
        this.generateEmbedding(query.query),
        keywords.length > 0
          ? this.vectorService.findByKeyword(keywords, {
              topK: DatabaseRAGService.KEYWORD_FALLBACK_TOP_K,
              schoolId: query.schoolId,
              fallbackSimilarity: Math.max(this.getRetrievalThreshold(), 0.30),
            })
          : Promise.resolve([] as typeof semanticCandidates),
      ]);
      console.log(`[RAG] embed+keyword: ${Date.now() - t0}ms`);

      // Step 2: Semantic search — find similar chunks using pgvector
      const t1 = Date.now();
      const threshold = this.getRetrievalThreshold();
      const semanticCandidates = await this.vectorService.findSimilar(queryEmbedding, {
        topK: DatabaseRAGService.DEFAULT_RETRIEVAL_TOP_K,
        threshold: 0,
        schoolId: query.schoolId,
      });
      console.log(`[RAG] semantic: ${Date.now() - t1}ms (${semanticCandidates.length} candidates)`);
      // Step 2b: Merge keyword results (already fetched in parallel above).
      // Keyword chunks are prepended so they appear first in the LLM context.
      let candidates = semanticCandidates;
      let keywordOnlyChunks: typeof semanticCandidates = [];
      if (earlyKeywordChunks.length > 0) {
        const existingIds = new Set(semanticCandidates.map((c) => c.id));
        keywordOnlyChunks = earlyKeywordChunks.filter((c) => !existingIds.has(c.id));
        if (keywordOnlyChunks.length > 0) {
          console.log(`[RAG] keyword search added ${keywordOnlyChunks.length} chunk(s) for: "${query.query}"`);
          candidates = [...keywordOnlyChunks, ...semanticCandidates];
        }
      }

      const relevantChunks = candidates.filter((chunk) => chunk.similarity >= threshold);

      // Update with real retrieval data — now visible to catch even if generation throws later
      retrievalDiagnosticsBase = {
        schoolId: query.schoolId,
        topSimilarity: candidates[0]?.similarity ?? null,
        candidatesScanned: candidates.length,
        thresholdUsed: threshold,
        filteredOutCount: Math.max(candidates.length - relevantChunks.length, 0),
      };

      if (relevantChunks.length === 0) {
        const response = this.createLowConfidenceResponse(
          query,
          'No policy passage matched strongly enough for a reliable answer. Ask admin to upload or activate a policy section covering this topic',
          {
            ...retrievalDiagnosticsBase,
            failureReason: candidates.length === 0 ? 'NO_CANDIDATES' : 'BELOW_THRESHOLD',
          }
        );
        await this.saveQuery(query, response, Date.now() - startTime);
        return response;
      }

      // Step 3: Get school name from first result
      const schoolName = relevantChunks[0].schoolName;

      // Step 4: Build context from relevant chunks
      const context = this.buildContext(relevantChunks, query.studentContext);

      // Step 5: Generate answer using LLM
      // Wrapped in its own try-catch so generation failures preserve real retrieval diagnostics
      let answer: string;
      const t2 = Date.now();
      try {
        answer = await this.generateAnswer(query.query, context, schoolName);
        console.log(`[RAG] llm_answer: ${Date.now() - t2}ms`);
      } catch (generationError) {
        const errMsg = generationError instanceof Error ? generationError.message : 'LLM generation failed';
        console.error('RAG generation error:', errMsg);
        const response = this.createLowConfidenceResponse(
          query,
          `AI model failed to generate an answer. Check HF_GENERATION_MODEL in your .env. (${errMsg})`,
          { ...retrievalDiagnosticsBase, failureReason: 'NO_GROUNDED_ANSWER' }
        );
        await this.saveQuery(query, response, Date.now() - startTime);
        return response;
      }

      const noGroundedAnswer = this.isLikelyUngroundedAnswer(answer);

      if (noGroundedAnswer) {
        // Before giving up, retry with keyword-only chunks if we have them and
        // they weren't already in the relevantChunks context.
        // This handles the case where semantic search missed the right chunks
        // but keyword search found them.
        if (keywordOnlyChunks.length > 0) {
          console.log(`[RAG] first attempt ungrounded — retrying with ${keywordOnlyChunks.length} keyword-only chunk(s)`);
          const kwContext = this.buildContext(keywordOnlyChunks, query.studentContext);
          try {
            const kwAnswer = await this.generateAnswer(query.query, kwContext, relevantChunks[0]?.schoolName);
            if (!this.isLikelyUngroundedAnswer(kwAnswer)) {
              // Keyword retry succeeded — use this answer
              const kwConfidence = this.calculateConfidence(keywordOnlyChunks);
              const uniqueKwPolicyIds = [...new Set(keywordOnlyChunks.map((c) => c.policyId))];
              let kwPolicyTitleMap = getCachedPolicyTitles(query.schoolId ?? '');
              if (!kwPolicyTitleMap) {
                const kwPolicies = await PolicyModel.findAll({ where: { id: uniqueKwPolicyIds } });
                kwPolicyTitleMap = new Map(kwPolicies.map((p) => [p.id, p.title]));
                setCachedPolicyTitles(query.schoolId ?? '', kwPolicyTitleMap);
              }
              const kwConfThr = this.getConfidenceThresholds();
              const kwSources = this.buildCleanSources(keywordOnlyChunks, kwPolicyTitleMap);
              const kwAnswerIsSubstantive = this.isAnswerSubstantive(kwAnswer);
              const kwEscalate =
                !kwAnswerIsSubstantive ||
                (kwConfidence < kwConfThr.escalate && !kwAnswerIsSubstantive) ||
                kwSources.length === 0;
              const kwResponse: PolicyResponse = {
                id: uuidv4(),
                query: query.query,
                answer: kwAnswer,
                confidence: kwConfidence >= kwConfThr.high ? 'HIGH' : kwConfidence >= kwConfThr.medium ? 'MEDIUM' : 'LOW',
                // Strip sources when escalating — showing sources on "I don't know" is misleading
                sources: kwEscalate ? [] : kwSources,

              requiresEscalation: kwEscalate,
                timestamp: new Date(),
                studentContext: query.studentContext,
                responseTimeMs: Date.now() - startTime,
                retrievalDiagnostics: { ...retrievalDiagnosticsBase, candidatesScanned: candidates.length },
              };
              await this.saveQuery(query, kwResponse, Date.now() - startTime);
              return kwResponse;
            }
          } catch (retryError) {
            console.warn('[RAG] keyword retry generation failed:', retryError);
          }
        }

        const response = this.createLowConfidenceResponse(
          query,
          'No policy passage matched strongly enough for a reliable answer. Ask admin to upload or activate a policy section covering this topic',
          {
            ...retrievalDiagnosticsBase,
            failureReason: 'NO_GROUNDED_ANSWER',
          }
        );
        await this.saveQuery(query, response, Date.now() - startTime);
        return response;
      }

      // Step 6: Calculate confidence
      const confidence = this.calculateConfidence(relevantChunks);
      const confThr = this.getConfidenceThresholds();

      // Step 7: Fetch real policy titles — use in-memory cache to avoid repeated DB calls
      const uniquePolicyIds = [...new Set(relevantChunks.map((c) => c.policyId))];
      let policyTitleMap = getCachedPolicyTitles(query.schoolId ?? '');
      if (!policyTitleMap) {
        const policies = await PolicyModel.findAll({ where: { id: uniquePolicyIds } });
        policyTitleMap = new Map(policies.map((p) => [p.id, p.title]));
        setCachedPolicyTitles(query.schoolId ?? '', policyTitleMap);
      }

      // Step 7: Build sources first — needed to make the escalation decision
      const sources = this.buildCleanSources(relevantChunks, policyTitleMap);

      // Escalate if:
      //  a) confidence is low AND the answer isn't substantive, OR
      //  b) sources is empty — the AI answered with general knowledge, not policy docs, OR
      //  c) the answer is non-substantive (hedging/refusal) regardless of confidence
      const answerIsSubstantive = this.isAnswerSubstantive(answer);
      const escalate =
        !answerIsSubstantive ||
        (confidence < confThr.escalate && !answerIsSubstantive) ||
        sources.length === 0;

      const response: PolicyResponse = {
        id: uuidv4(),
        query: query.query,
        answer,
        confidence: confidence >= confThr.high ? 'HIGH' : confidence >= confThr.medium ? 'MEDIUM' : 'LOW',
        // When escalating, strip sources — showing sources on "I don't know" is misleading
        sources: escalate ? [] : sources,

        requiresEscalation: escalate,
        timestamp: new Date(),
        studentContext: query.studentContext,
        responseTimeMs: Date.now() - startTime,
        retrievalDiagnostics: retrievalDiagnosticsBase,
      };

      console.log(`[RAG] total: ${Date.now() - startTime}ms`);

      // Store in answer cache (only non-escalated answers to avoid caching bad content)
      if (!escalate) {
        setCachedAnswer(query.query, query.schoolId, {
          answer: response.answer,
          confidence: response.confidence,
          sources: response.sources,
          requiresEscalation: false,
        });
      }

      // Save query to database
      await this.saveQuery(query, response, Date.now() - startTime);

      return response;
    } catch (error) {
      // Outer catch: embedding or retrieval-level failure
      console.error('RAG query error:', error);
      const response = this.createLowConfidenceResponse(
        query,
        error instanceof Error ? error.message : 'An error occurred',
        retrievalDiagnosticsBase, // uses real retrieval data if retrieval already succeeded
      );
      await this.saveQuery(query, response, Date.now() - startTime);
      return response;
    }
  }

  /**
   * Streaming version of answerQuery.
   * The controller must set SSE headers and call res.flushHeaders() BEFORE calling this.
   * This method writes SSE tokens and finishes with a `done` event containing metadata.
   */
  async answerQueryStream(query: PolicyQuery, res: ExpressResponse): Promise<void> {
    const startTime = Date.now();

    // ── Fast path: serve cached answer by replaying it in one SSE event ───────
    const cachedAnswer = getCachedAnswer(query.query, query.schoolId);
    if (cachedAnswer) {
      console.log(`[RAG-stream] cache HIT "${query.query.slice(0, 60)}"`);
      res.write(`data: ${JSON.stringify({ token: cachedAnswer.answer })}\n\n`);
      const cachedId = uuidv4();
      res.write(
        `data: ${JSON.stringify({
          done: true,
          meta: {
            queryId: cachedId,
            confidence: cachedAnswer.confidence,
            sources: cachedAnswer.sources,
            requiresEscalation: false,
            cached: true,
          },
        })}\n\n`,
      );
      res.end();
      return;
    }

    let retrievalDiagnosticsBase: PolicyResponse['retrievalDiagnostics'] = {
      schoolId: query.schoolId,
      topSimilarity: null,
      candidatesScanned: 0,
      thresholdUsed: this.getRetrievalThreshold(),
      filteredOutCount: 0,
      failureReason: 'NO_CANDIDATES',
    };

    try {
      // Step 1: Embed + keyword in parallel
      const t0 = Date.now();
      const keywords = this.extractKeywords(query.query);
      const [queryEmbedding, earlyKeywordChunks] = await Promise.all([
        this.generateEmbedding(query.query),
        keywords.length > 0
          ? this.vectorService.findByKeyword(keywords, {
              topK: DatabaseRAGService.KEYWORD_FALLBACK_TOP_K,
              schoolId: query.schoolId,
              fallbackSimilarity: Math.max(this.getRetrievalThreshold(), 0.30),
            })
          : Promise.resolve([] as Awaited<ReturnType<typeof this.vectorService.findByKeyword>>),
      ]);
      console.log(`[RAG-stream] embed+keyword: ${Date.now() - t0}ms`);

      // Step 2: Semantic search
      const t1 = Date.now();
      const threshold = this.getRetrievalThreshold();
      const semanticCandidates = await this.vectorService.findSimilar(queryEmbedding, {
        topK: DatabaseRAGService.DEFAULT_RETRIEVAL_TOP_K,
        threshold: 0,
        schoolId: query.schoolId,
      });
      console.log(`[RAG-stream] semantic: ${Date.now() - t1}ms`);

      // Merge keyword results
      let candidates = semanticCandidates;
      if (earlyKeywordChunks.length > 0) {
        const existingIds = new Set(semanticCandidates.map((c) => c.id));
        const kwOnly = earlyKeywordChunks.filter((c) => !existingIds.has(c.id));
        if (kwOnly.length > 0) candidates = [...kwOnly, ...semanticCandidates];
      }

      const relevantChunks = candidates.filter((c) => c.similarity >= threshold);

      retrievalDiagnosticsBase = {
        schoolId: query.schoolId,
        topSimilarity: candidates[0]?.similarity ?? null,
        candidatesScanned: candidates.length,
        thresholdUsed: threshold,
        filteredOutCount: Math.max(candidates.length - relevantChunks.length, 0),
      };

      if (relevantChunks.length === 0) {
        const errorMsg =
          'No policy passage matched strongly enough. Ask admin to upload or activate a policy section covering this topic.';
        res.write(`data: ${JSON.stringify({ token: errorMsg })}\n\n`);
        const lowId = uuidv4();
        res.write(
          `data: ${JSON.stringify({
            done: true,
            meta: { queryId: lowId, confidence: 'LOW', sources: [], requiresEscalation: true },
          })}\n\n`,
        );
        res.end();
        return;
      }

      const schoolName = relevantChunks[0].schoolName;
      const context = this.buildContext(relevantChunks, query.studentContext);

      // Step 3: Stream LLM tokens
      const t2 = Date.now();
      const accumulated = await this.generateAnswerStream(query.query, context, schoolName, res);
      console.log(`[RAG-stream] llm_stream: ${Date.now() - t2}ms, total: ${Date.now() - startTime}ms`);

      // Step 4: Post-stream — compute confidence, sources, escalation
      const confidence = this.calculateConfidence(relevantChunks);
      const confThr = this.getConfidenceThresholds();

      // Policy titles (cached)
      let policyTitleMap = getCachedPolicyTitles(query.schoolId ?? '');
      if (!policyTitleMap) {
        const uniqueIds = [...new Set(relevantChunks.map((c) => c.policyId))];
        const policies = await PolicyModel.findAll({ where: { id: uniqueIds } });
        policyTitleMap = new Map(policies.map((p) => [p.id, p.title]));
        setCachedPolicyTitles(query.schoolId ?? '', policyTitleMap);
      }

      const confidenceLabel: PolicyResponse['confidence'] =
        confidence >= confThr.high ? 'HIGH' : confidence >= confThr.medium ? 'MEDIUM' : 'LOW';
      const sources = this.buildCleanSources(relevantChunks, policyTitleMap);

      // Escalate if:
      //  a) confidence is low AND answer isn't substantive, OR
      //  b) no policy sources (AI used general knowledge), OR
      //  c) answer is non-substantive (hedging/refusal) regardless of confidence
      const streamAnswerIsSubstantive = this.isAnswerSubstantive(accumulated);
      const escalate =
        !streamAnswerIsSubstantive ||
        (confidence < confThr.escalate && !streamAnswerIsSubstantive) ||
        sources.length === 0;

      const responseId = uuidv4();

      // Persist to DB BEFORE sending the done event so any immediate
      // history re-fetch from the frontend finds the record already saved.
      const streamResponse: PolicyResponse = {
        id: responseId,
        query: query.query,
        answer: accumulated,
        confidence: confidenceLabel,
        sources,
        requiresEscalation: escalate,
        timestamp: new Date(),
        studentContext: query.studentContext,
        responseTimeMs: Date.now() - startTime,
        retrievalDiagnostics: retrievalDiagnosticsBase,
      };
      await this.saveQuery(query, streamResponse, Date.now() - startTime);

      // Cache the answer after DB write
      if (!escalate) {
        setCachedAnswer(query.query, query.schoolId, {
          answer: accumulated,
          confidence: confidenceLabel,
          sources,
          requiresEscalation: false,
        });
      }

      // Now send the done event — frontend history refetch will find the saved record
      // When escalating, strip sources — showing sources on "I don't know" is misleading
      res.write(
        `data: ${JSON.stringify({
          done: true,
          meta: {
            queryId: responseId,
            confidence: confidenceLabel,
            sources: escalate ? [] : sources,
            requiresEscalation: escalate,
          },
        })}\n\n`,
      );
      res.end();
    } catch (error) {
      console.error('[RAG-stream] error:', error);
      const errMsg = error instanceof Error ? error.message : 'An error occurred';
      try {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
          res.write(`data: ${JSON.stringify({ done: true, meta: { queryId: uuidv4(), confidence: 'LOW', sources: [], requiresEscalation: true } })}\n\n`);
          res.end();
        }
      } catch { /* ignore write-after-end */ }
    }
  }

  /**
   * Save query to database for analytics
   */
  private async saveQuery(
    query: PolicyQuery,
    response: PolicyResponse,
    responseTimeMs: number
  ): Promise<void> {
    try {
      await Query.create({
        queryId: response.id,
        query: query.query,
        answer: response.answer,
        confidence: response.confidence === 'HIGH' ? 0.9 : response.confidence === 'MEDIUM' ? 0.7 : 0.4,
        requiresEscalation: response.requiresEscalation,
        userId: query.userId ? parseInt(query.userId) : undefined,
        schoolId: query.schoolId,
        studentContext: query.studentContext || {},
        sources: response.sources,
        responseTime: responseTimeMs,
        conversationId: query.conversationId,
        metadata: {
          retrievalDiagnostics: response.retrievalDiagnostics || null,
        },
      });
    } catch (error) {
      console.error('Failed to save query:', error);
    }
  }

  /**
   * Build context string from relevant chunks
   */
  private buildContext(
    chunks: Array<{ chunkText: string; metadata?: Record<string, unknown>; similarity: number }>,
    studentContext?: StudentContext
  ): string {
    let context = '';

    if (studentContext) {
      const contextParts = [];
      if (studentContext.year) contextParts.push(`Year: ${studentContext.year}`);
      if (studentContext.department) contextParts.push(`Department: ${studentContext.department}`);
      if (studentContext.program) contextParts.push(`Program: ${studentContext.program}`);
      if (contextParts.length > 0) {
        context += `Student Information: ${contextParts.join(', ')}\n\n`;
      }
    }

    context += 'Relevant Policy Information:\n\n';
    chunks.forEach((chunk, index) => {
      const meta = chunk.metadata as Record<string, string | number | boolean> | undefined;
      const title = meta?.title || 'Policy';
      const pl = meta?.pageLabel ? String(meta.pageLabel) : meta?.estimatedPage ? String(meta.estimatedPage) : null;
      const pageStr = pl ? ` | Page ${meta?.pageIsEstimated ? '~' : ''}${pl}` : '';
      context += `[${index + 1}] ${title}${pageStr} (Relevance: ${(chunk.similarity * 100).toFixed(0)}%)\n`;
      context += `${chunk.chunkText}\n\n`;
    });

    return context;
  }

  /**
   * Calculate confidence score based on similarity scores
   */
  private calculateConfidence(
    chunks: Array<{ similarity: number }>
  ): number {
    if (chunks.length === 0) return 0;

    // Only use chunks with non-synthetic similarity for confidence calc
    // Keyword-fallback chunks have synthetic similarity (0.30) which dilutes the score;
    // filter them out if we have any real semantic results.
    const KEYWORD_SYNTHETIC_SIM = 0.30;
    const semanticChunks = chunks.filter((c) => c.similarity > KEYWORD_SYNTHETIC_SIM);
    const scored = semanticChunks.length > 0 ? semanticChunks : chunks;

    const topSimilarity = scored[0].similarity;
    const avgRest =
      scored.length > 1
        ? scored.slice(1).reduce((sum, c) => sum + c.similarity, 0) / (scored.length - 1)
        : topSimilarity;

    // Weighted average: top result gets 70%, average of rest gets 30%
    return topSimilarity * 0.7 + avgRest * 0.3;
  }

  /**
   * Provider-aware confidence band thresholds.
   * HuggingFace all-MiniLM-L6-v2 produces lower absolute cosine scores (0.30-0.55)
   * than OpenAI text-embedding-3-small (0.65-0.90), so thresholds are scaled accordingly.
   */
  private getConfidenceThresholds(): { high: number; medium: number; escalate: number } {
    if (this.provider === 'openai') {
      return { high: 0.85, medium: 0.70, escalate: 0.70 };
    }
    // HuggingFace / sentence-transformers
    return { high: 0.55, medium: 0.40, escalate: 0.35 };
  }

  /**
   * Returns true if the LLM produced a real, grounded answer.
   *
   * OCR-extracted factual lists (names, dates, procedures) consistently score
   * low cosine similarity with MiniLM even when retrieval and generation are
   * correct.  We treat any substantive answer as "answered" and suppress
   * escalation so the student isn't unnecessarily sent to a human advisor.
   *
   * Escalation is still triggered when the answer is:
   *  - Too short to be informative (<80 chars)
   *  - An explicit soft refusal ("I'm not confident", "I don't have", etc.)
   *  - The literal NO_GROUNDED_ANSWER sentinel
   */
  private isAnswerSubstantive(answer: string): boolean {
    if (!answer || answer.length < 80) return false;
    const lower = answer.toLowerCase();
    const refusalPhrases = [
      'no_grounded_answer',
      "i'm not confident",
      "i am not confident",
      "i don't have information",
      "i do not have information",
      "i cannot find",
      "i could not find",
      "no information available",
      "not covered in the",
      "unable to answer",
      'this query has been escalated',
      // Hedging / "I don't really have an answer" patterns
      'does not contain specific information',
      'does not contain information',
      'does not provide specific',
      'does not include specific',
      'does not directly address',
      'does not specifically address',
      'does not explicitly',
      'i would need more detailed information',
      'i would need more information',
      'need more detailed information',
      'to provide a comprehensive answer',
      'to provide a precise answer',
      'to give you a precise answer',
      'if you have additional context',
      'please provide them',
      'the provided context does not',
      'the context does not',
      'not enough information in the',
      'no relevant information',
      'beyond the scope of',
      'outside the scope of',
      'not within the scope',
    ];
    return !refusalPhrases.some((phrase) => lower.includes(phrase));
  }

  /**
   * Create low confidence response for escalation
   */
  private createLowConfidenceResponse(
    query: PolicyQuery,
    reason: string,
    retrievalDiagnostics?: PolicyResponse['retrievalDiagnostics']
  ): PolicyResponse {
    return {
      id: uuidv4(),
      query: query.query,
      answer: `I apologize, but I'm not confident about answering this question. ${reason}. This query has been escalated to a human advisor who will respond shortly.`,
      confidence: 'LOW',
      sources: [],
      requiresEscalation: true,
      timestamp: new Date(),
      studentContext: query.studentContext,
      retrievalDiagnostics,
    };
  }

  async debugRetrieval(
    queryText: string,
    options: { schoolId?: string; topK?: number } = {}
  ): Promise<{
    schoolId?: string;
    thresholdUsed: number;
    candidatesScanned: number;
    acceptedCount: number;
    filteredOutCount: number;
    topSimilarity: number | null;
    candidates: Array<{
      policyId: number;
      policyTitle: string;
      similarity: number;
      excerpt: string;
      accepted: boolean;
    }>;
  }> {
    const threshold = this.getRetrievalThreshold();
    const topK = options.topK && options.topK > 0 ? Math.min(options.topK, 20) : 10;
    const queryEmbedding = await this.generateEmbedding(queryText);
    const candidates = await this.vectorService.findSimilar(queryEmbedding, {
      topK,
      threshold: 0,
      schoolId: options.schoolId,
    });

    const uniquePolicyIds = [...new Set(candidates.map((c) => c.policyId))];
    const policies = await PolicyModel.findAll({ where: { id: uniquePolicyIds } });
    const policyTitleMap = new Map(policies.map((p) => [p.id, p.title]));
    const acceptedCount = candidates.filter((c) => c.similarity >= threshold).length;

    return {
      schoolId: options.schoolId,
      thresholdUsed: threshold,
      candidatesScanned: candidates.length,
      acceptedCount,
      filteredOutCount: Math.max(candidates.length - acceptedCount, 0),
      topSimilarity: candidates[0]?.similarity ?? null,
      candidates: candidates.map((chunk) => ({
        policyId: chunk.policyId,
        policyTitle:
          policyTitleMap.get(chunk.policyId) ||
          (chunk.metadata as Record<string, string>)?.title ||
          'Policy Document',
        similarity: chunk.similarity,
        excerpt: `${chunk.chunkText.substring(0, 220)}...`,
        accepted: chunk.similarity >= threshold,
      })),
    };
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    provider: string;
    totalPolicies: number;
    totalChunks: number;
    embeddingModel: string;
    generationModel: string;
    embeddingDimension: number;
  }> {
    const [policyCount] = await sequelize.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM policies WHERE active = true',
      { type: QueryTypes.SELECT }
    );

    const vectorStats = await this.vectorService.getStats();

    return {
      provider: this.provider,
      totalPolicies: parseInt(policyCount?.count || '0'),
      totalChunks: vectorStats.totalEmbeddings,
      embeddingModel: this.provider === 'openai' ? this.openaiEmbeddingModel : this.hfEmbeddingModel,
      generationModel: this.provider === 'openai' ? this.openaiGenerationModel : this.hfGenerationModel,
      embeddingDimension: this.provider === 'openai' ? 1536 : EMBEDDING_DIMENSION,
    };
  }

  /**
   * Remove a policy and its embeddings
   */
  async removePolicy(policyId: number): Promise<void> {
    await this.vectorService.deleteByPolicyId(policyId);
    await PolicyModel.destroy({ where: { id: policyId } });
  }

  /**
   * Search policies by text (direct search, not RAG)
   */
  async searchPolicies(
    searchQuery: string,
    options: { schoolId?: string; topK?: number } = {}
  ): Promise<Array<{ policyId: number; title: string; excerpt: string; similarity: number }>> {
    const queryEmbedding = await this.generateEmbedding(searchQuery);
    const results = await this.vectorService.findSimilar(queryEmbedding, {
      topK: options.topK || 10,
      threshold: 0.3,
      schoolId: options.schoolId,
    });

    // Deduplicate by policy ID (take highest similarity per policy)
    const policyMap = new Map<
      number,
      { policyId: number; title: string; excerpt: string; similarity: number }
    >();

    for (const result of results) {
      const existing = policyMap.get(result.policyId);
      if (!existing || result.similarity > existing.similarity) {
        policyMap.set(result.policyId, {
          policyId: result.policyId,
          title: (result.metadata as Record<string, string>)?.title || 'Policy',
          excerpt: result.chunkText.substring(0, 200) + '...',
          similarity: result.similarity,
        });
      }
    }

    return Array.from(policyMap.values()).sort((a, b) => b.similarity - a.similarity);
  }
}

export default DatabaseRAGService;
