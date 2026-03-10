/**
 * React Query Hooks for API Data Fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  schoolsApi,
  chatApi,
  adminApi,
  policiesApi,
  LoginRequest,
  RegisterRequest,
  ChatRequest,
  User,
  ApiResponse,
  LoginResponse,
} from '../api/client';

// ============================================
// Query Keys for Cache Management
// ============================================

export const queryKeys = {
  // Auth
  user: ['user'] as const,
  profile: ['profile'] as const,

  // Schools
  schools: ['schools'] as const,

  // Chat
  chatHistory: ['chatHistory'] as const,

  // Admin
  adminStats: ['admin', 'stats'] as const,
  adminQueries: (params?: object) => ['admin', 'queries', params] as const,
  adminEscalated: (params?: object) => ['admin', 'escalated', params] as const,
  adminAnalytics: (period?: string) => ['admin', 'analytics', period] as const,
  adminActivity: (limit?: number) => ['admin', 'activity', limit] as const,
  adminUsers: (params?: object) => ['admin', 'users', params] as const,

  // Policies
  policies: (schoolId?: string) => ['policies', schoolId] as const,
  policy: (id: number) => ['policy', id] as const,
};

// ============================================
// Auth Hooks
// ============================================

export function useVerifyAuth() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => authApi.verify(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response: ApiResponse<LoginResponse>) => {
      if (response.data) {
        localStorage.setItem('auth_token', response.data.token);
        queryClient.setQueryData(queryKeys.user, { data: { user: response.data.user } });
      }
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response: ApiResponse<LoginResponse>) => {
      if (response.data) {
        localStorage.setItem('auth_token', response.data.token);
        queryClient.setQueryData(queryKeys.user, { data: { user: response.data.user } });
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      queryClient.clear();
    },
    onError: () => {
      // Even if server logout fails, clear local state
      localStorage.removeItem('auth_token');
      queryClient.clear();
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => authApi.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => authApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword),
  });
}

// ============================================
// Schools Hooks
// ============================================

export function useSchools() {
  return useQuery({
    queryKey: queryKeys.schools,
    queryFn: () => schoolsApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes - schools don't change often
  });
}

// ============================================
// Chat Hooks
// ============================================

export function useChatHistory() {
  return useQuery({
    queryKey: queryKeys.chatHistory,
    queryFn: () => chatApi.getChatHistory(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChatRequest) => chatApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatHistory });
    },
  });
}

// ============================================
// Admin Hooks
// ============================================

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: () => adminApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
}

export function useEscalatedQueries(params?: {
  limit?: number;
  offset?: number;
  includeResponded?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.adminEscalated(params),
    queryFn: () => adminApi.getEscalatedQueries(params),
    staleTime: 30 * 1000,
  });
}

export function useRespondToQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ queryId, response }: { queryId: string; response: string }) =>
      adminApi.respondToQuery(queryId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'escalated'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useAdminQueries(params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}) {
  return useQuery({
    queryKey: queryKeys.adminQueries(params),
    queryFn: () => adminApi.getAllQueries(params),
    staleTime: 30 * 1000,
  });
}

export function useAnalytics(period?: 'day' | 'week' | 'month') {
  return useQuery({
    queryKey: queryKeys.adminAnalytics(period),
    queryFn: () => adminApi.getAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: queryKeys.adminActivity(limit),
    queryFn: () => adminApi.getRecentActivity(limit),
    staleTime: 30 * 1000,
  });
}

export function useAdminUsers(params?: {
  role?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: () => adminApi.getUsers(params),
    staleTime: 60 * 1000,
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: (type: 'queries' | 'policies' | 'users') => adminApi.exportData(type),
    onSuccess: (blob: Blob, type: 'queries' | 'policies' | 'users') => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useBulkPolicyAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      policyIds,
      action,
    }: {
      policyIds: number[];
      action: 'activate' | 'deactivate' | 'delete';
    }) => adminApi.bulkPolicyAction(policyIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

// ============================================
// Policies Hooks
// ============================================

export function usePolicies(schoolId?: string) {
  return useQuery({
    queryKey: queryKeys.policies(schoolId),
    queryFn: () => policiesApi.getAll(schoolId),
    staleTime: 60 * 1000,
  });
}

export function usePolicy(id: number) {
  return useQuery({
    queryKey: queryKeys.policy(id),
    queryFn: () => policiesApi.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useUploadPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => policiesApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useActivatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => policiesApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export function useDeactivatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => policiesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => policiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}
