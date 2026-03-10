/**
 * Admin dashboard types - stats, queries, analytics, activity
 */

import type { ConfidenceLevel } from './api';

/**
 * Dashboard statistics overview
 */
export interface IDashboardStats {
  totalQueries: number;
  averageConfidence: number;
  escalationRate: number;
  averageRating: number;
  uniqueStudents: number;
  totalPolicies: number;
  totalUsers: number;
}

/**
 * Escalated query requiring admin review
 */
export interface IEscalatedQuery {
  id: number;
  queryId: string;
  queryText: string;
  studentId?: number;
  studentName?: string;
  studentEmail?: string;
  aiAnswer: string;
  confidence: ConfidenceLevel;
  timestamp: string;
  responded: boolean;
  adminResponse?: string;
  respondedAt?: string;
  schoolId?: string;
  escalationStatus?: 'pending' | 'in_review' | 'resolved' | 'dismissed';
}

/**
 * Query parameters for fetching escalated queries
 */
export interface IEscalatedQueryParams {
  limit?: number;
  offset?: number;
  includeResponded?: boolean;
}

/**
 * Query parameters for fetching all queries
 */
export interface IAllQueriesParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  confidence?: ConfidenceLevel;
}

/**
 * Confidence distribution for analytics
 */
export interface IConfidenceDistribution {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

/**
 * Time series data point for queries over time
 */
export interface IQueryTimePoint {
  date: string;
  count: number;
}

/**
 * Analytics data for dashboard
 */
export interface IAnalyticsData {
  confidenceDistribution: IConfidenceDistribution;
  queryCategories: Record<string, number>;
  queriesOverTime: IQueryTimePoint[];
  avgResponseTime: number;
  userSatisfaction: number;
}

/**
 * Activity type enum
 */
export type ActivityType = 'query' | 'policy' | 'user' | 'escalation';

/**
 * Activity severity level
 */
export type ActivitySeverity = 'info' | 'warning' | 'success';

/**
 * Recent activity item for dashboard feed
 */
export interface IActivity {
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  severity: ActivitySeverity;
}

export interface ICoverageGap {
  intent: string;
  sampleQuery: string;
  count: number;
}

export interface IRetrievalDebugCandidate {
  policyId: number;
  policyTitle: string;
  similarity: number;
  excerpt: string;
  accepted: boolean;
}

export interface IRetrievalDebugResult {
  schoolId?: string;
  thresholdUsed: number;
  candidatesScanned: number;
  acceptedCount: number;
  filteredOutCount: number;
  topSimilarity: number | null;
  candidates: IRetrievalDebugCandidate[];
}

/**
 * Query parameters for fetching users
 */
export interface IUserListParams {
  role?: string;
  limit?: number;
  offset?: number;
}

/**
 * Analytics period enum
 */
export type AnalyticsPeriod = 'day' | 'week' | 'month';

/**
 * Export data type enum
 */
export type ExportDataType = 'queries' | 'policies' | 'users';

/**
 * Bulk policy action enum
 */
export type BulkPolicyAction = 'activate' | 'deactivate' | 'delete';

/**
 * Bulk action response
 */
export interface IBulkActionResponse {
  affected: number;
}

/**
 * Admin tab names
 */
export type AdminTab = 'overview' | 'queries' | 'policies' | 'analytics' | 'students';
