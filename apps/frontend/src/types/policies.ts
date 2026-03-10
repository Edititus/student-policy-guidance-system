/**
 * Policy types - documents, visibility, and management
 */

/**
 * Policy visibility levels
 */
export type PolicyVisibility = 'public' | 'school_only' | 'private';

/**
 * Policy entity from API
 */
export interface IPolicy {
  id: number;
  policyId: string;
  title: string;
  content?: string;
  category: string;
  schoolId: string;
  schoolName: string;
  visibility: PolicyVisibility;
  version?: string;
  active: boolean;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Policy upload response
 */
export interface IPolicyUploadResponse {
  policyId: number;
  chunks: number;
}

/**
 * Policy category type (extensible)
 */
export type PolicyCategory = 
  | 'ACADEMIC'
  | 'FINANCIAL'
  | 'STUDENT_AFFAIRS'
  | 'EXAMINATION'
  | 'GENERAL'
  | string;
