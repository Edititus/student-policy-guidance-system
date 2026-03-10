import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'
import School from './School'

// Valid user statuses
export type UserStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended'

// User attributes
interface UserAttributes {
  id: number
  email: string
  password: string
  name: string
  role: 'student' | 'admin' | 'super_admin'
  status: UserStatus
  schoolId?: string
  schoolName?: string
  schoolDomain?: string
  department?: string
  studentId?: string
  year?: string
  active: boolean
  lastLogin?: Date
  createdAt?: Date
  updatedAt?: Date
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'active' | 'status'> {}

// User model
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number
  declare email: string
  declare password: string
  declare name: string
  declare role: 'student' | 'admin' | 'super_admin'
  declare status: UserStatus
  declare schoolId: string
  declare schoolName: string
  declare schoolDomain: string
  declare department: string
  declare studentId: string
  declare year: string
  declare active: boolean
  declare lastLogin: Date
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'admin', 'super_admin'),
      allowNull: false,
      defaultValue: 'student',
    },
    status: {
      type: DataTypes.ENUM('pending_approval', 'active', 'rejected', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    schoolId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'schools',
        key: 'id',
      },
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    schoolDomain: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    studentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    year: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['school_id'],
      },
      {
        fields: ['role'],
      },
    ],
  }
)

export default User
