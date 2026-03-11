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

// Add any missing columns that can't be handled by plain sync
const runMigrations = async (): Promise<void> => {
  // Add school_id to users if the table exists but the column is missing
  await sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'school_id')
      THEN
        ALTER TABLE users ADD COLUMN school_id VARCHAR(100);
      END IF;
    END $$;
  `)
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
