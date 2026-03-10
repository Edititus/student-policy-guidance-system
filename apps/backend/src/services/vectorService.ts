import sequelize from '../config/database';
import { PolicyEmbeddingModel } from '../models/PolicyEmbeddingModelPgVector';
import { QueryTypes } from 'sequelize';

/**
 * Vector embedding dimension for the current model
 * all-MiniLM-L6-v2 = 384 dimensions
+ */
export const EMBEDDING_DIMENSION = 384;

/**
 * Similarity search result interface
 */
export interface SimilarityResult {
  id: number;
  policyId: number;
  chunkText: string;
  chunkIndex: number;
  schoolId?: string;
  schoolName?: string;
  metadata?: Record<string, unknown>;
  similarity: number;
}

/**
 * VectorService - Handles all pgvector operations
 * Provides native PostgreSQL vector similarity search
 */
export class VectorService {
  private static instance: VectorService;
  private _pgVectorAvailable: boolean = false;

  private constructor() {}

  static getInstance(): VectorService {
    if (!VectorService.instance) {
      VectorService.instance = new VectorService();
    }
    return VectorService.instance;
  }

  get pgVectorAvailable(): boolean {
    return this._pgVectorAvailable;
  }

  /**
   * Check if pgvector extension is installed
   */
  async checkPgVectorInstalled(): Promise<boolean> {
    try {
      const result = await sequelize.query(
        `SELECT * FROM pg_extension WHERE extname = 'vector'`,
        { type: QueryTypes.SELECT }
      );
      this._pgVectorAvailable = result.length > 0;
      return this._pgVectorAvailable;
    } catch (error) {
      console.error('Error checking pgvector:', error);
      this._pgVectorAvailable = false;
      return false;
    }
  }

