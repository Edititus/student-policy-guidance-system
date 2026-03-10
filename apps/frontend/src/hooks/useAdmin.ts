/**
 * Admin Hooks
 * Admin dashboard React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { queryKeys } from './queryKeys';
import type { ConfidenceLevel, AnalyticsPeriod, ExportDataType, BulkPolicyAction } from '../types';

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

export function useDismissQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queryId: string) => adminApi.dismissQuery(queryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'escalated'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useDeleteQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queryId: string) => adminApi.deleteQuery(queryId),
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
  confidence?: ConfidenceLevel;
}) {
  return useQuery({
    queryKey: queryKeys.adminQueries(params),
    queryFn: () => adminApi.getAllQueries(params),
    staleTime: 30 * 1000,
  });
}

export function useAnalytics(period?: AnalyticsPeriod) {
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

export function useCoverageGaps(limit?: number) {
  return useQuery({
    queryKey: queryKeys.adminCoverageGaps(limit),
    queryFn: () => adminApi.getCoverageGaps(limit),
    staleTime: 60 * 1000,
  });
}

export function useDebugRetrieval() {
  return useMutation({
    mutationFn: (data: { query: string; schoolId?: string; topK?: number }) =>
      adminApi.debugRetrieval(data),
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: (type: ExportDataType) => adminApi.exportData(type),
    onSuccess: (blob: Blob, type: ExportDataType) => {
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
      action: BulkPolicyAction;
    }) => adminApi.bulkPolicyAction(policyIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

// ============================================
// Student Approval & User Management Hooks
// ============================================

export function usePendingStudents(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.adminPendingStudents,
    queryFn: () => adminApi.getPendingStudents(params),
    staleTime: 30 * 1000,
  });
}

export function useApproveStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => adminApi.approveStudent(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useRejectStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => adminApi.rejectStudent(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      schoolId?: string;
      department?: string;
      studentId?: string;
      year?: string;
    }) => adminApi.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: 'active' | 'suspended' | 'rejected' }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (userId: number) => adminApi.resetPassword(userId),
  });
}
