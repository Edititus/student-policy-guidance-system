/**
 * Central type exports
 * Import from '@/types' or '../types' rather than individual files
 */

// API core types
export {
  ApiError,
  type IApiResponse,
  type IPaginationInfo,
  type IPaginatedResponse,
  type ConfidenceLevel,
  type IListParams,
  type IDateRangeParams,
} from './api';

// Authentication types
export {
  type UserRole,
  type UserStatus,
  type IUser,
  type ILoginRequest,
  type ILoginResponse,
  type IRegisterRequest,
  type IAuthContext,
  type IProfileUpdateRequest,
} from './auth';

// Admin dashboard types
export {
  type IDashboardStats,
  type IEscalatedQuery,
  type IEscalatedQueryParams,
  type IAllQueriesParams,
  type IConfidenceDistribution,
  type IQueryTimePoint,
  type IAnalyticsData,
  type ActivityType,
  type ActivitySeverity,
  type IActivity,
  type ICoverageGap,
  type IRetrievalDebugCandidate,
  type IRetrievalDebugResult,
  type IUserListParams,
  type AnalyticsPeriod,
  type ExportDataType,
  type BulkPolicyAction,
  type IBulkActionResponse,
  type AdminTab,
} from './admin';

// Chat types
export {
  type IChatSource,
  type IChatMessage,
  type IStudentContext,
  type IChatRequest,
  type MessageRole,
  type IUIMessage,
  type IChatHistoryResponse,
} from './chat';

// Policy types
export {
  type PolicyVisibility,
  type IPolicy,
  type IPolicyUploadResponse,
  type PolicyCategory,
} from './policies';

// School types
export {
  type SchoolType,
  type ISchool,
  type ISchoolsResponse,
} from './schools';
