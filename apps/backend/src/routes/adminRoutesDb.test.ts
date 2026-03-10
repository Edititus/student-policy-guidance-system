import { describe, it, expect, vi } from 'vitest';

vi.mock('../controllers/authControllerDb', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin', schoolId: 'school-1' };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
  requireSuperAdmin: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../controllers/adminControllerDb', () => ({
  AdminControllerDb: class {
    getStats = (_req: any, res: any) => res.json({ success: true, data: {} });
    getRecentActivity = (_req: any, res: any) => res.json({ success: true, data: [] });
    getAllQueries = (_req: any, res: any) => res.json({ success: true, data: [] });
    getEscalatedQueries = (_req: any, res: any) => res.json({ success: true, data: [] });
    respondToQuery = (_req: any, res: any) => res.json({ success: true });
    getAnalytics = (req: any, res: any) =>
      res.json({
        success: true,
        data: {
          confidenceDistribution: { HIGH: 3, MEDIUM: 2, LOW: 1 },
          queryCategories: { REGISTRATION: 3 },
          queriesOverTime: [{ date: '2026-02-25', count: 6 }],
          avgResponseTime: 1.2,
          userSatisfaction: 4.5,
        },
        period: req.query.period || 'week',
      });
    exportData = (_req: any, res: any) => res.send('id,query\n1,test');
    bulkPolicyAction = (_req: any, res: any) => res.json({ success: true });
    getUsers = (_req: any, res: any) => res.json({ success: true, data: [] });
    getSchools = (_req: any, res: any) => res.json({ success: true, data: [] });
    broadcastNotification = (_req: any, res: any) => res.json({ success: true });
    debugRetrieval = (_req: any, res: any) => res.json({ success: true, data: {} });
    getCoverageGaps = (_req: any, res: any) => res.json({ success: true, data: [] });
  },
}));

import adminRoutes from './adminRoutesDb';

describe('adminRoutesDb analytics endpoint', () => {
  it('returns analytics shape through route handler chain', async () => {
    const analyticsRouteLayer = (adminRoutes as any).stack.find(
      (layer: any) => layer?.route?.path === '/analytics'
    );
    expect(analyticsRouteLayer).toBeDefined();

    const handlers = analyticsRouteLayer.route.stack.map((item: any) => item.handle);
    const req: any = { query: { period: 'week' } };
    const resBody: any[] = [];
    const res: any = { json: (payload: any) => resBody.push(payload) };

    let index = 0;
    const next = () => {
      const handler = handlers[index++];
      if (handler) {
        handler(req, res, next);
      }
    };

    next();

    expect(resBody).toHaveLength(1);
    expect(resBody[0]).toMatchObject({
      success: true,
      period: 'week',
      data: {
        confidenceDistribution: { HIGH: 3, MEDIUM: 2, LOW: 1 },
      },
    });
  });
});
