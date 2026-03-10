/**
 * Auth Hooks
 * Authentication-related React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, LoginRequest, RegisterRequest, User, ApiResponse, LoginResponse } from '../api/client';
import { queryKeys } from './queryKeys';

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
