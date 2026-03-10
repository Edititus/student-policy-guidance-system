import { Request, Response } from 'express'
import { IRAGService } from '../services/IRAGService'
import { PolicyQuery } from '../models/Policy'
import { v4 as uuidv4 } from 'uuid'
import Query from '../models/QueryModel'
import { PolicyModel } from '../models/PolicyModel'
import { AuthenticatedRequest } from './authControllerDb'
import { Op } from 'sequelize'

/**
 * Controller for AI Policy Chatbot endpoints
 */
export class ChatController {
  private ragService: IRAGService

  constructor(ragService: IRAGService) {
    this.ragService = ragService
  }

  /**
   * POST /api/chat/query
   * Ask a policy question
   */
  askQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const { query, studentContext, sessionId, conversationId } = req.body

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query is required and must be a string' })
        return
      }

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        })
        return
      }

      const policyQuery: PolicyQuery & { schoolId?: string; userId?: string } = {
        id: uuidv4(),
        query,
        studentContext,
        userId: String(authReq.user.userId),
        schoolId: authReq.user.schoolId,
        timestamp: new Date(),
        sessionId: sessionId || uuidv4(),
        conversationId: conversationId || uuidv4(),
      }

      const response = await this.ragService.answerQuery(policyQuery)

      res.json({
        success: true,
        data: response,
      })
    } catch (error) {
      console.error('Error in askQuestion:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to process query',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /api/chat/query/stream
   * Ask a policy question and stream tokens via SSE
   */
  askQuestionStream = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest

    if (!authReq.user) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    const { query, studentContext, sessionId, conversationId } = req.body

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required and must be a string' })
      return
    }

    // Set SSE headers before streaming starts
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // nginx: disable proxy buffering
    res.flushHeaders()

    const policyQuery: PolicyQuery & { schoolId?: string; userId?: string } = {
      id: uuidv4(),
      query,
      studentContext,
      userId: String(authReq.user.userId),
      schoolId: authReq.user.schoolId,
      timestamp: new Date(),
      sessionId: sessionId || uuidv4(),
      conversationId: conversationId || uuidv4(),
    }

    if (this.ragService.answerQueryStream) {
      await this.ragService.answerQueryStream(policyQuery, res)
    } else {
      const response = await this.ragService.answerQuery(policyQuery)
      const escalated = (response as any).requiresEscalation ?? response.escalated ?? false
      res.write(`data: ${JSON.stringify({ token: response.answer })}\n\n`)
      res.write(
        `data: ${JSON.stringify({
          done: true,
          meta: {
            queryId: response.id,
            confidence: response.confidence,
            sources: escalated ? [] : response.sources,
            requiresEscalation: escalated,
          },
        })}\n\n`
      )
      res.end()
    }
  }

  /**
   * GET /api/chat/history
   * Get recent chat history for the authenticated user (school-scoped)
   */
  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      if (!authReq.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { conversationId } = req.query as { conversationId?: string }

      const where: Record<string, unknown> = {
        userId: authReq.user.userId,
        schoolId: authReq.user.schoolId,
      }
      if (conversationId) {
        where.conversationId = conversationId
      }

      const history = await Query.findAll({
        where,
        order: [['createdAt', 'ASC']],
        limit: 200,
      })

      res.json({
        success: true,
        data: {
          messages: history.map((row) => ({
            id: row.queryId,
            query: row.query,
            answer: row.answer,
            confidence: row.confidence >= 0.85 ? 'HIGH' : row.confidence >= 0.7 ? 'MEDIUM' : 'LOW',
            sources: row.sources || [],
            requiresEscalation: row.requiresEscalation,
            timestamp: row.createdAt,
            responseTimeMs: row.responseTime,
            conversationId: row.conversationId,
          })),
        },
      })
    } catch (error) {
      console.error('Error in getHistory:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat history',
      })
    }
  }

  /**
   * GET /api/chat/resolution/:queryId
   * Check if an escalated query has been resolved by an admin.
   * Students can only view their own queries.
   */
  getQueryResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      if (!authReq.user) {
        res.status(401).json({ success: false, message: 'Authentication required' })
        return
      }

      const { queryId } = req.params
      const row = await Query.findOne({ where: { queryId } })

      if (!row) {
        res.status(404).json({ success: false, message: 'Query not found' })
        return
      }

      // Ensure students only see their own queries
      if (String(row.userId) !== String(authReq.user.userId)) {
        res.status(403).json({ success: false, message: 'Forbidden' })
        return
      }

      const meta = (row.metadata as Record<string, unknown>) || {}

      res.json({
        success: true,
        data: {
          resolved: !!meta.responded,
          adminResponse: (meta.adminResponse as string) || null,
          respondedAt: (meta.respondedAt as string) || null,
        },
      })
    } catch (error) {
      console.error('Error in getQueryResolution:', error)
      res.status(500).json({ success: false, message: 'Failed to fetch resolution' })
    }
  }

  /**
   * GET /api/chat/stats
   * Get knowledge base statistics
   */
  getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = this.ragService.getStats()
      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error('Error in getStats:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get stats',
      })
    }
  }

  /**
   * GET /api/chat/categories
   * Return distinct active policy categories for the user's school.
   * Used by the frontend to render dynamic quick-action buttons.
   */
  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      if (!authReq.user) {
        res.status(401).json({ success: false, error: 'Authentication required' })
        return
      }

      const policies = await PolicyModel.findAll({
        where: { schoolId: authReq.user.schoolId, active: true },
        attributes: ['category', 'title'],
      })

      // Collect unique categories and all policy titles
      const seen = new Set<string>()
      const categories: string[] = []
      const policyList = policies.map((p) => ({
        title: p.get('title') as string,
        category: (p.get('category') as string).toUpperCase(),
      }))
      for (const p of policyList) {
        if (!seen.has(p.category)) {
          seen.add(p.category)
          categories.push(p.category)
        }
      }

      res.json({
        success: true,
        data: { categories, policies: policyList, total: policies.length },
      })
    } catch (error) {
      console.error('Error in getCategories:', error)
      res.status(500).json({ success: false, error: 'Failed to fetch categories' })
    }
  }

  /**
   * POST /api/chat/feedback
   * Submit feedback on an answer (for HITL improvement)
   */
  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      const { responseId, helpful, comment } = req.body

      if (!responseId) {
        res.status(400).json({ error: 'Response ID is required' })
        return
      }

      const queryRecord = await Query.findOne({ where: { queryId: responseId } })
      if (!queryRecord) {
        res.status(404).json({
          success: false,
          message: 'Query response not found',
        })
        return
      }

      if (authReq.user?.schoolId && queryRecord.schoolId !== authReq.user.schoolId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        })
        return
      }

      const metadata = (queryRecord.metadata as Record<string, unknown>) || {}
      await queryRecord.update({
        metadata: {
          ...metadata,
          feedback: {
            helpful: helpful === true,
            comment: comment || '',
            submittedAt: new Date().toISOString(),
            submittedBy: authReq.user?.userId,
          },
        },
      })

      res.json({
        success: true,
        message: 'Feedback received. Thank you!',
      })
    } catch (error) {
      console.error('Error in submitFeedback:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback',
      })
    }
  }

  /**
   * GET /api/chat/conversations
   * Return a deduplicated list of conversation threads for the user,
   * ordered by most recent activity, with title derived from first message.
   */
  getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest
      if (!authReq.user) {
        res.status(401).json({ success: false, message: 'Authentication required' })
        return
      }

      // Fetch all rows that have a conversationId, ordered oldest-first so we
      // can easily pick the first message as the title.
      const rows = await Query.findAll({
        where: {
          userId: authReq.user.userId,
          schoolId: authReq.user.schoolId,
          conversationId: { [Op.not]: null } as unknown as string,
        },
        attributes: ['conversationId', 'query', 'createdAt'],
        order: [['createdAt', 'ASC']],
      })

      // Deduplicate: keep first occurrence (title) and track latest activity
      const map = new Map<string, { title: string; lastActivity: Date }>()
      for (const row of rows) {
        const cid = row.conversationId!
        if (!map.has(cid)) {
          // First message in this conversation → use as title
          const title = row.query.length > 50 ? row.query.slice(0, 50) + '…' : row.query
          map.set(cid, { title, lastActivity: row.createdAt })
        } else {
          // Update last activity timestamp
          const entry = map.get(cid)!
          if (row.createdAt > entry.lastActivity) {
            entry.lastActivity = row.createdAt
          }
        }
      }

      // Sort by lastActivity desc (most recent first)
      const conversations = Array.from(map.entries())
        .map(([conversationId, { title, lastActivity }]) => ({
          conversationId,
          title,
          lastActivity: lastActivity.toISOString(),
        }))
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

      res.json({ success: true, data: { conversations } })
    } catch (error) {
      console.error('Error in getConversations:', error)
      res.status(500).json({ success: false, message: 'Failed to fetch conversations' })
    }
  }
}
