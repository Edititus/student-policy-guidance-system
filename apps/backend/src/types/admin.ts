/**
 * Admin module type definitions
 * Consolidates repeated types used across admin services and controllers
 */

// ============================================
// Core Enums
// ============================================

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ActivityType = 'query' | 'policy' | 'user' | 'escalation';
export type ActivitySeverity = 'info' | 'warning' | 'success';
export type ExportType = 'queries' | 'policies' | 'users';
export type BulkAction = 'activate' | 'deactivate' | 'delete';
export type AnalyticsPeriod = 'day' | 'week' | 'month';

// ============================================
// Dashboard & Stats
// ============================================

export interface DashboardStats {
  totalQueries: number;
  averageConfidence: number;
  escalationRate: number;
  averageRating: number;
  uniqueStudents: number;
  totalPolicies: number;
  totalUsers: number;
}

// ============================================
// Escalated Queries
// ============================================

export interface EscalatedQuery {
  id: number;
  queryId: string;
  queryText: string;
  studentId?: number;
  studentName?: string;
  studentEmail?: string;
  aiAnswer: string;
  confidence: ConfidenceLevel;
  timestamp: Date;
  responded: boolean;
  adminResponse?: string;
  respondedAt?: Date;
  schoolId?: string;
  schoolName?: string;
  escalationStatus?: 'pending' | 'in_review' | 'resolved' | 'dismissed';
}

export interface EscalatedQueryFilters {
  limit?: number;
  offset?: number;
  includeResponded?: boolean;
  status?: 'pending' | 'in_review' | 'resolved' | 'dismissed';
}

// ============================================
// Analytics
// ============================================

export interface ConfidenceDistribution {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

export interface QueryOverTime {
  date: string;
  count: number;
}

export interface AnalyticsData {
  confidenceDistribution: ConfidenceDistribution;
  queryCategories: Record<string, number>;
  queriesOverTime: QueryOverTime[];
  avgResponseTime: number;
  userSatisfaction: number;
}

// ============================================
// Activity Feed
// ============================================

/**
 * Raw activity data from service layer
 * Does NOT include UI-specific fields like title/description
 */
export interface RawActivity {
  type: ActivityType;
  entityId: number | string;
  entityName: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Formatted activity for UI display
 * Created by controller/presenter layer
 */
export interface FormattedActivity {
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  severity: ActivitySeverity;
}

// ============================================
// Export & Bulk Operations
// ============================================

export interface ExportFilters {
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: ExportType;
}

// ============================================
// Retrieval Debug / Coverage Gaps
// ============================================

export interface RetrievalDebugCandidate {
  policyId: number;
  policyTitle: string;
  similarity: number;
  excerpt: string;
  accepted: boolean;
}

export interface RetrievalDebugResult {
  schoolId?: string;
  thresholdUsed: number;
  candidatesScanned: number;
  acceptedCount: number;
  filteredOutCount: number;
  topSimilarity: number | null;
  candidates: RetrievalDebugCandidate[];
}

export interface CoverageGap {
  intent: string;
  sampleQuery: string;
  count: number;
}

// ============================================
// Query Filters
// ============================================

export interface QueryFilters {
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
  confidence?: ConfidenceLevel;
  limit?: number;
  offset?: number;
}

// ============================================
// User Management
// ============================================

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Pagination
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// Service Result Types
// ============================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Model Field Types (for Sequelize row extraction)
// ============================================

export interface QueryRow {
  id: number;
  queryId: string;
  query: string;
  answer: string;
  confidence: number;
  requiresEscalation: boolean;
  userId?: number;
  schoolId?: string;
  metadata?: Record<string, unknown>;
  sources?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRow {
  id: number;
  policyId: string;
  title: string;
  category: string;
  schoolId: string;
  schoolName: string;
  content?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  status?: string;
  schoolId?: string;
  schoolName?: string;
  department?: string;
  studentId?: string;
  year?: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert confidence float (0-1) to level string
 */
export function confidenceToLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.85) return 'HIGH';
  if (confidence >= 0.7) return 'MEDIUM';
  return 'LOW';
}

/**
 * Safely get substring with null check
 */
export function safeSubstring(
  value: string | null | undefined,
  start: number,
  end?: number
): string {
  if (!value || typeof value !== 'string') return '';
  const safeEnd = end !== undefined ? Math.min(end, value.length) : value.length;
  return value.substring(start, safeEnd);
}

/**
 * Safely truncate string with ellipsis
 */
export function truncate(
  value: string | null | undefined,
  maxLength: number,
  ellipsis: string = '...'
): string {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + ellipsis;
}
