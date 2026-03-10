/**
 * Schools Hooks
 * School-related React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { schoolsApi } from '../api/client';
import { queryKeys } from './queryKeys';

export function useSchools() {
  return useQuery({
    queryKey: queryKeys.schools,
    queryFn: () => schoolsApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes - schools don't change often
  });
}
