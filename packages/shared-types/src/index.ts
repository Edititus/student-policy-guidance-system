// Shared types for AI Student Policy Guidance

export interface User {
  userId: string
  schoolId: string
  role: 'student' | 'admin' | 'super_admin'
  email: string
  name: string
}

export interface Policy {
  policyId: string
  title: string
  content: string
  category: string
  schoolId: string
  visibility: 'public' | 'school_only'
  active: boolean
}

// Add more shared types as needed