  /**
   * Initialize pgvector extension (requires superuser/db owner)
   * Throws on failure - use initializePgVectorSafe() for graceful fallback
   */
  async initializePgVector(): Promise<void> {
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector');
      this._pgVectorAvailable = true;
      console.log('✅ pgvector extension enabled');
    } catch (error) {
      console.error('❌ Failed to enable pgvector:', error);
      throw error;
    }
  }

  /**
   * Initialize pgvector with graceful fallback
   * Never throws - sets _pgVectorAvailable flag and logs status
   * Call this on server startup to allow app to run without pgvector
   */
  async initializePgVectorSafe(): Promise<boolean> {
    try {
      // First check if it's already installed
      const isInstalled = await this.checkPgVectorInstalled();
      if (isInstalled) {
        console.log('✅ pgvector extension already available');
        return true;
      }

      // Try to create it (may fail if extension files not installed)
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector');
      this._pgVectorAvailable = true;
      console.log('✅ pgvector extension enabled');
      return true;
    } catch (error) {
      this._pgVectorAvailable = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('could not open extension control file')) {
        console.warn('⚠️  pgvector extension not installed on this PostgreSQL instance');
        console.warn('   Install pgvector: https://github.com/pgvector/pgvector#installation');
        console.warn('   Falling back to JavaScript-based similarity search (slower)');
      } else {
        console.warn('⚠️  pgvector unavailable:', errorMessage);
        console.warn('   Falling back to JavaScript-based similarity search');
      }
      return false;
    }
  }

  /**
   * Check if the embedding column has the correct vector type
   * If it's double precision[] (Sequelize default), convert it to vector
   */
  async ensureVectorColumnType(): Promise<void> {
    try {
      // Check current column type
      const [columnInfo] = await sequelize.query<{ data_type: string; udt_name: string }>(
        `
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'policy_embeddings' AND column_name = 'embedding'
        `,
        { type: QueryTypes.SELECT }
      );

      if (!columnInfo) {
        console.log('⚠️  policy_embeddings table or embedding column does not exist yet');
        return;
      }

      // If it's already a vector type, we're good
      if (columnInfo.udt_name === 'vector') {
        console.log('✅ embedding column is already vector type');
        return;
      }

      // If it's an array type (double precision[]), convert it to vector
      if (columnInfo.data_type === 'ARRAY' || columnInfo.udt_name === '_float8') {
        console.log('🔄 Converting embedding column from double precision[] to vector(384)...');
        
        // Drop any existing indexes on embedding column first
        await sequelize.query(`
          DROP INDEX IF EXISTS policy_embeddings_embedding_idx
        `);

        // Alter the column type - PostgreSQL will convert the array to vector
        await sequelize.query(`
          ALTER TABLE policy_embeddings 
          ALTER COLUMN embedding TYPE vector(${EMBEDDING_DIMENSION})
          USING embedding::vector(${EMBEDDING_DIMENSION})
        `);

        console.log('✅ embedding column converted to vector type');
      }
    } catch (error) {
      console.error('Failed to ensure vector column type:', error);
      throw error;
    }
  }

  /**
   * Format embedding array as pgvector string
   */
  private formatVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Store embedding with native vector type
   */
  async storeEmbedding(data: {
    policyId: number;
    chunkText: string;
    embedding: number[];
    chunkIndex: number;
    schoolId?: string;
    schoolName?: string;
    metadata?: Record<string, unknown>;
  }): Promise<number> {
    const vectorString = this.formatVector(data.embedding);

    const [result] = await sequelize.query<{ id: number }>(
      `
      INSERT INTO policy_embeddings 
        (policy_id, chunk_text, embedding, chunk_index, school_id, school_name, metadata, created_at, updated_at)
      VALUES 
        (:policyId, :chunkText, :embedding::vector, :chunkIndex, :schoolId, :schoolName, :metadata::jsonb, NOW(), NOW())
      RETURNING id
      `,
      {
        replacements: {
          policyId: data.policyId,
          chunkText: data.chunkText,
          embedding: vectorString,
          chunkIndex: data.chunkIndex,
          schoolId: data.schoolId || null,
          schoolName: data.schoolName || null,
          metadata: JSON.stringify(data.metadata || {}),
        },
        type: QueryTypes.SELECT,
      }
    );

    return (result as { id: number }).id;
  }

  /**
   * Bulk store embeddings efficiently
   */
  async bulkStoreEmbeddings(
    embeddings: Array<{
      policyId: number;
      chunkText: string;
      embedding: number[];
      chunkIndex: number;
      schoolId?: string;
      schoolName?: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<number[]> {
    if (embeddings.length === 0) return [];

    // Build bulk insert query
    const values: string[] = [];
    const replacements: Record<string, unknown> = {};

    embeddings.forEach((e, idx) => {
      values.push(`(
        :policyId${idx}, 
        :chunkText${idx}, 
        :embedding${idx}::vector, 
        :chunkIndex${idx}, 
        :schoolId${idx}, 
        :schoolName${idx}, 
        :metadata${idx}::jsonb, 
        NOW(), 
        NOW()
      )`);

      replacements[`policyId${idx}`] = e.policyId;
      replacements[`chunkText${idx}`] = e.chunkText;
      replacements[`embedding${idx}`] = this.formatVector(e.embedding);
      replacements[`chunkIndex${idx}`] = e.chunkIndex;
      replacements[`schoolId${idx}`] = e.schoolId || null;
      replacements[`schoolName${idx}`] = e.schoolName || null;
      replacements[`metadata${idx}`] = JSON.stringify(e.metadata || {});
    });

    const results = await sequelize.query<{ id: number }>(
      `
      INSERT INTO policy_embeddings 
        (policy_id, chunk_text, embedding, chunk_index, school_id, school_name, metadata, created_at, updated_at)
      VALUES ${values.join(', ')}
      RETURNING id
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );

    return results.map((r) => r.id);
  }

  /**
   * Find similar embeddings using cosine similarity
   * Uses pgvector's <=> operator (cosine distance)
   */
  async findSimilar(
    queryEmbedding: number[],
    options: {
      topK?: number;
      threshold?: number;
      schoolId?: string;
      policyIds?: number[];
    } = {}
  ): Promise<SimilarityResult[]> {
    // Use fallback if pgvector is not available
    if (!this._pgVectorAvailable) {
      return this.findSimilarFallback(queryEmbedding, options);
    }

    const { topK = 5, threshold = 0.5, schoolId, policyIds } = options;

    const vectorString = this.formatVector(queryEmbedding);

    // Build WHERE conditions
    const conditions: string[] = [];
    const replacements: Record<string, unknown> = {
      queryVector: vectorString,
      topK,
    };

    if (schoolId) {
      conditions.push('school_id = :schoolId');
      replacements.schoolId = schoolId;
    }

    if (policyIds && policyIds.length > 0) {
      conditions.push('policy_id = ANY(:policyIds)');
      replacements.policyIds = policyIds;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      // pgvector cosine distance: <=> returns distance (0 = identical, 2 = opposite)
      // Convert to similarity: similarity = 1 - (distance / 2) for normalized vectors
      // For unit vectors (which embeddings typically are): similarity = 1 - distance
      const results = await sequelize.query<SimilarityResult>(
        `
        SELECT 
          id,
          policy_id as "policyId",
          chunk_text as "chunkText",
          chunk_index as "chunkIndex",
          school_id as "schoolId",
          school_name as "schoolName",
          metadata,
          (1 - (embedding <=> :queryVector::vector)) as similarity
        FROM policy_embeddings
        ${whereClause}
        ORDER BY embedding <=> :queryVector::vector
        LIMIT :topK
        `,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      // Filter by similarity threshold
      return results.filter((r) => r.similarity >= threshold);
    } catch (error) {
      console.warn('pgvector query failed, using fallback:', error);
      return this.findSimilarFallback(queryEmbedding, options);
    }
  }

  /**
   * Fallback similarity search using pure PostgreSQL (slower, no index)
   * Uses dot product approximation for normalized vectors
   */
  private async findSimilarFallback(
    queryEmbedding: number[],
    options: {
      topK?: number;
      threshold?: number;
      schoolId?: string;
      policyIds?: number[];
    } = {}
  ): Promise<SimilarityResult[]> {
    const { topK = 5, threshold = 0.5, schoolId, policyIds } = options;

    // Build WHERE conditions
    const conditions: string[] = [];
    const replacements: Record<string, unknown> = { topK };

    if (schoolId) {
      conditions.push('school_id = :schoolId');
      replacements.schoolId = schoolId;
    }

    if (policyIds && policyIds.length > 0) {
      conditions.push('policy_id = ANY(:policyIds)');
      replacements.policyIds = policyIds;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch all embeddings and compute similarity in memory
    // This is slower but works without pgvector
    const allEmbeddings = await sequelize.query<{
      id: number;
      policyId: number;
      chunkText: string;
      chunkIndex: number;
      schoolId: string | null;
      schoolName: string | null;
      metadata: Record<string, unknown>;
      embedding: number[];
    }>(
      `
      SELECT 
        id,
        policy_id as "policyId",
        chunk_text as "chunkText",
        chunk_index as "chunkIndex",
        school_id as "schoolId",
        school_name as "schoolName",
        metadata,
        embedding
      FROM policy_embeddings
      ${whereClause}
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );

    // Compute cosine similarity in JavaScript
    const results = allEmbeddings
      .map((row) => {
        const embedding = Array.isArray(row.embedding) 
          ? row.embedding 
          : typeof row.embedding === 'string' 
            ? JSON.parse(row.embedding as unknown as string) 
            : [];
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        return { 
          id: row.id,
          policyId: row.policyId,
          chunkText: row.chunkText,
          chunkIndex: row.chunkIndex,
          schoolId: row.schoolId || undefined,
          schoolName: row.schoolName || undefined,
          metadata: row.metadata,
          similarity,
        };
      })
      .filter((r) => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Keyword-based chunk retrieval using PostgreSQL ILIKE.
   * Used as a fallback when semantic similarity scores are low (e.g. OCR-heavy docs).
   * Keywords should be partial stems (e.g. "facult", "depart") so garbled OCR text
   * that still contains recognisable fragments is matched.
   */
  async findByKeyword(
    keywords: string[],
    options: {
      topK?: number;
      schoolId?: string;
      fallbackSimilarity?: number;
    } = {}
  ): Promise<SimilarityResult[]> {
    if (keywords.length === 0) return [];
    const { topK = 8, schoolId, fallbackSimilarity = 0.28 } = options;

    const conditions: string[] = [];
    const replacements: Record<string, unknown> = { topK };

    // Build ILIKE conditions — any keyword matches the chunk
    const keywordConditions = keywords
      .map((kw, i) => {
        replacements[`kw${i}`] = `%${kw}%`;
        return `chunk_text ILIKE :kw${i}`;
      })
      .join(' OR ');
    conditions.push(`(${keywordConditions})`);

    if (schoolId) {
      conditions.push('school_id = :schoolId');
      replacements.schoolId = schoolId;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    try {
      const results = await sequelize.query<{
        id: number;
        policyId: number;
        chunkText: string;
        chunkIndex: number;
        schoolId: string | null;
        schoolName: string | null;
        metadata: Record<string, unknown>;
      }>(
        `SELECT id, policy_id as "policyId", chunk_text as "chunkText",
                chunk_index as "chunkIndex", school_id as "schoolId",
                school_name as "schoolName", metadata
         FROM policy_embeddings
         ${whereClause}
         ORDER BY id
         LIMIT :topK`,
        { replacements, type: QueryTypes.SELECT }
      );

      return results.map((r) => ({
        ...r,
        schoolId: r.schoolId ?? undefined,
        schoolName: r.schoolName ?? undefined,
        // Assign a modest synthetic similarity so keyword chunks supplement
        // (not dominate) semantic results and confidence is not inflated.
        similarity: fallbackSimilarity,
      }));
    } catch (error) {
      console.warn('[VectorService] findByKeyword failed:', error);
      return [];
    }
  }

  /**
   * Find similar embeddings using L2 (Euclidean) distance
   * Uses pgvector's <-> operator
   */
  async findSimilarL2(
    queryEmbedding: number[],
    options: {
      topK?: number;
      maxDistance?: number;
      schoolId?: string;
    } = {}
  ): Promise<SimilarityResult[]> {
    const { topK = 5, maxDistance = 1.0, schoolId } = options;

    const vectorString = this.formatVector(queryEmbedding);

    const conditions: string[] = [];
    const replacements: Record<string, unknown> = {
      queryVector: vectorString,
      topK,
      maxDistance,
    };

    if (schoolId) {
      conditions.push('school_id = :schoolId');
      replacements.schoolId = schoolId;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const results = await sequelize.query<SimilarityResult & { distance: number }>(
      `
      SELECT 
        id,
        policy_id as "policyId",
        chunk_text as "chunkText",
        chunk_index as "chunkIndex",
        school_id as "schoolId",
        school_name as "schoolName",
        metadata,
        (embedding <-> :queryVector::vector) as distance
      FROM policy_embeddings
      ${whereClause}
      HAVING (embedding <-> :queryVector::vector) <= :maxDistance
      ORDER BY embedding <-> :queryVector::vector
      LIMIT :topK
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );

    // Convert distance to similarity (inverse relationship)
    return results.map((r) => ({
      ...r,
      similarity: 1 / (1 + r.distance),
    }));
  }

  /**
   * Delete embeddings for a policy
   */
  async deleteByPolicyId(policyId: number): Promise<number> {
    const result = await sequelize.query(
      `DELETE FROM policy_embeddings WHERE policy_id = :policyId`,
      {
        replacements: { policyId },
        type: QueryTypes.DELETE,
      }
    );
    return typeof result === 'number' ? result : 0;
  }

  /**
   * Delete embeddings for a school
   */
  async deleteBySchoolId(schoolId: string): Promise<number> {
    const result = await sequelize.query(
      `DELETE FROM policy_embeddings WHERE school_id = :schoolId`,
      {
        replacements: { schoolId },
        type: QueryTypes.DELETE,
      }
    );
    return typeof result === 'number' ? result : 0;
  }

  /**
   * Get embedding count statistics
   */
  async getStats(): Promise<{
    totalEmbeddings: number;
    embeddingsBySchool: Record<string, number>;
    embeddingsByPolicy: Record<number, number>;
  }> {
    const [totalResult] = await sequelize.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM policy_embeddings`,
      { type: QueryTypes.SELECT }
    );

    const schoolResults = await sequelize.query<{ school_id: string; count: string }>(
      `SELECT school_id, COUNT(*) as count FROM policy_embeddings GROUP BY school_id`,
      { type: QueryTypes.SELECT }
    );

    const policyResults = await sequelize.query<{ policy_id: number; count: string }>(
      `SELECT policy_id, COUNT(*) as count FROM policy_embeddings GROUP BY policy_id`,
      { type: QueryTypes.SELECT }
    );

    return {
      totalEmbeddings: parseInt(totalResult?.count || '0'),
      embeddingsBySchool: Object.fromEntries(
        schoolResults.map((r) => [r.school_id || 'unknown', parseInt(r.count)])
      ),
      embeddingsByPolicy: Object.fromEntries(
        policyResults.map((r) => [r.policy_id, parseInt(r.count)])
      ),
    };
  }

  /**
   * Verify HNSW index exists
   */
  async verifyIndex(): Promise<boolean> {
    const results = await sequelize.query<{ indexname: string }>(
      `
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'policy_embeddings' 
      AND indexdef LIKE '%hnsw%'
      `,
      { type: QueryTypes.SELECT }
    );
    return results.length > 0;
  }

  /**
   * Create HNSW index if not exists
   * First ensures the embedding column is the correct vector type
   */
  async createHnswIndex(): Promise<void> {
    // Ensure the column type is vector, not double precision[]
    await this.ensureVectorColumnType();

    const hasIndex = await this.verifyIndex();
    if (hasIndex) {
      console.log('✅ HNSW index already exists');
      return;
    }

    console.log('Creating HNSW index...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS policy_embeddings_embedding_idx 
      ON policy_embeddings 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);
    console.log('✅ HNSW index created');
  }
}

export default VectorService;
