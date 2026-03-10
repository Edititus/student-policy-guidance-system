import { Request, Response } from 'express'
import { PolicyParserService } from '../services/policyParserService'
import { PolicyModel } from '../models/PolicyModel'
import { School } from '../models/School'
import { QueryTypes } from 'sequelize'
import sequelize from '../config/database'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs/promises'
import { processingTracker } from '../services/processingTracker'
import AuditService from '../services/auditService'

// Import AuthenticatedRequest type
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number
    email: string
    role: string
    schoolId?: string
  }
}

// Minimal interface for RAG service methods used by this controller
interface PolicyRAGService {
  addPolicy(policy: unknown, onProgress?: (processed: number, total: number) => void): Promise<{ policyId: number; chunks: number }>
  getStats(): Promise<{ totalPolicies: number; totalChunks: number; embeddingModel: string }>
}

/**
 * Controller for Policy Management (Admin functions)
 */
export class PolicyController {
  private parserService: PolicyParserService
  private ragService: PolicyRAGService
  private auditService: AuditService

  constructor(parserService: PolicyParserService, ragService: PolicyRAGService) {
    this.parserService = parserService
    this.ragService = ragService
    this.auditService = AuditService.getInstance()
  }

  private resolveAllowedSchoolId(authReq: AuthenticatedRequest, requestedSchoolId?: string): string | undefined {
    if (!authReq.user) return requestedSchoolId
    if (authReq.user.role === 'super_admin') {
      return requestedSchoolId || authReq.user.schoolId
    }
    return authReq.user.schoolId
  }

  private canAccessPolicy(authReq: AuthenticatedRequest, policySchoolId?: string): boolean {
    if (!authReq.user) return false
    if (authReq.user.role === 'super_admin') return true
    return !!authReq.user.schoolId && authReq.user.schoolId === policySchoolId
  }

  private async recordAudit(
    req: AuthenticatedRequest,
    action: string,
    entityId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.auditService.log({
      action,
      entityType: 'policy',
      entityId,
      userId: req.user?.userId,
      schoolId: req.user?.schoolId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata,
    })
  }

  private normalizeProcessingError(error: unknown): string {
    const raw = error instanceof Error ? error.message : 'Unknown error'
    const knownPrefix = ['PDF_IMPORT_ERROR:', 'PDF_PARSE_ERROR:', 'PDF_EMPTY_TEXT:', 'DOCUMENT_PARSE_ERROR:']
      .find((prefix) => raw.startsWith(prefix))

    if (knownPrefix) {
      return raw
        .split('\n')[0]
        .replace(/\s+/g, ' ')
        .trim()
    }

    return `DOCUMENT_PARSE_ERROR: ${raw
      .split('\n')[0]
      .replace(/\s+/g, ' ')
      .trim()}`
  }

