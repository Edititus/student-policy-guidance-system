import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

let sequelize: Sequelize

if (process.env.DATABASE_URL && isProduction) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  })
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'policy_guidance_system',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      dialectOptions: {},
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
    }
  )
}

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection established successfully')
    console.log(
      `📊 Connected to: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`
    )
  } catch (error) {
    console.error('❌ Unable to connect to database:', error)
    throw error
  }
}

// Rename a column only if the old name exists and the new name does not
const renameColumnIfNeeded = async (table: string, from: string, to: string): Promise<void> => {
  await sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = '${from}'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = '${to}'
      ) THEN
        ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}";
      END IF;
    END $$;
  `)
}

// Add a column only if it does not already exist
const addColumnIfMissing = async (table: string, column: string, definition: string): Promise<void> => {
  await sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${table}')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}')
      THEN
        ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition};
      END IF;
    END $$;
  `)
}

// Migrate any camelCase columns (created before underscored:true) to snake_case
const runMigrations = async (): Promise<void> => {
  // users table
  await renameColumnIfNeeded('users', 'schoolId',   'school_id')
  await renameColumnIfNeeded('users', 'schoolName', 'school_name')
  await renameColumnIfNeeded('users', 'schoolDomain','school_domain')
  await renameColumnIfNeeded('users', 'studentId',  'student_id')
  await renameColumnIfNeeded('users', 'lastLogin',  'last_login')
  await renameColumnIfNeeded('users', 'createdAt',  'created_at')
  await renameColumnIfNeeded('users', 'updatedAt',  'updated_at')
  await addColumnIfMissing('users', 'school_id', 'VARCHAR(100)')

  // schools table
  await renameColumnIfNeeded('schools', 'contactEmail', 'contact_email')
  await renameColumnIfNeeded('schools', 'createdAt',    'created_at')
  await renameColumnIfNeeded('schools', 'updatedAt',    'updated_at')

  // policies table
  await renameColumnIfNeeded('policies', 'schoolId',    'school_id')
  await renameColumnIfNeeded('policies', 'schoolName',  'school_name')
  await renameColumnIfNeeded('policies', 'uploadedBy',  'uploaded_by')
  await renameColumnIfNeeded('policies', 'effectiveDate','effective_date')
  await renameColumnIfNeeded('policies', 'expiryDate',  'expiry_date')
  await renameColumnIfNeeded('policies', 'createdAt',   'created_at')
  await renameColumnIfNeeded('policies', 'updatedAt',   'updated_at')

  // policy_embeddings table
  await renameColumnIfNeeded('policy_embeddings', 'policyId',   'policy_id')
  await renameColumnIfNeeded('policy_embeddings', 'chunkText',  'chunk_text')
  await renameColumnIfNeeded('policy_embeddings', 'chunkIndex', 'chunk_index')
  await renameColumnIfNeeded('policy_embeddings', 'schoolId',   'school_id')
  await renameColumnIfNeeded('policy_embeddings', 'schoolName', 'school_name')
  await renameColumnIfNeeded('policy_embeddings', 'createdAt',  'created_at')
  await renameColumnIfNeeded('policy_embeddings', 'updatedAt',  'updated_at')
}

// Sync database (create tables if they don't exist)
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    if (!force) await runMigrations()
    await sequelize.sync({ force })
    console.log('✅ Database synchronized')
  } catch (error) {
    console.error('❌ Database sync failed:', error)
    throw error
  }
}

export default sequelize
