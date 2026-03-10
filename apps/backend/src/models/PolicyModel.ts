import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

// Policy attributes
interface PolicyAttributes {
  id: number
  policyId: string
  title: string
  content: string
  category: string
  schoolId: string
  schoolName: string
  uploadedBy?: number
  visibility: 'public' | 'school_only' | 'private'
  version?: string
  effectiveDate?: Date
  expiryDate?: Date
  tags?: string[]
  metadata?: any
  active: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface PolicyCreationAttributes extends Optional<PolicyAttributes, 'id'> {}

// Policy model
export class PolicyModel extends Model<PolicyAttributes, PolicyCreationAttributes>
  implements PolicyAttributes {
  declare id: number
  declare policyId: string
  declare title: string
  declare content: string
  declare category: string
  declare schoolId: string
  declare schoolName: string
  declare uploadedBy: number
  declare visibility: 'public' | 'school_only' | 'private'
  declare version: string
  declare effectiveDate: Date
  declare expiryDate: Date
  declare tags: string[]
  declare metadata: any
  declare active: boolean
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

PolicyModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    policyId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    schoolId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id',
      },
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    visibility: {
      type: DataTypes.ENUM('public', 'school_only', 'private'),
      allowNull: false,
      defaultValue: 'school_only',
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'policies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['policy_id'],
      },
      {
        fields: ['school_id'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['active'],
      },
    ],
  }
)

export default PolicyModel
