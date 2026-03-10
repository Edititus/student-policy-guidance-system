import { Request, Response } from 'express';
import { AdminService } from '../services/adminService';
import { AuthenticatedRequest } from './authControllerDb';
import {
  RawActivity,
  FormattedActivity,
  ActivityType,
  ActivitySeverity,
  RetrievalDebugResult,
} from '../types/admin';
import AuditService from '../services/auditService';

interface RetrievalDebugService {
  debugRetrieval(
    queryText: string,
    options?: { schoolId?: string; topK?: number }
  ): Promise<RetrievalDebugResult>;
}

/**
 * Format raw activity data for UI display
 * This presenter logic belongs in the controller layer, not the service
 */
function formatActivity(raw: RawActivity): FormattedActivity {
  const titleMap: Record<ActivityType, string> = {
    query: 'Query answered',
    escalation: 'Query escalated',
    policy: 'New policy uploaded',
    user: 'User registered',
  };

  const severityMap: Record<ActivityType, ActivitySeverity> = {
    query: 'info',
    escalation: 'warning',
    policy: 'success',
    user: 'info',
  };

  const descriptionMap: Record<ActivityType, (raw: RawActivity) => string> = {
    query: (r) => r.entityName,
    escalation: (r) => `Low confidence on: "${r.entityName}"`,
    policy: (r) => r.entityName,
    user: (r) => r.entityName,
  };

  return {
    type: raw.type,
    title: titleMap[raw.type],
    description: descriptionMap[raw.type](raw),
    timestamp: raw.timestamp,
    severity: severityMap[raw.type],
  };
}

/**
 * AdminController - Database-backed admin operations
 * Replaces mock data with real PostgreSQL queries
 */
export class AdminControllerDb {
  private adminService: AdminService;
  private auditService: AuditService;
  private retrievalService: RetrievalDebugService;

  constructor(retrievalService: RetrievalDebugService) {
    this.adminService = AdminService.getInstance();
    this.auditService = AuditService.getInstance();
    this.retrievalService = retrievalService;
  }

  // resolveRetrievalService — thin accessor used by respondToQuery
  private get ragService() {
    return this.retrievalService;
  }

  private async recordAudit(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await this.auditService.log({
      action,
      entityType,
      entityId,
      userId: authReq.user?.userId,
      schoolId: authReq.user?.schoolId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata,
    });
  }

  getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const stats = await this.adminService.getStats(schoolId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Failed to get stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
      });
    }
  };

  getEscalatedQueries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const includeResponded = req.query.includeResponded === 'true';

      const { queries, total } = await this.adminService.getEscalatedQueries(schoolId, {
        limit,
        offset,
        includeResponded,
      });

      res.json({
        success: true,
        data: queries,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + queries.length < total,
        },
      });
    } catch (error) {
      console.error('Failed to get escalated queries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve escalated queries',
      });
    }
  };

  respondToQuery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { queryId } = req.params;
      const { response } = req.body;

      if (!response || !response.trim()) {
        res.status(400).json({
          success: false,
          message: 'Response text is required',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      await this.adminService.respondToQuery(
        queryId,
        response,
        req.user.userId,
        req.user.role,
        req.user.schoolId
      );

      // Embed the Q&A pair into the vector store so future similar questions
      // are answered directly by the AI (fire-and-forget — never blocks the
      // admin response even if the embedding service is temporarily down).
      try {
        const Query = (await import('../models/QueryModel')).default;
        const q = await Query.findOne({ where: { queryId } });
        if (q) {
          this.ragService
            .embedAdminQA(
              q.query,
              response,
              req.user.schoolId || q.schoolId || '',
              ''
            )
            .catch((err: unknown) =>
              console.error('[embedAdminQA] background embedding failed:', err)
            );
        }
      } catch (lookupErr) {
        console.error('[embedAdminQA] query lookup failed:', lookupErr);
      }

      await this.recordAudit(req, 'admin.respond_to_query', 'query', queryId, {
        responseLength: response.length,
      });

      res.json({
        success: true,
        message: 'Response sent successfully',
        data: {
          queryId,
          responded: true,
          respondedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to respond to query:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send response',
      });
    }
  };

  dismissQuery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { queryId } = req.params;

      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await this.adminService.dismissQuery(
        queryId,
        req.user.userId,
        req.user.role,
        req.user.schoolId
      );

      await this.recordAudit(req, 'admin.dismiss_query', 'query', queryId, {});

      res.json({
        success: true,
        message: 'Query dismissed',
        data: { queryId, escalationStatus: 'dismissed' },
      });
    } catch (error) {
      console.error('Failed to dismiss query:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to dismiss query',
      });
    }
  };

  deleteQuery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { queryId } = req.params;

      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await this.adminService.deleteQuery(
        queryId,
        req.user.role,
        req.user.schoolId
      );

      await this.recordAudit(req, 'admin.delete_query', 'query', queryId, {});

      res.json({ success: true, message: 'Query deleted', data: { queryId } });
    } catch (error) {
      console.error('Failed to delete query:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete query',
      });
    }
  };

  getAllQueries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const {
        startDate,
        endDate,
        confidence,
        limit: limitStr,
        offset: offsetStr,
      } = req.query;

      const filters = {
        schoolId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        confidence: confidence as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
        limit: parseInt(limitStr as string) || 50,
        offset: parseInt(offsetStr as string) || 0,
      };

      const { queries, total } = await this.adminService.getAllQueries(filters);

      res.json({
        success: true,
        data: queries.map((q) => ({
          id: q.id,
          queryId: q.queryId,
          query: q.query,
          answer: q.answer,
          confidence: q.confidence >= 0.85 ? 'HIGH' : q.confidence >= 0.7 ? 'MEDIUM' : 'LOW',
          requiresEscalation: q.requiresEscalation,
          responseTime: q.responseTime,
          createdAt: q.createdAt,
        })),
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + queries.length < total,
        },
        filters: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          confidence: filters.confidence,
        },
      });
    } catch (error) {
      console.error('Failed to get queries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve queries',
      });
    }
  };

  getAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const period = (req.query.period as 'day' | 'week' | 'month') || 'week';

      const analytics = await this.adminService.getAnalytics(schoolId, period);

      res.json({
        success: true,
        data: analytics,
        period,
      });
    } catch (error) {
      console.error('Failed to get analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics',
      });
    }
  };

  exportData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const { type, startDate, endDate } = req.query;

      const exportType = (type as 'queries' | 'policies' | 'users') || 'queries';
      const csvData = await this.adminService.exportQueries({
        schoolId,
        type: exportType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      await this.recordAudit(req, 'admin.export_data', 'report', String(exportType), {
        type: exportType,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${type || 'queries'}-export-${Date.now()}.csv`
      );
      res.send(csvData);
    } catch (error) {
      console.error('Failed to export data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
      });
    }
  };

  bulkPolicyAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { policyIds, action } = req.body;

      if (!policyIds || !Array.isArray(policyIds) || policyIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Policy IDs array is required',
        });
        return;
      }

      if (!['activate', 'deactivate', 'delete'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Must be activate, deactivate, or delete',
        });
        return;
      }

      const affected = await this.adminService.bulkPolicyAction(policyIds, action);
      await this.recordAudit(req, 'admin.bulk_policy_action', 'policy', String(policyIds.length), {
        action,
        policyIds,
        affected,
      });

      res.json({
        success: true,
        message: `Successfully ${action}d ${affected} policies`,
        data: {
          affected,
          action,
        },
      });
    } catch (error) {
      console.error('Bulk action failed:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk action failed',
      });
    }
  };

  getRecentActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const limit = parseInt(req.query.limit as string) || 10;

      const rawActivities = await this.adminService.getRecentActivity(schoolId, limit);
      const formattedActivities = rawActivities.map(formatActivity);

      res.json({
        success: true,
        data: formattedActivities,
      });
    } catch (error) {
      console.error('Failed to get activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity',
      });
    }
  };

  getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { users, total } = await this.adminService.getUsers(schoolId, {
        role,
        status,
        search,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          schoolId: u.schoolId,
          schoolName: u.schoolName,
          department: u.department,
          studentId: u.studentId,
          year: u.year,
          active: u.active,
          lastLogin: u.lastLogin,
          createdAt: u.createdAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + users.length < total,
        },
      });
    } catch (error) {
      console.error('Failed to get users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
      });
    }
  };

  // ============================================
  // Student Approval / User Management
  // ============================================

  /**
   * GET /admin/students/pending — list students awaiting approval
   */
  getPendingStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { users, total } = await this.adminService.getPendingStudents(schoolId, { limit, offset });

      res.json({
        success: true,
        data: users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          department: u.department,
          studentId: u.studentId,
          year: u.year,
          schoolId: u.schoolId,
          schoolName: u.schoolName,
          status: u.status,
          createdAt: u.createdAt,
        })),
        pagination: { total, limit, offset, hasMore: offset + users.length < total },
      });
    } catch (error) {
      console.error('Failed to get pending students:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve pending students' });
    }
  };

  /**
   * POST /admin/students/:userId/approve
   */
  approveStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const user = await this.adminService.approveStudent(userId, schoolId);

      await this.recordAudit(req, 'admin.approve_student', 'user', String(userId), {
        studentEmail: user.email,
      });

      res.json({
        success: true,
        message: `Student ${user.name} has been approved`,
        data: { id: user.id, email: user.email, name: user.name, status: user.status },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve student';
      console.error('Failed to approve student:', error);
      res.status(400).json({ success: false, message });
    }
  };

  /**
   * POST /admin/students/:userId/reject
   */
  rejectStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const user = await this.adminService.rejectStudent(userId, schoolId);

      await this.recordAudit(req, 'admin.reject_student', 'user', String(userId), {
        studentEmail: user.email,
      });

      res.json({
        success: true,
        message: `Student ${user.name} has been rejected`,
        data: { id: user.id, email: user.email, name: user.name, status: user.status },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject student';
      console.error('Failed to reject student:', error);
      res.status(400).json({ success: false, message });
    }
  };

  /**
   * PATCH /admin/users/:userId/status — change user status (suspend, reactivate)
   */
  updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      const { status } = req.body;
      if (!['active', 'suspended', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status. Must be active, suspended, or rejected' });
        return;
      }

      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const user = await this.adminService.updateUserStatus(userId, status, schoolId);

      await this.recordAudit(req, `admin.user_status_${status}`, 'user', String(userId), {
        userEmail: user.email,
        newStatus: status,
      });

      res.json({
        success: true,
        message: `User ${user.name} status updated to ${status}`,
        data: { id: user.id, email: user.email, name: user.name, status: user.status },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user status';
      console.error('Failed to update user status:', error);
      res.status(400).json({ success: false, message });
    }
  };

  /**
   * POST /admin/students/create — admin creates a student (immediately active)
   */
  createStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password, name, schoolId, department, studentId, year } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ success: false, message: 'Email, password, and name are required' });
        return;
      }

      // Non-super admins can only create students in their own school
      const effectiveSchoolId = req.user?.role === 'super_admin'
        ? (schoolId || req.user?.schoolId)
        : req.user?.schoolId;

      if (!effectiveSchoolId) {
        res.status(400).json({ success: false, message: 'School ID is required' });
        return;
      }

      const user = await this.adminService.createStudentByAdmin({
        email,
        password,
        name,
        schoolId: effectiveSchoolId,
        department,
        studentId,
        year,
      });

      await this.recordAudit(req, 'admin.create_student', 'user', String(user.id), {
        studentEmail: user.email,
      });

      res.status(201).json({
        success: true,
        message: `Student ${user.name} has been created`,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          schoolId: user.schoolId,
          schoolName: user.schoolName,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create student';
      console.error('Failed to create student:', error);
      res.status(400).json({ success: false, message });
    }
  };

  getSchools = async (_req: Request, res: Response): Promise<void> => {
    try {
      const schools = await this.adminService.getSchools();

      res.json({
        success: true,
        data: schools.map((s) => ({
          id: s.id,
          name: s.name,
          domain: s.domain,
          country: s.country,
          type: s.type,
          active: s.active,
          createdAt: s.createdAt,
        })),
      });
    } catch (error) {
      console.error('Failed to get schools:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve schools',
      });
    }
  };

  broadcastNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, message, targetRole } = req.body;

      if (!title || !message) {
        res.status(400).json({
          success: false,
          message: 'Title and message are required',
        });
        return;
      }

      // Deferred implementation for post-v1.
      console.log(`Broadcast notification: ${title} to ${targetRole || 'all'}`);
      await this.recordAudit(req, 'admin.broadcast_notification', 'notification', title, {
        targetRole: targetRole || 'all',
      });

      res.json({
        success: true,
        message: 'Notification queued successfully',
        data: {
          title,
          targetRole: targetRole || 'all',
          sentAt: new Date().toISOString(),
          deferred: true,
        },
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
      });
    }
  };

  debugRetrieval = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { query, schoolId: bodySchoolId, topK } = req.body || {};
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Query is required',
        });
        return;
      }

      const requestedSchoolId =
        req.user?.role === 'super_admin' ? (typeof bodySchoolId === 'string' ? bodySchoolId : undefined) : req.user?.schoolId;
      const parsedTopK = typeof topK === 'number' ? topK : Number(topK);

      const result = await this.retrievalService.debugRetrieval(query, {
        schoolId: requestedSchoolId,
        topK: Number.isFinite(parsedTopK) ? parsedTopK : undefined,
      });

      await this.recordAudit(req, 'admin.retrieval_debug', 'query', 'retrieval_debug', {
        queryLength: query.length,
        schoolId: requestedSchoolId,
        topK: Number.isFinite(parsedTopK) ? parsedTopK : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to debug retrieval:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run retrieval debug',
      });
    }
  };

  getCoverageGaps = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const limit = parseInt(req.query.limit as string) || 10;
      const gaps = await this.adminService.getCoverageGaps(schoolId, limit);

      res.json({
        success: true,
        data: gaps,
      });
    } catch (error) {
      console.error('Failed to get coverage gaps:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coverage gaps',
      });
    }
  };

  // ============================================
  // Reset Password
  // ============================================

  /**
   * POST /admin/users/:userId/reset-password — admin resets a user's password
   */
  resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      const schoolId = req.user?.role === 'super_admin' ? undefined : req.user?.schoolId;
      const { tempPassword, user } = await this.adminService.resetPassword(userId, schoolId);

      await this.recordAudit(req, 'admin.reset_password', 'user', String(userId), {
        userEmail: user.email,
      });

      res.json({
        success: true,
        message: `Password reset for ${user.name}`,
        data: { id: user.id, email: user.email, name: user.name, tempPassword },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      console.error('Failed to reset password:', error);
      res.status(400).json({ success: false, message });
    }
  };

  // ============================================
  // Super Admin: Admin Management
  // ============================================

  /**
   * POST /admin/admins — super admin creates an admin user
   */
  createAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, name, schoolId } = req.body;

      if (!email || !name || !schoolId) {
        res.status(400).json({ success: false, message: 'Email, name, and schoolId are required' });
        return;
      }

      const { user, tempPassword } = await this.adminService.createAdmin({ email, name, schoolId });

      await this.recordAudit(req, 'admin.create_admin', 'user', String(user.id), {
        adminEmail: user.email,
        schoolId,
      });

      res.status(201).json({
        success: true,
        message: `Admin ${user.name} has been created`,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          schoolId: user.schoolId,
          schoolName: user.schoolName,
          tempPassword,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create admin';
      console.error('Failed to create admin:', error);
      res.status(400).json({ success: false, message });
    }
  };

  /**
   * POST /admin/admins/:userId/suspend — super admin suspends an admin
   */
  suspendAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      const user = await this.adminService.suspendAdmin(userId);

      await this.recordAudit(req, 'admin.suspend_admin', 'user', String(userId), {
        adminEmail: user.email,
      });

      res.json({
        success: true,
        message: `Admin ${user.name} has been suspended`,
        data: { id: user.id, email: user.email, name: user.name, status: user.status },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to suspend admin';
      console.error('Failed to suspend admin:', error);
      res.status(400).json({ success: false, message });
    }
  };

  /**
   * GET /admin/admins — super admin lists admin users
   */
  getAdminsBySchool = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schoolId = req.query.schoolId as string | undefined;
      const admins = await this.adminService.getAdminsBySchool(schoolId);

      res.json({
        success: true,
        data: admins.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          schoolId: u.schoolId,
          schoolName: u.schoolName,
          active: u.active,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      console.error('Failed to get admins:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve admins' });
    }
  };

  /**
   * GET /admin/platform-stats — super admin platform-wide statistics
   */
  getPlatformStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.adminService.getPlatformStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Failed to get platform stats:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve platform statistics' });
    }
  };
}

export default AdminControllerDb;