  /**
   * POST /api/policies/upload
   * Upload and parse a policy document
   */
  uploadPolicy = async (req: Request, res: Response): Promise<void> => {
    const jobId = uuidv4()
    let schoolId = 'veritas-university'

    try {
      const authReq = req as AuthenticatedRequest
      // @ts-ignore - file is added by multer middleware
      const file = req.file
      const { institution, schoolId: bodySchoolId } = req.body

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' })
        return
      }

      // Get school info from user or body
      schoolId = authReq.user?.schoolId || bodySchoolId || 'veritas-university'
      console.log(`[upload] userId=${authReq.user?.userId} email=${authReq.user?.email} jwtSchoolId=${authReq.user?.schoolId} bodySchoolId=${bodySchoolId} → resolved=${schoolId}`)
      if (bodySchoolId && bodySchoolId !== authReq.user?.schoolId) {
        console.warn(`[upload] ⚠️  schoolId mismatch: JWT says "${authReq.user?.schoolId}" but body says "${bodySchoolId}"`)
      }
      const school = await School.findByPk(schoolId)
      const schoolName = school?.name || institution || 'Unknown School'

      // Start tracking the job
      processingTracker.startJob(jobId, file.originalname, schoolId)
      await this.recordAudit(authReq, 'policy.upload_started', jobId, {
        filename: file.originalname,
        schoolId,
      })

      // Immediately respond with job ID so frontend can poll for status
      res.json({
        success: true,
        message: 'Upload started - processing in background',
        data: {
          jobId,
          filename: file.originalname,
          status: 'processing',
        },
      })

      // Continue processing in background (after response sent)
      this.processUploadAsync(jobId, file, schoolId, schoolName)
    } catch (error) {
      console.error('Error in uploadPolicy:', error)
      processingTracker.failJob(jobId, error instanceof Error ? error.message : 'Unknown error')
      // Only send error if response not already sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to upload policy',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  /**
   * Process upload asynchronously (called after response sent)
   */
  private processUploadAsync = async (
    jobId: string,
    file: { path: string; originalname: string },
    schoolId: string,
    schoolName: string
  ): Promise<void> => {
    try {
      processingTracker.updateJob(jobId, { status: 'parsing' })

      // Parse the document (pass original filename for extension detection)
      const parsedData = await this.parserService.parseAndStructure(
        file.path,
        schoolName,
        file.originalname,
        {
          onOCRStart: () => {
            processingTracker.updateJob(jobId, { status: 'ocr' })
          },
        }
      )

      processingTracker.updateJob(jobId, { status: 'embedding' })

      // Title is always the school's name
      const title = schoolName

      // Create policy document in the format expected by databaseRagService
      const policyDocument = {
        id: uuidv4(),
        title,
        content: parsedData.content || '',
        category: parsedData.category || 'GENERAL',
        schoolId,
        schoolName,
        metadata: {
          ...parsedData.metadata,
          uploadedBy: undefined, // Can't access user here
          originalFilename: file.originalname,
        },
      }

      // Add to RAG knowledge base (this stores in PolicyModel + creates embeddings)
      const result = await this.ragService.addPolicy(policyDocument, (processed, total) => {
        processingTracker.updateJob(jobId, { processedChunks: processed, totalChunks: total })
      })

      // Clean up uploaded file
      await fs.unlink(file.path)

      // Mark job as complete
      processingTracker.completeJob(jobId, result.policyId, result.chunks)
      console.log(`✅ Upload complete: ${title} (${result.chunks} chunks)`)
    } catch (error) {
      console.error('Error processing upload:', error)
      processingTracker.failJob(jobId, this.normalizeProcessingError(error))

      // Try to clean up file on error
      try {
        await fs.unlink(file.path)
      } catch {}
    }
  }

  /**
   * GET /api/policies/processing
   * Get processing status for active and recent jobs
   */
  getProcessingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const schoolId = authReq.user?.schoolId
      const { jobId } = req.query

      if (jobId && typeof jobId === 'string') {
        // Get status for specific job
        const job = processingTracker.getJob(jobId)
        if (job) {
          res.json({ success: true, data: job })
        } else {
          res.status(404).json({ success: false, message: 'Job not found' })
        }
        return
      }

      // Get all recent jobs for this school
      const jobs = processingTracker.getRecentJobs(schoolId)
      res.json({
        success: true,
        data: {
          jobs,
          activeCount: jobs.filter((j) => !['complete', 'error'].includes(j.status)).length,
        },
      })
    } catch (error) {
      console.error('Error getting processing status:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get processing status',
      })
    }
  }

  /**
   * GET /api/policies
   * List all policies
   */
  listPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const requestedSchoolId = req.query.schoolId as string | undefined
      const schoolId = this.resolveAllowedSchoolId(authReq, requestedSchoolId)

      // Build where clause
      const whereClause: Record<string, unknown> = {}
      if (schoolId) {
        whereClause.schoolId = schoolId
      }

      // Fetch policies from database
      const policies = await PolicyModel.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        attributes: [
          'id',
          'policyId',
          'title',
          'category',
          'schoolId',
          'schoolName',
          'visibility',
          'version',
          'active',
          'createdAt',
          'updatedAt',
        ],
      })

      // Get chunk counts for each policy
      const chunkCounts = await sequelize.query<{ policy_id: number; chunk_count: string }>(
        `SELECT policy_id, COUNT(*) as chunk_count 
         FROM policy_embeddings 
         GROUP BY policy_id`,
        { type: QueryTypes.SELECT }
      )

      // Create a map of policy_id to chunk count
      const chunkCountMap = new Map(
        chunkCounts.map((row) => [row.policy_id, parseInt(row.chunk_count, 10)])
      )

      // Format response with chunk counts
      const policiesWithChunks = policies.map((policy) => ({
        id: policy.id,
        policyId: policy.policyId,
        title: policy.title,
        category: policy.category,
        schoolId: policy.schoolId,
        schoolName: policy.schoolName,
        visibility: policy.visibility,
        version: policy.version,
        active: policy.active,
        chunkCount: chunkCountMap.get(policy.id) || 0,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      }))

      res.json({
        success: true,
        data: policiesWithChunks,
      })
    } catch (error) {
      console.error('Error in listPolicies:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to list policies',
      })
    }
  }

  /**
   * GET /api/policies/:id
   * Fetch a single policy with tenant scoping
   */
  getPolicyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const { id } = req.params
      const policy = await PolicyModel.findByPk(id)

      if (!policy) {
        res.status(404).json({
          success: false,
          error: 'Policy not found',
        })
        return
      }

      if (!this.canAccessPolicy(authReq, policy.schoolId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        })
        return
      }

      res.json({
        success: true,
        data: {
          id: policy.id,
          policyId: policy.policyId,
          title: policy.title,
          content: policy.content,
          category: policy.category,
          schoolId: policy.schoolId,
          schoolName: policy.schoolName,
          visibility: policy.visibility,
          version: policy.version,
          active: policy.active,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
        },
      })
    } catch (error) {
      console.error('Error in getPolicyById:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch policy',
      })
    }
  }

  /**
   * POST /api/policies/:id/activate
   * Activate a policy (make it available to students)
   */
  activatePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const { id } = req.params

      const policy = await PolicyModel.findByPk(id)
      if (!policy) {
        res.status(404).json({
          success: false,
          error: 'Policy not found',
        })
        return
      }

      if (!this.canAccessPolicy(authReq, policy.schoolId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        })
        return
      }

      await policy.update({ active: true })
      await this.recordAudit(authReq, 'policy.activate', String(policy.id), {
        policyId: policy.policyId,
      })

      res.json({
        success: true,
        message: 'Policy activated successfully',
      })
    } catch (error) {
      console.error('Error in activatePolicy:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to activate policy',
      })
    }
  }

  /**
   * POST /api/policies/:id/deactivate
   * Deactivate a policy
   */
  deactivatePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const { id } = req.params

      const policy = await PolicyModel.findByPk(id)
      if (!policy) {
        res.status(404).json({
          success: false,
          error: 'Policy not found',
        })
        return
      }

      if (!this.canAccessPolicy(authReq, policy.schoolId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        })
        return
      }

      await policy.update({ active: false })
      await this.recordAudit(authReq, 'policy.deactivate', String(policy.id), {
        policyId: policy.policyId,
      })

      res.json({
        success: true,
        message: 'Policy deactivated successfully',
      })
    } catch (error) {
      console.error('Error in deactivatePolicy:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate policy',
      })
    }
  }

  /**
   * PUT /api/policies/:id
   * Update a policy's metadata (title, category)
   */
  updatePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const { id } = req.params
      const { title, category, visibility } = req.body

      const policy = await PolicyModel.findByPk(id)
      if (!policy) {
        res.status(404).json({
          success: false,
          error: 'Policy not found',
        })
        return
      }

      if (!this.canAccessPolicy(authReq, policy.schoolId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        })
        return
      }

      // Build update object with only provided fields
      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (category !== undefined) updates.category = category
      if (visibility !== undefined) updates.visibility = visibility

      await policy.update(updates)
      await this.recordAudit(authReq, 'policy.update', String(policy.id), updates)

      res.json({
        success: true,
        message: 'Policy updated successfully',
        data: {
          id: policy.id,
          title: policy.title,
          category: policy.category,
          visibility: policy.visibility,
        },
      })
    } catch (error) {
      console.error('Error in updatePolicy:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update policy',
      })
    }
  }

  /**
   * DELETE /api/policies/:id
   * Delete a policy and its embeddings
   */
  deletePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const { id } = req.params

      const policy = await PolicyModel.findByPk(id)
      if (!policy) {
        res.status(404).json({
          success: false,
          error: 'Policy not found',
        })
        return
      }

      if (!this.canAccessPolicy(authReq, policy.schoolId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        })
        return
      }

      // Delete embeddings first (foreign key constraint)
      await sequelize.query(`DELETE FROM policy_embeddings WHERE policy_id = :policyId`, {
        replacements: { policyId: id },
        type: QueryTypes.DELETE,
      })

      // Delete policy
      await policy.destroy()
      await this.recordAudit(authReq, 'policy.delete', String(id), {
        policyId: policy.policyId,
      })

      res.json({
        success: true,
        message: 'Policy deleted successfully',
      })
    } catch (error) {
      console.error('Error in deletePolicy:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete policy',
      })
    }
  }
}
