/**
 * API Configuration and Base Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Base fetch function with auth and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Global 401 interceptor — session expired or user deactivated
    if (response.status === 401) {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      // Only redirect if not already on the login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    throw new ApiError(
      response.status,
      data.message || 'An error occurred',
      data
    );
  }

  return data;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================
// Auth API
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'super_admin';
  status?: 'pending_approval' | 'active' | 'rejected' | 'suspended';
  schoolId?: string;
  schoolName?: string;
  schoolDomain?: string;
  department?: string;
  studentId?: string;
  year?: string;
  active: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  schoolId?: string;
  schoolName?: string;
  schoolDomain?: string;
  department?: string;
  studentId?: string;
  year?: string;
}

export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  platformLogin: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    apiFetch('/auth/platform-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verify: (): Promise<ApiResponse<{ user: User }>> =>
    apiFetch('/auth/verify'),

  logout: (): Promise<ApiResponse<null>> =>
    apiFetch('/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse<null>> =>
    apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getProfile: (): Promise<ApiResponse<{ user: User }>> =>
    apiFetch('/auth/me'),

  updateProfile: (data: Partial<User>): Promise<ApiResponse<{ user: User }>> =>
    apiFetch('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ============================================
// Schools API
// ============================================

export interface School {
  id: string;
  name: string;
  domain: string;
  country?: string;
  type?: 'public' | 'private';
}

export const schoolsApi = {
  getAll: (): Promise<{ success: boolean; schools: School[] }> =>
    apiFetch('/schools'),
};

// ============================================
// Chat API
// ============================================

export interface ChatMessage {
  id: string;
  query: string;
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sources: Array<{
    policyId: string | number;
    policyTitle: string;
    excerpt: string;
    similarity?: number;
    pageReference?: string;
  }>;
  requiresEscalation: boolean;
  timestamp: string;
  responseTimeMs?: number;
  conversationId?: string;
  retrievalDiagnostics?: {
    schoolId?: string;
    topSimilarity: number | null;
    candidatesScanned: number;
    thresholdUsed: number;
    filteredOutCount: number;
    failureReason?: 'NO_CANDIDATES' | 'BELOW_THRESHOLD' | 'NO_GROUNDED_ANSWER';
  };
}

export interface ChatRequest {
  query: string;
  conversationId?: string;
  schoolId?: string;
  studentContext?: {
    year?: string;
    department?: string;
    program?: string;
  };
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  lastActivity: string;
}

export const chatApi = {
  sendMessage: (data: ChatRequest): Promise<ApiResponse<ChatMessage>> =>
    apiFetch('/chat/query', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getChatHistory: (conversationId?: string): Promise<ApiResponse<{ messages: ChatMessage[] }>> =>
    apiFetch(`/chat/history${conversationId ? `?conversationId=${conversationId}` : ''}`),

  getConversations: (): Promise<ApiResponse<{ conversations: ConversationSummary[] }>> =>
    apiFetch('/chat/conversations'),
};

// ============================================
// Admin API
// ============================================

export interface DashboardStats {
  totalQueries: number;
  averageConfidence: number;
  escalationRate: number;
  averageRating: number;
  uniqueStudents: number;
  totalPolicies: number;
  totalUsers: number;
}

export interface EscalatedQuery {
  id: number;
  queryId: string;
  queryText: string;
  studentId?: number;
  studentName?: string;
  studentEmail?: string;
  aiAnswer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  responded: boolean;
  adminResponse?: string;
  respondedAt?: string;
  schoolId?: string;
  escalationStatus?: 'pending' | 'in_review' | 'resolved' | 'dismissed';
}

export interface AnalyticsData {
  confidenceDistribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  queryCategories: Record<string, number>;
  queriesOverTime: Array<{ date: string; count: number }>;
  avgResponseTime: number;
  userSatisfaction: number;
}

export interface Activity {
  type: 'query' | 'policy' | 'user' | 'escalation';
  title: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success';
}

export interface RetrievalDebugResult {
  schoolId?: string;
  thresholdUsed: number;
  candidatesScanned: number;
  acceptedCount: number;
  filteredOutCount: number;
  topSimilarity: number | null;
  candidates: Array<{
    policyId: number;
    policyTitle: string;
    similarity: number;
    excerpt: string;
    accepted: boolean;
  }>;
}

export interface CoverageGap {
  intent: string;
  sampleQuery: string;
  count: number;
}

export const adminApi = {
  getStats: (): Promise<ApiResponse<DashboardStats>> =>
    apiFetch('/admin/stats'),

  getEscalatedQueries: (params?: {
    limit?: number;
    offset?: number;
    includeResponded?: boolean;
  }): Promise<ApiResponse<EscalatedQuery[]> & { pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.includeResponded) searchParams.set('includeResponded', 'true');
    const query = searchParams.toString();
    return apiFetch(`/admin/escalated-queries${query ? `?${query}` : ''}`);
  },

  respondToQuery: (queryId: string, response: string): Promise<ApiResponse<null>> =>
    apiFetch(`/admin/queries/${queryId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),

  dismissQuery: (queryId: string): Promise<ApiResponse<null>> =>
    apiFetch(`/admin/queries/${queryId}/dismiss`, { method: 'POST' }),

  deleteQuery: (queryId: string): Promise<ApiResponse<null>> =>
    apiFetch(`/admin/queries/${queryId}`, { method: 'DELETE' }),

  getAllQueries: (params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  }): Promise<ApiResponse<unknown[]> & { pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.confidence) searchParams.set('confidence', params.confidence);
    const query = searchParams.toString();
    return apiFetch(`/admin/queries${query ? `?${query}` : ''}`);
  },

  getAnalytics: (period?: 'day' | 'week' | 'month'): Promise<ApiResponse<AnalyticsData>> =>
    apiFetch(`/admin/analytics${period ? `?period=${period}` : ''}`),

  getRecentActivity: (limit?: number): Promise<ApiResponse<Activity[]>> =>
    apiFetch(`/admin/activity${limit ? `?limit=${limit}` : ''}`),

  getUsers: (params?: {
    role?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<User[]> & { pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set('role', params.role);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return apiFetch(`/admin/users${query ? `?${query}` : ''}`);
  },

  debugRetrieval: (data: {
    query: string;
    schoolId?: string;
    topK?: number;
  }): Promise<ApiResponse<RetrievalDebugResult>> =>
    apiFetch('/admin/retrieval/debug', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCoverageGaps: (limit?: number): Promise<ApiResponse<CoverageGap[]>> =>
    apiFetch(`/admin/coverage-gaps${limit ? `?limit=${limit}` : ''}`),

  exportData: (type: 'queries' | 'policies' | 'users'): Promise<Blob> =>
    fetch(`${API_BASE_URL}/admin/export?type=${type}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }).then((res) => res.blob()),

  bulkPolicyAction: (
    policyIds: number[],
    action: 'activate' | 'deactivate' | 'delete'
  ): Promise<ApiResponse<{ affected: number }>> =>
    apiFetch('/admin/policies/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ policyIds, action }),
    }),

  // Student approval & user management
  getPendingStudents: (params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<User[]> & { pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return apiFetch(`/admin/students/pending${query ? `?${query}` : ''}`);
  },

  approveStudent: (userId: number): Promise<ApiResponse<User>> =>
    apiFetch(`/admin/students/${userId}/approve`, { method: 'POST' }),

  rejectStudent: (userId: number): Promise<ApiResponse<User>> =>
    apiFetch(`/admin/students/${userId}/reject`, { method: 'POST' }),

  createStudent: (data: {
    email: string;
    password: string;
    name: string;
    schoolId?: string;
    department?: string;
    studentId?: string;
    year?: string;
  }): Promise<ApiResponse<User>> =>
    apiFetch('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUserStatus: (userId: number, status: 'active' | 'suspended' | 'rejected'): Promise<ApiResponse<User>> =>
    apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  resetPassword: (userId: number): Promise<ApiResponse<{ id: number; email: string; name: string; tempPassword: string }>> =>
    apiFetch(`/admin/users/${userId}/reset-password`, { method: 'POST' }),
};

// ============================================
// Policies API
// ============================================

export interface Policy {
  id: number;
  policyId: string;
  title: string;
  content?: string;
  category: string;
  schoolId: string;
  schoolName: string;
  visibility: 'public' | 'school_only' | 'private';
  version?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingJob {
  id: string;
  filename: string;
  schoolId: string;
  status: 'uploading' | 'parsing' | 'ocr' | 'embedding' | 'complete' | 'error';
  progress: number;
  totalChunks?: number;
  processedChunks?: number;
  policyId?: number;
  error?: string;
  startedAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  jobId: string;
  filename: string;
  status: string;
}

export const policiesApi = {
  getAll: (schoolId?: string): Promise<ApiResponse<Policy[]>> =>
    apiFetch(`/policies${schoolId ? `?schoolId=${schoolId}` : ''}`),

  getById: (id: number): Promise<ApiResponse<Policy>> =>
    apiFetch(`/policies/${id}`),

  upload: (formData: FormData): Promise<ApiResponse<UploadResponse>> =>
    fetch(`${API_BASE_URL}/policies/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }).then((res) => res.json()),

  getProcessingStatus: (jobId?: string): Promise<ApiResponse<ProcessingJob | { jobs: ProcessingJob[]; activeCount: number }>> =>
    apiFetch(`/policies/processing${jobId ? `?jobId=${jobId}` : ''}`),

  update: (id: number, data: { title?: string; category?: string; visibility?: string }): Promise<ApiResponse<Policy>> =>
    apiFetch(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  activate: (id: number): Promise<ApiResponse<null>> =>
    apiFetch(`/policies/${id}/activate`, { method: 'POST' }),

  deactivate: (id: number): Promise<ApiResponse<null>> =>
    apiFetch(`/policies/${id}/deactivate`, { method: 'POST' }),

  delete: (id: number): Promise<ApiResponse<null>> =>
    apiFetch(`/policies/${id}`, { method: 'DELETE' }),
};

// ============================================
// Super Admin API
// ============================================

export interface PlatformStats {
  totalSchools: number;
  totalAdmins: number;
  totalStudents: number;
  totalQueries: number;
  pendingRegistrations: number;
}

export const superAdminApi = {
  getPlatformStats: (): Promise<ApiResponse<PlatformStats>> =>
    apiFetch('/admin/platform-stats'),

  getAdmins: (params?: { schoolId?: string }): Promise<ApiResponse<User[]>> => {
    const searchParams = new URLSearchParams();
    if (params?.schoolId) searchParams.set('schoolId', params.schoolId);
    const query = searchParams.toString();
    return apiFetch(`/admin/admins${query ? `?${query}` : ''}`);
  },

  createAdmin: (data: {
    email: string;
    name: string;
    schoolId: string;
  }): Promise<ApiResponse<User & { tempPassword: string }>> =>
    apiFetch('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  suspendAdmin: (userId: number): Promise<ApiResponse<User>> =>
    apiFetch(`/admin/admins/${userId}/suspend`, { method: 'POST' }),

  getSchools: (): Promise<ApiResponse<School[]>> =>
    apiFetch('/admin/schools'),
};

export default {
  auth: authApi,
  schools: schoolsApi,
  chat: chatApi,
  admin: adminApi,
  superAdmin: superAdminApi,
  policies: policiesApi,
};
