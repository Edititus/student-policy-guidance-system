/**
 * Super Admin Hooks
 * React Query hooks for super admin dashboard features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../api/client';
import { queryKeys } from './queryKeys';

export function usePlatformStats() {
  return useQuery({
    queryKey: queryKeys.platformStats,
    queryFn: () => superAdminApi.getPlatformStats(),
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useAdmins(params?: { schoolId?: string }) {
  return useQuery({
    queryKey: queryKeys.adminsList(params),
    queryFn: () => superAdminApi.getAdmins(params),
    staleTime: 60 * 1000,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; name: string; schoolId: string }) =>
      superAdminApi.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platformStats });
    },
  });
}

export function useSuspendAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => superAdminApi.suspendAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.platformStats });
    },
  });
}

export function useAdminSchools() {
  return useQuery({
    queryKey: queryKeys.adminSchools,
    queryFn: () => superAdminApi.getSchools(),
    staleTime: 5 * 60 * 1000,
  });
}
