import Query from '../models/QueryModel';
import { PolicyModel } from '../models/PolicyModel';
import { User } from '../models/User';
import { School } from '../models/School';
import NotificationService from './notificationService';
import sequelize from '../config/database';
import { Op, QueryTypes, fn, col } from 'sequelize';
import {
  DashboardStats,
  EscalatedQuery,
  AnalyticsData,
  RawActivity,
  QueryRow,
  PolicyRow,
  UserRow,
  ConfidenceLevel,
  EscalatedQueryFilters,
  QueryFilters,
  ExportFilters,
  UserFilters,
  AnalyticsPeriod,
  BulkAction,
  CoverageGap,
  confidenceToLevel,
  safeSubstring,
  truncate,
} from '../types/admin';

// Re-export types for backward compatibility
export type { DashboardStats, EscalatedQuery, AnalyticsData } from '../types/admin';

/**
 * AdminService - Handles all admin dashboard operations
 * Provides real database queries instead of mock data
 */
export class AdminService {
  private static instance: AdminService;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  private normalizeQueryIntent(queryText: string): string {
    const stopWords = new Set([
      'the',
      'is',
      'a',
      'an',
      'and',
      'or',
      'to',
      'of',
      'for',
      'in',
      'on',
      'at',
      'this',
      'that',
      'these',
      'those',
      'was',
      'were',
      'are',
      'be',
      'been',
      'being',
      'with',
      'by',
      'from',
      'it',
      'i',
      'me',
      'we',
      'you',
      'us',
      'my',
      'our',
      'your',
      'please',
      'can',
      'could',
      'would',
      'should',
      'how',
      'what',
      'when',
      'where',
      'why',
      'who',
      'which',
    ]);

    const tokens = queryText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token));

    return tokens.slice(0, 6).join(' ').trim() || 'other';
  }

  /**
   * Get dashboard statistics
   */
  async getStats(schoolId?: string): Promise<DashboardStats> {
    try {
      const whereClause = schoolId ? { schoolId } : {};

      // Total queries
      const totalQueries = await Query.count({ where: whereClause });

      // Average confidence (stored as float 0-1)
      const confidenceResult = await Query.findOne({
        attributes: [[fn('AVG', col('confidence')), 'avgConfidence']],
        where: whereClause,
        raw: true,
      }) as unknown as { avgConfidence: number | null } | null;

      // Escalation rate
      const escalatedQueries = await Query.count({
        where: { ...whereClause, requiresEscalation: true },
      });
      const escalationRate = totalQueries > 0 ? escalatedQueries / totalQueries : 0;

      // Unique students (queries per distinct user)
      const uniqueStudents = await Query.count({
        where: whereClause,
        distinct: true,
        col: 'user_id',
      });

      // Total policies
      const totalPolicies = await PolicyModel.count({
        where: schoolId ? { schoolId, active: true } : { active: true },
      });

      // Total users
      const totalUsers = await User.count({
        where: schoolId ? { schoolId, active: true } : { active: true },
      });

      // Average rating (from metadata if stored)
      // For now, calculate based on confidence as a proxy
      const avgRating = (confidenceResult?.avgConfidence || 0.7) * 5;

      return {
        totalQueries,
        averageConfidence: confidenceResult?.avgConfidence || 0,
        escalationRate,
        averageRating: parseFloat(avgRating.toFixed(1)),
        uniqueStudents,
        totalPolicies,
        totalUsers,
      };
    } catch (error) {
      console.error('AdminService.getStats error:', error);
      throw new Error(`Failed to fetch dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get escalated queries (requires human review)
   */
  async getEscalatedQueries(
    schoolId?: string,
    options: EscalatedQueryFilters = {}
  ): Promise<{ queries: EscalatedQuery[]; total: number }> {
    try {
      const { limit = 50, offset = 0, includeResponded = false } = options;

      const whereClause: Record<string, unknown> = {
      requiresEscalation: true,
    };

    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    // Filter out responded queries unless specifically requested
    if (!includeResponded) {
      whereClause.metadata = {
        [Op.or]: [
          { responded: { [Op.ne]: true } },
          { responded: null },
        ],
      };
    }

    const { count, rows } = await Query.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    const queries: EscalatedQuery[] = rows.map((row) => {
      const query = row.get({ plain: true }) as QueryRow & { user?: UserRow };
      const metadata = query.metadata || {};
      const user = query.user;

      return {
        id: query.id,
        queryId: query.queryId,
        queryText: query.query || '',
        studentId: query.userId || undefined,
        studentName: user?.name || undefined,
        studentEmail: user?.email || undefined,
        aiAnswer: query.answer || '',
        confidence: confidenceToLevel(query.confidence),
        timestamp: query.createdAt,
        responded: !!metadata.responded,
        adminResponse: metadata.adminResponse as string | undefined,
        respondedAt: metadata.respondedAt
          ? new Date(metadata.respondedAt as string)
          : undefined,
        schoolId: query.schoolId || undefined,
        schoolName: undefined, // Could join with schools table if needed
        escalationStatus: (row.escalationStatus as EscalatedQuery['escalationStatus']) || 'pending',
      };
    });

    return { queries, total: count };
    } catch (error) {
      console.error('AdminService.getEscalatedQueries error:', error);
      throw new Error(`Failed to fetch escalated queries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Respond to an escalated query
   */
  async respondToQuery(
    queryId: string,
    response: string,
    adminId: number,
    adminRole?: string,
    adminSchoolId?: string
  ): Promise<void> {
    try {
      const query = await Query.findOne({
        where: { queryId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'schoolId', 'schoolName'],
            required: false,
          },
        ],
      });

      if (!query) {
        throw new Error('Query not found');
      }

      const querySchoolId = query.schoolId || undefined;
      if (adminRole !== 'super_admin' && adminSchoolId && querySchoolId && adminSchoolId !== querySchoolId) {
        throw new Error('Forbidden: cannot respond to query outside your school');
      }

      const metadata = (query.metadata as Record<string, unknown>) || {};

      await query.update({
        metadata: {
          ...metadata,
          responded: true,
          adminResponse: response,
          respondedAt: new Date().toISOString(),
          respondedBy: adminId,
        },
        escalationStatus: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: adminId,
        resolutionNotes: response,
      });

      const queryWithUser = query.get({ plain: true }) as QueryRow & { user?: UserRow };
      const studentEmail = queryWithUser.user?.email;

      if (studentEmail) {
        await this.notificationService.sendEscalationResponseEmail({
          toEmail: studentEmail,
          toName: queryWithUser.user?.name,
          question: query.query || '',
          adminResponse: response,
          schoolName: queryWithUser.user?.schoolName,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Query not found') {
        throw error;
      }
      console.error('AdminService.respondToQuery error:', error);
      throw new Error(`Failed to respond to query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Dismiss an escalated query (mark as dismissed without responding)
   */
  async dismissQuery(
    queryId: string,
    adminId: number,
    adminRole?: string,
    adminSchoolId?: string
  ): Promise<void> {
    const query = await Query.findOne({ where: { queryId } });
    if (!query) throw new Error('Query not found');

    if (adminRole !== 'super_admin' && adminSchoolId && query.schoolId && adminSchoolId !== query.schoolId) {
      throw new Error('Forbidden: cannot dismiss query outside your school');
    }

    const metadata = (query.metadata as Record<string, unknown>) || {};
    await query.update({
      escalationStatus: 'dismissed',
      metadata: {
        ...metadata,
        dismissedAt: new Date().toISOString(),
        dismissedBy: adminId,
      },
    });
  }

  /**
   * Permanently delete a query record
   */
  async deleteQuery(
    queryId: string,
    adminRole?: string,
    adminSchoolId?: string
  ): Promise<void> {
    const query = await Query.findOne({ where: { queryId } });
    if (!query) throw new Error('Query not found');

    if (adminRole !== 'super_admin' && adminSchoolId && query.schoolId && adminSchoolId !== query.schoolId) {
      throw new Error('Forbidden: cannot delete query outside your school');
    }

    await query.destroy();
  }

  /**
   * Get all queries with filters
   */
  async getAllQueries(filters: QueryFilters): Promise<{ queries: Query[]; total: number }> {
    try {
      const { schoolId, startDate, endDate, confidence, limit = 50, offset = 0 } = filters;

      const whereClause: Record<string, unknown> = {};

      if (schoolId) {
        whereClause.schoolId = schoolId;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          (whereClause.createdAt as Record<string, unknown>)[Op.gte as unknown as string] = startDate;
        }
        if (endDate) {
          (whereClause.createdAt as Record<string, unknown>)[Op.lte as unknown as string] = endDate;
        }
      }

      if (confidence) {
        const confidenceRanges = {
          HIGH: { [Op.gte]: 0.85 },
          MEDIUM: { [Op.gte]: 0.7, [Op.lt]: 0.85 },
          LOW: { [Op.lt]: 0.7 },
        };
        whereClause.confidence = confidenceRanges[confidence];
      }

      const { count, rows } = await Query.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return { queries: rows, total: count };
    } catch (error) {
      console.error('AdminService.getAllQueries error:', error);
      throw new Error(`Failed to fetch queries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(
    schoolId?: string,
    period: AnalyticsPeriod = 'week'
  ): Promise<AnalyticsData> {
    try {
      const whereClause = schoolId ? `WHERE school_id = :schoolId` : '';
      const replacements: Record<string, unknown> = schoolId ? { schoolId } : {};

      // Confidence distribution
      const confidenceResults = await sequelize.query<{
        confidence_level: string;
        count: string;
      }>(
        `
      SELECT 
        CASE 
          WHEN confidence >= 0.85 THEN 'HIGH'
          WHEN confidence >= 0.7 THEN 'MEDIUM'
          ELSE 'LOW'
        END as confidence_level,
        COUNT(*) as count
      FROM queries
      ${whereClause}
      GROUP BY confidence_level
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const confidenceDistribution = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    confidenceResults.forEach((r) => {
      confidenceDistribution[r.confidence_level as keyof typeof confidenceDistribution] =
        parseInt(r.count);
    });

    // Query categories (from sources metadata)
    // For now, return placeholder - would need to extract from policy categories
    const categoryResults = await sequelize.query<{ category: string; count: string }>(
      `
      SELECT 
        COALESCE(p.category, 'UNCATEGORIZED') as category,
        COUNT(q.id) as count
      FROM queries q
      LEFT JOIN policies p ON (q.sources::jsonb->0->>'policyId')::integer = p.id
      ${schoolId ? 'WHERE q.school_id = :schoolId' : ''}
      GROUP BY p.category
      ORDER BY count DESC
      LIMIT 10
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const queryCategories: Record<string, number> = {};
    categoryResults.forEach((r) => {
      queryCategories[r.category] = parseInt(r.count);
    });

    // Queries over time
    const dateFormat =
      period === 'day' ? 'YYYY-MM-DD HH24:00' : period === 'week' ? 'YYYY-MM-DD' : 'YYYY-MM';
    const daysBack = period === 'day' ? 1 : period === 'week' ? 7 : 30;

    const timeResults = await sequelize.query<{ date: string; count: string }>(
      `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as date,
        COUNT(*) as count
      FROM queries
      WHERE created_at >= NOW() - INTERVAL '${daysBack} days'
      ${schoolId ? 'AND school_id = :schoolId' : ''}
      GROUP BY date
      ORDER BY date
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const queriesOverTime = timeResults.map((r) => ({
      date: r.date,
      count: parseInt(r.count),
    }));

    // Average response time
    const avgTimeResult = await sequelize.query<{ avg_time: string }>(
      `
      SELECT AVG(response_time) as avg_time
      FROM queries
      ${whereClause}
      `,
      { replacements, type: QueryTypes.SELECT }
    );
    const avgResponseTime = parseFloat(avgTimeResult[0]?.avg_time || '0') / 1000; // Convert ms to seconds

    // User satisfaction (based on confidence as proxy)
    const satisfactionResult = await sequelize.query<{ satisfaction: string }>(
      `
      SELECT AVG(confidence * 5) as satisfaction
      FROM queries
      ${whereClause}
      `,
      { replacements, type: QueryTypes.SELECT }
    );
    const userSatisfaction = parseFloat(satisfactionResult[0]?.satisfaction || '3.5');

    return {
      confidenceDistribution,
      queryCategories,
      queriesOverTime,
      avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      userSatisfaction: parseFloat(userSatisfaction.toFixed(1)),
    };
    } catch (error) {
      console.error('AdminService.getAnalytics error:', error);
      throw new Error(`Failed to fetch analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export queries to CSV format
   */
  async exportQueries(filters: ExportFilters): Promise<string> {
    try {
      const { schoolId, startDate, endDate, type = 'queries' } = filters;

      if (type === 'queries') {
        const whereClause: Record<string, unknown> = {};
        if (schoolId) whereClause.schoolId = schoolId;
        if (startDate) whereClause.createdAt = { [Op.gte]: startDate };
        if (endDate) {
          whereClause.createdAt = {
            ...(whereClause.createdAt as object || {}),
            [Op.lte]: endDate,
          };
        }

        const queries = await Query.findAll({
          where: whereClause,
          order: [['createdAt', 'DESC']],
          limit: 10000,
        });

        // Build CSV - use safe string operations
        const headers = ['query_id', 'query_text', 'answer', 'confidence', 'escalated', 'timestamp'];
        const rows = queries.map((row) => {
          const q = row.get({ plain: true }) as QueryRow;
          const queryText = q.query || '';
          const answer = q.answer || '';
          return [
            q.queryId || '',
            `"${queryText.replace(/"/g, '""')}"`,
            `"${truncate(answer.replace(/"/g, '""'), 500, '')}"`,
            confidenceToLevel(q.confidence),
            q.requiresEscalation ? 'YES' : 'NO',
            q.createdAt?.toISOString() || '',
          ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
      }

      if (type === 'policies') {
        const whereClause: Record<string, unknown> = { active: true };
        if (schoolId) whereClause.schoolId = schoolId;

        const policies = await PolicyModel.findAll({
          where: whereClause,
          order: [['title', 'ASC']],
        });

        const headers = ['policy_id', 'title', 'category', 'school_name', 'created_at'];
        const rows = policies.map((row) => {
          const p = row.get({ plain: true }) as PolicyRow;
          return [
            p.policyId || '',
            `"${(p.title || '').replace(/"/g, '""')}"`,
            p.category || '',
            `"${(p.schoolName || '').replace(/"/g, '""')}"`,
            p.createdAt?.toISOString() || '',
          ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
      }

      if (type === 'users') {
        const whereClause: Record<string, unknown> = { active: true };
        if (schoolId) whereClause.schoolId = schoolId;

        const users = await User.findAll({
          where: whereClause,
          attributes: ['id', 'email', 'name', 'role', 'schoolName', 'department', 'createdAt'],
          order: [['name', 'ASC']],
        });

        const headers = ['user_id', 'email', 'name', 'role', 'school', 'department', 'created_at'];
        const rows = users.map((row) => {
          const u = row.get({ plain: true }) as UserRow;
          return [
            u.id,
            u.email || '',
            `"${(u.name || '').replace(/"/g, '""')}"`,
            u.role || '',
            `"${(u.schoolName || '').replace(/"/g, '""')}"`,
            `"${(u.department || '').replace(/"/g, '""')}"`,
            u.createdAt?.toISOString() || '',
          ].join(',');
        });

      return [headers.join(','), ...rows].join('\n');
      }

      return '';
    } catch (error) {
      console.error('AdminService.exportQueries error:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCoverageGaps(schoolId?: string, limit: number = 10): Promise<CoverageGap[]> {
    try {
      const queries = await Query.findAll({
        where: {
          ...(schoolId ? { schoolId } : {}),
          requiresEscalation: true,
        },
        attributes: ['query', 'sources', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 1000,
      });

      const grouped = new Map<string, { count: number; sampleQuery: string }>();
      for (const row of queries) {
        const plain = row.get({ plain: true }) as QueryRow;
        const sources = Array.isArray(plain.sources) ? plain.sources : [];
        if (sources.length > 0) continue;

        const intent = this.normalizeQueryIntent(plain.query || '');
        if (!grouped.has(intent)) {
          grouped.set(intent, {
            count: 1,
            sampleQuery: plain.query || '',
          });
        } else {
          const existing = grouped.get(intent)!;
          existing.count += 1;
          grouped.set(intent, existing);
        }
      }

      return Array.from(grouped.entries())
        .map(([intent, value]) => ({
          intent,
          count: value.count,
          sampleQuery: value.sampleQuery,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, Math.max(1, Math.min(limit, 20)));
    } catch (error) {
      console.error('AdminService.getCoverageGaps error:', error);
      throw new Error(
        `Failed to fetch coverage gaps: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Bulk policy actions
   */
  async bulkPolicyAction(
    policyIds: number[],
    action: BulkAction
  ): Promise<number> {
    try {
      if (action === 'delete') {
        const deleted = await PolicyModel.destroy({
          where: { id: { [Op.in]: policyIds } },
        });
        return deleted;
      }

      const [affectedCount] = await PolicyModel.update(
        { active: action === 'activate' },
        { where: { id: { [Op.in]: policyIds } } }
      );

      return affectedCount;
    } catch (error) {
      console.error('AdminService.bulkPolicyAction error:', error);
      throw new Error(`Failed to perform bulk action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recent activity for dashboard
   * Returns raw activity data - UI formatting belongs in controller/presenter layer
   */
  async getRecentActivity(
    schoolId?: string,
    limit: number = 10
  ): Promise<RawActivity[]> {
    try {
      const activities: RawActivity[] = [];
      const whereClause = schoolId ? { schoolId } : {};

      // Calculate how many of each type to fetch to avoid over-fetching
      // We want a mix: ~60% queries, ~40% policies
      const queryLimit = Math.ceil(limit * 0.6);
      const policyLimit = Math.ceil(limit * 0.4);

      // Recent queries - fetch only what we need
      const recentQueries = await Query.findAll({
        where: whereClause,
        attributes: ['id', 'queryId', 'query', 'requiresEscalation', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: queryLimit,
      });

      recentQueries.forEach((row) => {
        const q = row.get({ plain: true }) as QueryRow;
        activities.push({
          type: q.requiresEscalation ? 'escalation' : 'query',
          entityId: q.queryId,
          entityName: truncate(q.query, 50),
          timestamp: q.createdAt,
          metadata: { requiresEscalation: q.requiresEscalation },
        });
      });

      // Recent policies - fetch only what we need
      const recentPolicies = await PolicyModel.findAll({
        where: schoolId ? { schoolId } : {},
        attributes: ['id', 'policyId', 'title', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: policyLimit,
      });

      recentPolicies.forEach((row) => {
        const p = row.get({ plain: true }) as PolicyRow;
        activities.push({
          type: 'policy',
          entityId: p.policyId,
          entityName: p.title || '',
          timestamp: p.createdAt,
        });
      });

      // Sort by timestamp and return exactly what was requested
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('AdminService.getRecentActivity error:', error);
      throw new Error(`Failed to fetch recent activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user management data
   */
  async getUsers(
    schoolId?: string,
    options: UserFilters = {}
  ): Promise<{ users: User[]; total: number }> {
    try {
      const { role, status, search, limit = 50, offset = 0 } = options;

      const whereClause: Record<string, unknown> = {};
      if (schoolId) whereClause.schoolId = schoolId;
      if (role) whereClause.role = role;
      if (status) whereClause.status = status;
      // Only filter by active if no status filter is given (backward compat)
      if (!status) whereClause.active = true;
      if (search) {
        whereClause[Op.or as unknown as string] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return { users: rows, total: count };
    } catch (error) {
      console.error('AdminService.getUsers error:', error);
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get students pending approval for a given school (or all schools for super_admin)
   */
  async getPendingStudents(
    schoolId?: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ users: User[]; total: number }> {
    const { limit = 50, offset = 0 } = options;
    const whereClause: Record<string, unknown> = {
      role: 'student',
      status: 'pending_approval',
    };
    if (schoolId) whereClause.schoolId = schoolId;

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'ASC']],
      limit,
      offset,
    });
    return { users: rows, total: count };
  }

  /**
   * Approve a pending student — sets status to active
   */
  async approveStudent(userId: number, schoolId?: string): Promise<User> {
    const where: Record<string, unknown> = { id: userId, status: 'pending_approval' };
    if (schoolId) where.schoolId = schoolId;

    const user = await User.findOne({ where });
    if (!user) {
      throw new Error('User not found or not pending approval');
    }
    user.status = 'active';
    await user.save();
    return user;
  }

  /**
   * Reject a pending student
   */
  async rejectStudent(userId: number, schoolId?: string): Promise<User> {
    const where: Record<string, unknown> = { id: userId, status: 'pending_approval' };
    if (schoolId) where.schoolId = schoolId;

    const user = await User.findOne({ where });
    if (!user) {
      throw new Error('User not found or not pending approval');
    }
    user.status = 'rejected';
    await user.save();
    return user;
  }

  /**
   * Update arbitrary user status (suspend, reactivate, etc.)
   */
  async updateUserStatus(
    userId: number,
    newStatus: 'active' | 'suspended' | 'rejected',
    schoolId?: string
  ): Promise<User> {
    const where: Record<string, unknown> = { id: userId };
    if (schoolId) where.schoolId = schoolId;

    const user = await User.findOne({ where, attributes: { exclude: ['password'] } });
    if (!user) {
      throw new Error('User not found');
    }
    // Prevent modifying super_admin accounts through this endpoint
    if (user.role === 'super_admin') {
      throw new Error('Cannot modify super admin status');
    }
    user.status = newStatus;
    if (newStatus === 'suspended') user.active = false;
    if (newStatus === 'active') user.active = true;
    await user.save();
    return user;
  }

  /**
   * Admin creates a student account (immediately active, no approval needed)
   */
  async createStudentByAdmin(data: {
    email: string;
    password: string;
    name: string;
    schoolId: string;
    department?: string;
    studentId?: string;
    year?: string;
  }): Promise<User> {
    const { email, password, name, schoolId, department, studentId, year } = data;

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const school = await School.findByPk(schoolId);
    if (!school) throw new Error('Invalid school ID');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: 'student',
      status: 'active',
      schoolId: school.id,
      schoolName: school.name,
      schoolDomain: school.domain,
      department,
      studentId,
      year,
      active: true,
    });

    return user;
  }

  /**
   * Get schools (for super admin)
   */
  async getSchools(): Promise<School[]> {
    try {
      return School.findAll({
        where: { active: true },
        order: [['name', 'ASC']],
      });
    } catch (error) {
      console.error('AdminService.getSchools error:', error);
      throw new Error(`Failed to fetch schools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // Reset Password
  // ============================================

  /**
   * Reset a user's password to a random temp password
   */
  async resetPassword(userId: number, schoolId?: string): Promise<{ tempPassword: string; user: User }> {
    const where: Record<string, unknown> = { id: userId };
    if (schoolId) where.schoolId = schoolId;

    const user = await User.findOne({ where });
    if (!user) throw new Error('User not found');
    if (user.role === 'super_admin') throw new Error('Cannot reset super admin password through this endpoint');

    const crypto = await import('crypto');
    const bcrypt = await import('bcrypt');
    const tempPassword = crypto.randomBytes(8).toString('hex');
    user.password = await bcrypt.hash(tempPassword, 10);
    await user.save();
    return { tempPassword, user };
  }

  // ============================================
  // Super Admin: Admin Management
  // ============================================

  /**
   * Create an admin user linked to a school
   */
  async createAdmin(data: {
    email: string;
    name: string;
    schoolId: string;
  }): Promise<{ user: User; tempPassword: string }> {
    const { email, name, schoolId } = data;

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) throw new Error('User with this email already exists');

    const school = await School.findByPk(schoolId);
    if (!school) throw new Error('Invalid school ID');

    const crypto = await import('crypto');
    const bcrypt = await import('bcrypt');
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: 'admin',
      status: 'active',
      schoolId: school.id,
      schoolName: school.name,
      schoolDomain: school.domain,
      active: true,
    });

    return { user, tempPassword };
  }

  /**
   * Suspend an admin user
   */
  async suspendAdmin(userId: number): Promise<User> {
    const user = await User.findOne({ where: { id: userId, role: 'admin' } });
    if (!user) throw new Error('Admin user not found');

    user.status = 'suspended';
    user.active = false;
    await user.save();
    return user;
  }

  /**
   * Get admin users, optionally filtered by school
   */
  async getAdminsBySchool(schoolId?: string): Promise<User[]> {
    const where: Record<string, unknown> = { role: 'admin' };
    if (schoolId) where.schoolId = schoolId;

    return User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get platform-wide statistics for super admin
   */
  async getPlatformStats(): Promise<{
    totalSchools: number;
    totalAdmins: number;
    totalStudents: number;
    totalQueries: number;
    pendingRegistrations: number;
  }> {
    const [totalSchools, totalAdmins, totalStudents, totalQueries, pendingRegistrations] = await Promise.all([
      School.count({ where: { active: true } }),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { role: 'student' } }),
      Query.count(),
      User.count({ where: { status: 'pending_approval' } }),
    ]);

    return { totalSchools, totalAdmins, totalStudents, totalQueries, pendingRegistrations };
  }
}

export default AdminService;
