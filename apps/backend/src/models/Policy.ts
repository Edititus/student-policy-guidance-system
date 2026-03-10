/**
 * Policy Domain Models
 * Core data structures for policy documents and rules
 */

export enum PolicyCategory {
  ACADEMIC = 'ACADEMIC',
  FINANCIAL = 'FINANCIAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  STUDENT_AFFAIRS = 'STUDENT_AFFAIRS',
  EXAMINATION = 'EXAMINATION',
  OTHER = 'OTHER',
}

export enum PolicyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export interface PolicyMetadata {
  institution: string
  academicYear: string
  version: string
  lastUpdated: Date
  sourceDocument: string
  pageNumber?: number
  section?: string
  parseDiagnostics?: {
    ocrUsed?: boolean
    fallback?: 'PDF_OCR_FALLBACK_USED'
  }
}

export interface PolicyRule {
  id: string
  condition: string // IF clause
  action: string // THEN clause
  exceptions?: string[] // Special cases
  consequences?: string // What happens if violated
  relatedPolicies?: string[] // IDs of related policies
  ambiguityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  notes?: string
}

export interface PolicyDocument {
  id: string
  title: string
  category: PolicyCategory
  content: string // Full policy text
  summary?: string // Brief description
  rules: PolicyRule[]
  metadata: PolicyMetadata
  status: PolicyStatus
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string // Admin user ID
}

export interface PolicySearchQuery {
  query: string
  category?: PolicyCategory
  institution?: string
  tags?: string[]
  status?: PolicyStatus
}

export interface PolicySearchResult {
  policy: PolicyDocument
  relevanceScore: number
  matchedSections: string[]
}

/**
 * Policy Embedding for vector search
 */
export interface PolicyEmbedding {
  id: string
  policyId: string
  chunkText: string
  embedding: number[]
  chunkIndex: number
  metadata?: {
    policyTitle?: string
    category?: PolicyCategory
    institution?: string
    [key: string]: any
  }
}

/**
 * Student Context for personalized responses
 */
export interface StudentContext {
  studentId?: string
  program?: string
  year?: number
  level?: string
  enrollmentStatus?: 'FULL_TIME' | 'PART_TIME' | 'DEFERRED'
  cgpa?: number
  nationality?: string
  financialStatus?: 'PAID' | 'PARTIAL' | 'OWING'
}

/**
 * Policy Query from student
 */
export interface PolicyQuery {
  id: string
  query: string
  studentContext?: StudentContext
  timestamp: Date
  sessionId?: string
  conversationId?: string
}

/**
 * AI-generated policy response
 */
export interface PolicyResponse {
  id: string
  queryId: string
  answer: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  sources: Array<{
    policyId: string
    policyTitle: string
    excerpt: string
    pageReference?: string
  }>
  reasoning?: string
  escalated: boolean
  timestamp: Date
}
