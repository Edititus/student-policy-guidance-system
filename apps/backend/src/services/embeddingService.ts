import { OpenAI } from 'openai'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PolicyDocument, PolicyEmbedding } from '../models/Policy'

/**
 * Service for generating embeddings and performing semantic search
 */
export class EmbeddingService {
  private openai: OpenAI
  private embeddings: OpenAIEmbeddings
  private embeddingModel = 'text-embedding-3-small' // Cheaper and faster than ada-002

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY
    if (!key) {
      throw new Error('OpenAI API key not provided')
    }

    this.openai = new OpenAI({ apiKey: key })
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: key,
      modelName: this.embeddingModel,
    })
  }

  /**
   * Generate embedding for a single text chunk
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      })
      return response.data[0].embedding
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`)
    }
  }

  /**
   * Generate embeddings for multiple text chunks (batch processing)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: texts,
      })
      return response.data.map((item) => item.embedding)
    } catch (error) {
      throw new Error(`Failed to generate batch embeddings: ${error}`)
    }
  }

  /**
   * Create embeddings for a policy document
   * Splits document into chunks and generates embedding for each
   */
  async embedPolicyDocument(
    policy: PolicyDocument,
    chunkSize: number = 1000,
    overlap: number = 200
  ): Promise<PolicyEmbedding[]> {
    const chunks = this.chunkText(policy.content, chunkSize, overlap)
    const embeddings = await this.generateEmbeddings(chunks)

    return chunks.map((chunk, index) => ({
      id: `${policy.id}_chunk_${index}`,
      policyId: policy.id,
      chunkText: chunk,
      embedding: embeddings[index],
      chunkIndex: index,
      metadata: {
        policyTitle: policy.title,
        category: policy.category,
        institution: policy.metadata.institution,
      },
    }))
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimensions')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Find most similar policy embeddings to a query
   * This is a simple in-memory search - for production, use a vector database
   */
  async searchSimilar(
    queryText: string,
    policyEmbeddings: PolicyEmbedding[],
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<Array<PolicyEmbedding & { similarity: number }>> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(queryText)

    // Calculate similarity with all policy embeddings
    const results = policyEmbeddings.map((policyEmb) => ({
      ...policyEmb,
      similarity: this.cosineSimilarity(queryEmbedding, policyEmb.embedding),
    }))

    // Filter by threshold and sort by similarity (descending)
    return results
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }

  /**
   * Split text into overlapping chunks
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.slice(start, end))
      start += chunkSize - overlap
    }

    return chunks
  }
}
