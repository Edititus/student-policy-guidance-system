// Import all models
import School from './School'
import User from './User'
import PolicyModel from './PolicyModel'
import PolicyEmbeddingModel from './PolicyEmbeddingModel'
import QueryModel from './QueryModel'
import AuditLog from './AuditLog'

// Define all associations here to avoid circular dependencies

// School associations
School.hasMany(User, { foreignKey: 'schoolId', as: 'users' })
School.hasMany(PolicyModel, { foreignKey: 'schoolId', as: 'policies' })
School.hasMany(QueryModel, { foreignKey: 'schoolId', as: 'queries' })

// User associations
User.belongsTo(School, { foreignKey: 'schoolId', as: 'school' })
User.hasMany(QueryModel, { foreignKey: 'userId', as: 'queries' })

// PolicyModel associations
PolicyModel.belongsTo(School, { foreignKey: 'schoolId', as: 'school' })
PolicyModel.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' })
PolicyModel.hasMany(PolicyEmbeddingModel, { foreignKey: 'policyId', as: 'embeddings' })

// PolicyEmbeddingModel associations
PolicyEmbeddingModel.belongsTo(PolicyModel, { foreignKey: 'policyId', as: 'policy' })

// QueryModel associations
QueryModel.belongsTo(User, { foreignKey: 'userId', as: 'user' })
QueryModel.belongsTo(School, { foreignKey: 'schoolId', as: 'school' })

// Export all models
export { School, User, PolicyModel, PolicyEmbeddingModel, QueryModel, AuditLog }

// Export database connection
export { default as sequelize, connectDatabase, syncDatabase } from '../config/database'
