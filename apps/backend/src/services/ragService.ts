import { OpenAI } from 'openai'
import { EmbeddingService } from './embeddingService'
import {
  PolicyQuery,
  PolicyResponse,
  PolicyEmbedding,
  PolicyDocument,
  StudentContext,
} from '../models/Policy'
import { v4 as uuidv4 } from 'uuid'

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Core AI service that answers policy questions using:
 * 1. Semantic search to find relevant policies
 * 2. LLM (GPT) to generate contextual answers
 */
export class RAGService {
  private openai: OpenAI
  private embeddingService: EmbeddingService
  private model = 'gpt-4o-mini' // Balance of cost and quality

  // In-memory storage (replace with database in production)
  private policyEmbeddings: PolicyEmbedding[] = []
  private policies: Map<string, PolicyDocument> = new Map()

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY
    if (!key) {
      throw new Error('OpenAI API key not provided')
    }

    this.openai = new OpenAI({ apiKey: key })
    this.embeddingService = new EmbeddingService(key)
  }

  /**
   * Add a policy to the knowledge base
   */
  async addPolicy(policy: PolicyDocument): Promise<void> {
    // Store policy
    this.policies.set(policy.id, policy)

    // Generate embeddings for policy chunks
    const embeddings = await this.embeddingService.embedPolicyDocument(policy)
    this.policyEmbeddings.push(...embeddings)

    console.log(`Added policy: ${policy.title} (${embeddings.length} chunks)`)
  }

  /**
   * Load multiple policies into knowledge base
   */
  async loadPolicies(policies: PolicyDocument[]): Promise<void> {
    for (const policy of policies) {
      await this.addPolicy(policy)
    }
  }

  /**
   * Answer a student's policy question using RAG
   */
  async answerQuery(query: PolicyQuery): Promise<PolicyResponse> {
    try {
      // Step 1: Retrieve relevant policy chunks using semantic search
      const relevantChunks = await this.embeddingService.searchSimilar(
        query.query,
        this.policyEmbeddings,
        5, // Top 5 most relevant chunks
        0.7 // Minimum similarity threshold
      )

      if (relevantChunks.length === 0) {
        return this.createLowConfidenceResponse(query, 'No relevant policies found')
      }

      // Step 2: Build context from retrieved chunks
      const context = this.buildContext(relevantChunks, query.studentContext)

      // Step 3: Generate answer using LLM
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: this.getUserPrompt(query.query, context, query.studentContext),
          },
        ],
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 500,
      })

      const answer = completion.choices[0].message.content || 'Unable to generate answer'

      // Step 4: Determine confidence based on similarity scores
      const avgSimilarity =
        relevantChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / relevantChunks.length
      const confidence = this.determineConfidence(avgSimilarity, relevantChunks.length)

      // Step 5: Extract sources
      const sources = this.extractSources(relevantChunks)

      // Step 6: Decide if escalation is needed
      const escalated = confidence === 'LOW' || relevantChunks.length < 2

      return {
        id: uuidv4(),
        queryId: query.id,
        answer,
        confidence,
        sources,
        reasoning: `Found ${relevantChunks.length} relevant policy sections with average similarity ${avgSimilarity.toFixed(2)}`,
        escalated,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('Error in RAG service:', error)
      return this.createLowConfidenceResponse(query, `Error: ${error}`)
    }
  }

  /**
   * Build context string from retrieved chunks and student context
   */
  private buildContext(
    chunks: Array<PolicyEmbedding & { similarity: number }>,
    studentContext?: StudentContext
  ): string {
    let context = '=== RELEVANT POLICY INFORMATION ===\n\n'

    chunks.forEach((chunk, index) => {
      const policy = this.policies.get(chunk.policyId)
      context += `[Source ${index + 1}: ${chunk.metadata?.policyTitle || 'Unknown'}]\n`
      context += `${chunk.chunkText}\n\n`
    })

    if (studentContext) {
      context += '\n=== STUDENT CONTEXT ===\n'
      if (studentContext.program) context += `Program: ${studentContext.program}\n`
      if (studentContext.year) context += `Year: ${studentContext.year}\n`
      if (studentContext.level) context += `Level: ${studentContext.level}\n`
      if (studentContext.enrollmentStatus)
        context += `Enrollment: ${studentContext.enrollmentStatus}\n`
      if (studentContext.cgpa) context += `CGPA: ${studentContext.cgpa}\n`
    }

    return context
  }

  /**
   * System prompt that instructs the LLM on how to behave
   */
  private getSystemPrompt(): string {
    return `You are an AI assistant helping Nigerian university students understand institutional policies.

INSTRUCTIONS:
1. Answer questions accurately based ONLY on the provided policy information
2. Be clear, concise, and helpful - students may be confused or stressed
3. Use simple language - avoid jargon unless necessary
4. If the policy information doesn't fully answer the question, say so clearly
5. Cite specific policy names when referencing information
6. If student context is provided, personalize the answer
7. Always mention important deadlines, requirements, or exceptions
8. If consequences exist for policy violations, mention them
9. NEVER make up information - only use what's in the context
10. If you're uncertain, say "I'm not completely sure" and suggest contacting an administrator

TONE: Friendly, professional, supportive`
  }

  /**
   * User prompt with the question and context
   */
  private getUserPrompt(
    question: string,
    context: string,
    studentContext?: StudentContext
  ): string {
    return `${context}

=== STUDENT QUESTION ===
${question}

Please provide a clear, helpful answer based on the policy information above${
      studentContext ? ' and the student context' : ''
    }.`
  }

  /**
   * Determine confidence level based on retrieval quality
   */
  private determineConfidence(
    avgSimilarity: number,
    numChunks: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (avgSimilarity >= 0.85 && numChunks >= 3) {
      return 'HIGH'
    } else if (avgSimilarity >= 0.75 && numChunks >= 2) {
      return 'MEDIUM'
    } else {
      return 'LOW'
    }
  }

  /**
   * Extract source citations from retrieved chunks
   */
  private extractSources(
    chunks: Array<PolicyEmbedding & { similarity: number }>
  ): PolicyResponse['sources'] {
    const sourceMap = new Map<string, PolicyResponse['sources'][0]>()

    chunks.forEach((chunk) => {
      if (!sourceMap.has(chunk.policyId)) {
        const policy = this.policies.get(chunk.policyId)
        sourceMap.set(chunk.policyId, {
          policyId: chunk.policyId,
          policyTitle: chunk.metadata?.policyTitle || 'Unknown Policy',
          excerpt: chunk.chunkText.slice(0, 200) + '...',
          pageReference: policy?.metadata.pageNumber?.toString(),
        })
      }
    })

    return Array.from(sourceMap.values())
  }

  /**
   * Create a low-confidence response when retrieval fails
   */
  private createLowConfidenceResponse(query: PolicyQuery, reason: string): PolicyResponse {
    return {
      id: uuidv4(),
      queryId: query.id,
      answer:
        "I don't have enough information to answer this question confidently. Please contact the Student Affairs Office or Registrar for accurate guidance.",
      confidence: 'LOW',
      sources: [],
      reasoning: reason,
      escalated: true,
      timestamp: new Date(),
    }
  }

  /**
   * Get statistics about the knowledge base
   */
  getStats(): { policies: number; embeddings: number } {
    return {
      policies: this.policies.size,
      embeddings: this.policyEmbeddings.length,
    }
  }
}
