import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

// PolicyEmbedding attributes
interface PolicyEmbeddingAttributes {
  id: number
  policyId: number
  chunkText: string
  embedding: number[]
  chunkIndex: number
  schoolId?: string
  schoolName?: string
  metadata?: any
  createdAt?: Date
  updatedAt?: Date
}

interface PolicyEmbeddingCreationAttributes extends Optional<PolicyEmbeddingAttributes, 'id'> {}

// PolicyEmbedding model
export class PolicyEmbeddingModel extends Model<PolicyEmbeddingAttributes, PolicyEmbeddingCreationAttributes>
  implements PolicyEmbeddingAttributes {
  declare id: number
  declare policyId: number
  declare chunkText: string
  declare embedding: number[]
  declare chunkIndex: number
  declare schoolId: string
  declare schoolName: string
  declare metadata: any
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

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
      references: {
        model: 'policies',
        key: 'id',
      },
    },
    chunkText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embedding: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: false,
      comment: 'Vector embedding (384 or 1536 dimensions)',
    },
    chunkIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    schoolId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    indexes: [
      {
        fields: ['policy_id'],
      },
      {
        fields: ['school_id'],
      },
    ],
  }
)

export default PolicyEmbeddingModel
