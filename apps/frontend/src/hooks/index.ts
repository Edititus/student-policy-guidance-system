/**
 * Hooks Index
 * Re-exports all hooks for backward compatibility
 */

// Query keys
export { queryKeys } from './queryKeys';

// Auth hooks
export {
  useVerifyAuth,
  useLogin,
  useRegister,
  useLogout,
  useProfile,
  useUpdateProfile,
  useChangePassword,
} from './useAuth';

// Schools hooks
export { useSchools } from './useSchools';

// Chat hooks
export { useChatHistory, useSendMessage } from './useChat';

// Admin hooks
export {
  useAdminStats,
  useEscalatedQueries,
  useRespondToQuery,
  useAdminQueries,
  useAnalytics,
  useRecentActivity,
  useAdminUsers,
  useExportData,
  useBulkPolicyAction,
} from './useAdmin';

// Policy hooks
export {
  usePolicies,
  usePolicy,
  useUploadPolicy,
  useActivatePolicy,
  useDeactivatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
} from './usePolicies';
