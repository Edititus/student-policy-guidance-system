/**
 * Query Keys for Cache Management
 * Centralized key factory functions for React Query
 */

export const queryKeys = {
  // Auth
  user: ['user'] as const,
  profile: ['profile'] as const,

  // Schools
  schools: ['schools'] as const,

  // Chat
  chatHistory: (conversationId?: string) => ['chatHistory', conversationId] as const,
  conversations: ['conversations'] as const,

  // Admin
  adminStats: ['admin', 'stats'] as const,
  adminQueries: (params?: object) => ['admin', 'queries', params] as const,
  adminEscalated: (params?: object) => ['admin', 'escalated', params] as const,
  adminAnalytics: (period?: string) => ['admin', 'analytics', period] as const,
  adminActivity: (limit?: number) => ['admin', 'activity', limit] as const,
  adminUsers: (params?: object) => ['admin', 'users', params] as const,
  adminCoverageGaps: (limit?: number) => ['admin', 'coverage-gaps', limit] as const,
  adminStudents: (params?: object) => ['admin', 'students', params] as const,
  adminPendingStudents: ['admin', 'students', 'pending'] as const,

  // Super Admin
  platformStats: ['super-admin', 'platform-stats'] as const,
  adminsList: (params?: object) => ['super-admin', 'admins', params] as const,
  adminSchools: ['super-admin', 'schools'] as const,

  // Policies
  policies: (schoolId?: string) => ['policies', schoolId] as const,
  policy: (id: number) => ['policy', id] as const,
};
