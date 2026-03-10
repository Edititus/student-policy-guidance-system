import { Router } from 'express';
import { AdminControllerDb } from '../controllers/adminControllerDb';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../controllers/authControllerDb';
import { RetrievalDebugResult } from '../types/admin';

interface RetrievalDebugService {
  debugRetrieval(
    queryText: string,
    options?: { schoolId?: string; topK?: number }
  ): Promise<RetrievalDebugResult>;
  embedAdminQA(
    question: string,
    answer: string,
    schoolId: string,
    schoolName: string
  ): Promise<void>;
}

export function createAdminRoutes(retrievalService: RetrievalDebugService): Router {
  const router = Router();
  const adminController = new AdminControllerDb(retrievalService);

  // All admin routes require authentication and admin role
  router.use(authenticateToken);
  router.use(requireAdmin);

  // Dashboard
  router.get('/stats', adminController.getStats);
  router.get('/activity', adminController.getRecentActivity);

  // Query management
  router.get('/queries', adminController.getAllQueries);
  router.get('/escalated-queries', adminController.getEscalatedQueries);
  router.post('/queries/:queryId/respond', adminController.respondToQuery);
  router.post('/queries/:queryId/dismiss', adminController.dismissQuery);
  router.delete('/queries/:queryId', adminController.deleteQuery);
  router.post('/retrieval/debug', adminController.debugRetrieval);
  router.get('/coverage-gaps', adminController.getCoverageGaps);

  // Analytics
  router.get('/analytics', adminController.getAnalytics);
  router.get('/export', adminController.exportData);

  // Policy management
  router.post('/policies/bulk-action', adminController.bulkPolicyAction);

  // User management
  router.get('/users', adminController.getUsers);
  router.patch('/users/:userId/status', adminController.updateUserStatus);
  router.post('/users/:userId/reset-password', adminController.resetPassword);

  // Student approval & management
  router.get('/students/pending', adminController.getPendingStudents);
  router.post('/students/:userId/approve', adminController.approveStudent);
  router.post('/students/:userId/reject', adminController.rejectStudent);
  router.post('/students', adminController.createStudent);

  // School management (super admin only)
  router.get('/schools', requireSuperAdmin, adminController.getSchools);

  // Super-admin: Admin management
  router.post('/admins', requireSuperAdmin, adminController.createAdmin);
  router.post('/admins/:userId/suspend', requireSuperAdmin, adminController.suspendAdmin);
  router.get('/admins', requireSuperAdmin, adminController.getAdminsBySchool);
  router.get('/platform-stats', requireSuperAdmin, adminController.getPlatformStats);

  // Notifications
  router.post('/notifications/broadcast', adminController.broadcastNotification);

  return router;
}

const defaultAdminRoutes = createAdminRoutes({
  debugRetrieval: async () => ({
    thresholdUsed: 0,
    candidatesScanned: 0,
    acceptedCount: 0,
    filteredOutCount: 0,
    topSimilarity: null,
    candidates: [],
  }),
  embedAdminQA: async () => { /* noop stub */ },
});

export default defaultAdminRoutes;
