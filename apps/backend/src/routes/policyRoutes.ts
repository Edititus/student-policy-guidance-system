import { Router } from 'express'
import { PolicyController } from '../controllers/policyController'
import { authenticateToken, requireAdmin } from '../controllers/authControllerDb'
import { PolicyParserService } from '../services/policyParserService'
import multer from 'multer'
import path from 'path'

// Minimal interface for RAG service methods needed by policy routes
interface PolicyRAGService {
  addPolicy(policy: unknown): Promise<{ policyId: number; chunks: number }>
  getStats(): Promise<{ totalPolicies: number; totalChunks: number; embeddingModel: string }>
}

// Configure file upload (same as in index.ts)
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

// Factory function that creates the router with injected dependencies
export function createPolicyRoutes(
  parserService: PolicyParserService,
  ragService: PolicyRAGService
): Router {
  const router = Router()
  const policyController = new PolicyController(parserService, ragService)

  router.post(
    '/upload',
    authenticateToken,
    requireAdmin,
    upload.single('file'),
    policyController.uploadPolicy
  )
  router.get('/processing', authenticateToken, requireAdmin, policyController.getProcessingStatus)
  router.get('/', authenticateToken, requireAdmin, policyController.listPolicies)
  router.get('/:id', authenticateToken, requireAdmin, policyController.getPolicyById)
  router.put('/:id', authenticateToken, requireAdmin, policyController.updatePolicy)
  router.delete('/:id', authenticateToken, requireAdmin, policyController.deletePolicy)
  router.post('/:id/activate', authenticateToken, requireAdmin, policyController.activatePolicy)
  router.post('/:id/deactivate', authenticateToken, requireAdmin, policyController.deactivatePolicy)

  return router
}

export default createPolicyRoutes
