/**
 * Chat Hooks
 * Chat-related React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, ChatRequest } from '../api/client';
import { queryKeys } from './queryKeys';

export function useChatHistory(conversationId?: string) {
  return useQuery({
    queryKey: queryKeys.chatHistory(conversationId),
    queryFn: () => chatApi.getChatHistory(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => chatApi.getConversations(),
    staleTime: 10 * 1000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChatRequest) => chatApi.sendMessage(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatHistory(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}
