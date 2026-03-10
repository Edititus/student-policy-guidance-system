import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import path from 'path'
import authRoutes from './routes/authRoutesDb'
import { createChatRoutes } from './routes/chatRoutes'
import { createPolicyRoutes } from './routes/policyRoutes'
import { createAdminRoutes } from './routes/adminRoutesDb'
import schoolRoutes from './routes/schoolRoutes'
import { DatabaseRAGService } from './services/databaseRagService'
import { PolicyParserService } from './services/policyParserService'
import { VectorService } from './services/vectorService'
import { connectDatabase, syncDatabase } from './models'
import seedDatabase from './scripts/seed'
import { errorHandler } from './middleware/errorHandler'
import DataRetentionService from './services/dataRetentionService'

const app = express()

// ── Security Middleware ──────────────────────────────────────────────
// HTTP security headers (XSS, clickjacking, MIME sniffing, HSTS, etc.)
app.use(helmet())

// Disable X-Powered-By (also covered by helmet — belt-and-suspenders)
app.disable('x-powered-by')

// CORS — restrict to known origins in production
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000']
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Body parser with size limits to prevent abuse
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

// ── Rate Limiting ────────────────────────────────────────────────────
// Strict limiter for auth endpoints (login, register, password change)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
    code: 'RATE_LIMIT',
  },
})

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})

// Configure file upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.pdf', '.docx', '.txt'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'))
    }
  },
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB limit
  },
})

// Initialize services
const ragService = new DatabaseRAGService()
const parserService = new PolicyParserService()
const vectorService = VectorService.getInstance()
const dataRetentionService = DataRetentionService.getInstance()

// Apply rate limiters
app.use('/api/auth', authLimiter)
app.use('/api', apiLimiter)

// Modular route usage
app.use('/api/auth', authRoutes)
app.use('/api/chat', createChatRoutes(ragService))
app.use('/api/policies', createPolicyRoutes(parserService, ragService))
app.use('/api/admin', createAdminRoutes(ragService))
app.use('/api/schools', schoolRoutes)

// Global error handler (must be after all routes)
app.use(errorHandler)

const port = process.env.PORT || 4000

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase()

    // Sync database schema (create tables if they don't exist)
    await syncDatabase(false) // Set to true to force recreate tables

    // Initialize pgvector for RAG service
    await ragService.initialize()

    // Seed initial data (schools and users)
    const shouldSeed = process.env.SEED_DATABASE === 'true' || process.argv.includes('--seed')
    if (shouldSeed) {
      console.log('\n🌱 Seeding database...')
      await seedDatabase(false)
    }

    // Get stats from database
    const stats = await ragService.getStats()

    // Start daily retention cleanup (default 90 days)
    dataRetentionService.start()

    // Start Express server
    app.listen(port, () => {
      console.log('\n================================')
      console.log(`🚀 AI Policy Guidance System running on http://localhost:${port}`)
      console.log(
        `📊 Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`
      )
      console.log(
        `📚 Knowledge base: ${stats.totalPolicies} policies loaded (${stats.totalChunks} chunks)`
      )
      console.log(`🤗 Using ${stats.provider.toUpperCase()} (${stats.embeddingModel})`)
      console.log('================================\n')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()
