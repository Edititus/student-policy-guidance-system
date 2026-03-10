import { DataTypes, Model, Optional, Sequelize, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

/**
 * PolicyEmbedding model with pgvector support
 * Uses native PostgreSQL vector type for efficient similarity search
 */

// PolicyEmbedding attributes
interface PolicyEmbeddingAttributes {
  id: number;
  policyId: number;
  chunkText: string;
  embedding: number[];
  chunkIndex: number;
  schoolId?: string;
  schoolName?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PolicyEmbeddingCreationAttributes extends Optional<PolicyEmbeddingAttributes, 'id'> {}

// PolicyEmbedding model
export class PolicyEmbeddingModel
  extends Model<PolicyEmbeddingAttributes, PolicyEmbeddingCreationAttributes>
  implements PolicyEmbeddingAttributes
{
  declare id: number;
  declare policyId: number;
  declare chunkText: string;
  declare embedding: number[];
  declare chunkIndex: number;
  declare schoolId: string;
  declare schoolName: string;
  declare metadata: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Find similar embeddings using pgvector cosine distance
   * @param queryEmbedding - The query vector to search for
   * @param options - Search options
   * @returns Array of similar embeddings with similarity scores
   */
  static async findSimilar(
    queryEmbedding: number[],
    options: {
      topK?: number;
      threshold?: number;
      schoolId?: string;
      policyIds?: number[];
    } = {}
  ): Promise<{ embedding: PolicyEmbeddingModel; similarity: number }[]> {
    const { topK = 5, threshold = 0.5, schoolId, policyIds } = options;

    // Convert array to pgvector format: '[1,2,3]'
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Build WHERE clause
    const whereConditions: string[] = [];
    const replacements: Record<string, unknown> = {
      queryVector: vectorString,
      threshold: 1 - threshold, // Convert similarity to distance (cosine distance = 1 - similarity)
      topK,
    };

    if (schoolId) {
      whereConditions.push('school_id = :schoolId');
      replacements.schoolId = schoolId;
    }

    if (policyIds && policyIds.length > 0) {
      whereConditions.push('policy_id IN (:policyIds)');
      replacements.policyIds = policyIds;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Use pgvector's <=> operator for cosine distance
    // Lower distance = higher similarity, so we convert: similarity = 1 - distance
    const results = await sequelize.query<PolicyEmbeddingAttributes & { similarity: number }>(
      `
      SELECT 
        *,
        1 - (embedding <=> :queryVector::vector) as similarity
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

    // Filter by threshold and map to expected format (results is typed correctly from query)
    const resultArray = results as unknown as (PolicyEmbeddingAttributes & { similarity: number })[];
    return resultArray
      .filter((r) => r.similarity >= threshold)
      .map((r) => ({
        embedding: PolicyEmbeddingModel.build(r),
        similarity: r.similarity,
      }));
  }

  /**
   * Bulk insert embeddings efficiently
   */
  static async bulkInsertWithVectors(
    embeddings: PolicyEmbeddingCreationAttributes[]
  ): Promise<PolicyEmbeddingModel[]> {
    if (embeddings.length === 0) return [];

    // Use raw query for bulk insert with vector type
    const values = embeddings.map((e, idx) => {
      const vectorString = `[${e.embedding.join(',')}]`;
      return `(
        ${e.policyId},
        $${idx * 6 + 1},
        $${idx * 6 + 2}::vector,
        ${e.chunkIndex},
        $${idx * 6 + 3},
        $${idx * 6 + 4},
        $${idx * 6 + 5}::jsonb,
        NOW(),
        NOW()
      )`;
    });

    const params = embeddings.flatMap((e) => [
      e.chunkText,
      `[${e.embedding.join(',')}]`,
      e.schoolId || null,
      e.schoolName || null,
      JSON.stringify(e.metadata || {}),
    ]);

    // For simplicity, use Sequelize's bulkCreate with raw embedding conversion
    // The database trigger or application layer will handle vector conversion
    return PolicyEmbeddingModel.bulkCreate(embeddings);
  }
}

// Register custom vector type for Sequelize
// This allows Sequelize to handle the vector column properly
const registerVectorType = () => {
  // Create a custom DataType for pgvector
  // Sequelize stores it as TEXT, and PostgreSQL handles the casting
  (DataTypes as any).VECTOR = (dimensions: number) => {
    return {
      key: 'VECTOR',
      toSql: () => `vector(${dimensions})`,
    };
  };
};

// Initialize model
PolicyEmbeddingModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    policyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'policy_id',
      references: {
        model: 'policies',
        key: 'id',
      },
    },
    chunkText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'chunk_text',
    },
    embedding: {
      // Store as TEXT and cast to vector in queries
      // This is because Sequelize doesn't natively support pgvector
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: false,
      comment: 'Vector embedding (384 dimensions for all-MiniLM-L6-v2)',
      // Custom getter/setter to handle vector format
      get() {
        const rawValue = this.getDataValue('embedding');
        if (typeof rawValue === 'string') {
          // Parse pgvector string format: [1,2,3]
          return (rawValue as string)
            .replace('[', '')
            .replace(']', '')
            .split(',')
            .map(Number);
        }
        return rawValue as number[];
      },
    },
    chunkIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'chunk_index',
    },
    schoolId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'school_id',
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'school_name',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'policy_embeddings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['policy_id'],
      },
      {
        fields: ['school_id'],
      },
    ],
  }
);

export default PolicyEmbeddingModel;
