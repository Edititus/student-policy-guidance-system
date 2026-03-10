import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

// School attributes
interface SchoolAttributes {
  id: string
  name: string
  domain: string
  country?: string
  type?: 'public' | 'private'
  settings?: any
  contactEmail?: string
  website?: string
  active: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface SchoolCreationAttributes extends Optional<SchoolAttributes, 'id' | 'active'> {}

// School model
export class School extends Model<SchoolAttributes, SchoolCreationAttributes> implements SchoolAttributes {
  declare id: string
  declare name: string
  declare domain: string
  declare country: string
  declare type: 'public' | 'private'
  declare settings: any
  declare contactEmail: string
  declare website: string
  declare active: boolean
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

School.init(
  {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('public', 'private'),
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        allowStudentRegistration: true,
        requireEmailVerification: false,
        enableComparison: true,
      },
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'schools',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['domain'],
      },
    ],
  }
)

export default School
