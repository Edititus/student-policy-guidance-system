import { PolicyQuery, PolicyResponse, PolicyDocument } from '../models/Policy'
import { Response as ExpressResponse } from 'express'

/**
 * Common interface for RAG services (OpenAI, Hugging Face, etc.)
 * Allows easy switching between AI providers
 */
export interface IRAGService {
  /**
   * Answer a student's policy question using RAG
   */
  answerQuery(query: PolicyQuery): Promise<PolicyResponse>

  /**
   * Stream a student's policy answer token-by-token over an open SSE response.
   * Caller must set SSE headers and call res.flushHeaders() before invoking.
   */
  answerQueryStream?(query: PolicyQuery, res: ExpressResponse): Promise<void>

  /**
   * Add a policy document to the knowledge base
   */
  addPolicy(policy: PolicyDocument): Promise<void>

  /**
   * Load multiple policies into knowledge base
   */
  loadPolicies(policies: PolicyDocument[]): Promise<void>

  /**
   * Get statistics about the knowledge base
   */
  getStats(): {
    totalPolicies: number
    totalChunks: number
    embeddingModel: string
    generationModel?: string
    embeddingDimension: number
  }
}
