import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

interface AuditLogAttributes {
  id: number
  action: string
  entityType: string
  entityId: string
  userId?: number
  schoolId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: object
  createdAt?: Date
  updatedAt?: Date
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'createdAt'> {}

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: number
  public action!: string
  public entityType!: string
  public entityId!: string
  public userId?: number
  public schoolId?: string
  public ipAddress?: string
  public userAgent?: string
  public metadata?: object
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    action: { type: DataTypes.STRING, allowNull: false },
    entityType: { type: DataTypes.STRING, allowNull: false, field: 'entity_type' },
    entityId: { type: DataTypes.STRING, allowNull: true, field: 'entity_id' },
    userId: { type: DataTypes.INTEGER, allowNull: true, field: 'user_id' },
    schoolId: { type: DataTypes.STRING, allowNull: true, field: 'school_id' },
    ipAddress: { type: DataTypes.STRING, allowNull: true, field: 'ip_address' },
    userAgent: { type: DataTypes.TEXT, allowNull: true, field: 'user_agent' },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

export default AuditLog
