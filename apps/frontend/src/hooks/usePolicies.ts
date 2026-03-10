/**
 * Policies Hooks
 * Policy management React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policiesApi } from '../api/client';
import { queryKeys } from './queryKeys';

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

export function useUpdatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; category?: string; visibility?: string } }) =>
      policiesApi.update(id, data),
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
