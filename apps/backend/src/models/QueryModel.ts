import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'
import User from './User'
import School from './School'

// Query attributes
interface QueryAttributes {
  id: number
  queryId: string
  query: string
  answer: string
  confidence: number
  requiresEscalation: boolean
  userId?: number
  schoolId?: string
  studentContext?: any
  sources?: any
  metadata?: any
  responseTime?: number
  escalatedAt?: Date
  escalationReason?: string
  escalationStatus?: 'pending' | 'in_review' | 'resolved' | 'dismissed'
  escalatedBy?: number
  resolvedAt?: Date
  resolvedBy?: number
  resolutionNotes?: string
  conversationId?: string
  createdAt?: Date
  updatedAt?: Date
}

interface QueryCreationAttributes extends Optional<QueryAttributes, 'id'> {}

// Query model for analytics
export class Query extends Model<QueryAttributes, QueryCreationAttributes> implements QueryAttributes {
  declare id: number
  declare queryId: string
  declare query: string
  declare answer: string
  declare confidence: number
  declare requiresEscalation: boolean
  declare userId: number
  declare schoolId: string
  declare studentContext: any
  declare sources: any
  declare metadata: any
  declare responseTime: number
  declare escalatedAt?: Date
  declare escalationReason?: string
  declare escalationStatus?: 'pending' | 'in_review' | 'resolved' | 'dismissed'
  declare escalatedBy?: number
  declare resolvedAt?: Date
  declare resolvedBy?: number
  declare resolutionNotes?: string
  declare conversationId?: string
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Query.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    queryId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    requiresEscalation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    schoolId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'schools',
        key: 'id',
      },
    },
    studentContext: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    sources: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Response time in milliseconds',
    },
    escalatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    escalationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    escalationStatus: {
      type: DataTypes.ENUM('pending', 'in_review', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    escalatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    conversationId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'conversation_id',
    },
  },
  {
    sequelize,
    tableName: 'queries',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['school_id'],
      },
      {
        fields: ['requires_escalation'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['escalation_status'],
      },
      {
        fields: ['escalated_at'],
      },
      {
        fields: ['conversation_id'],
      },
    ],
  }
)

export default Query
