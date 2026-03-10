/**
 * Chat types - messages, requests, and conversation
 */

import type { ConfidenceLevel } from './api';

/**
 * Citation source from a policy document
 */
export interface IChatSource {
  policyId: string | number;
  policyTitle: string;
  excerpt: string;
  similarity?: number;
  pageReference?: string;
}

/**
 * Chat message from API response
 */
export interface IChatMessage {
  id: string;
  query: string;
  answer: string;
  confidence: ConfidenceLevel;
  sources: IChatSource[];
  requiresEscalation: boolean;
  timestamp: string;
  responseTimeMs?: number;
  retrievalDiagnostics?: {
    schoolId?: string;
    topSimilarity: number | null;
    candidatesScanned: number;
    thresholdUsed: number;
    filteredOutCount: number;
    failureReason?: 'NO_CANDIDATES' | 'BELOW_THRESHOLD' | 'NO_GROUNDED_ANSWER';
  };
}

/**
 * Student context for personalized responses
 */
export interface IStudentContext {
  year?: string;
  department?: string;
  program?: string;
  level?: string;
}

/**
 * Chat request payload
 */
export interface IChatRequest {
  query: string;
  schoolId?: string;
  sessionId?: string;
  studentContext?: IStudentContext;
}

/**
 * Message role for UI display
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * UI message representation (differs from API response)
 */
export interface IUIMessage {
  id: string;
  role: MessageRole;
  content: string;
  confidence?: ConfidenceLevel;
  sources?: Array<{
    policyTitle: string;
    excerpt: string;
  }>;
  timestamp: Date;
}

/**
 * Chat history response wrapper
 */
export interface IChatHistoryResponse {
  messages: IChatMessage[];
}
