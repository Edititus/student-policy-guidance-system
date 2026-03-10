/**
 * Interview Data Models
 * For storing and managing qualitative research data from Phase 1
 */

export enum ParticipantType {
  ADMINISTRATOR = 'ADMINISTRATOR',
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY'
}

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  TRANSCRIBED = 'TRANSCRIBED',
  CODED = 'CODED',
  ANALYZED = 'ANALYZED'
}

export interface Participant {
  id: string // Anonymized (e.g., A01, S01)
  type: ParticipantType
  role?: string // e.g., "Registrar", "Student Affairs Officer"
  department?: string
  yearsOfExperience?: number // For admins
  program?: string // For students
  yearLevel?: number // For students
  consentGiven: boolean
  consentDate: Date
  demographics: {
    ageRange?: string // e.g., "18-25"
    gender?: string
  }
}

export interface Interview {
  id: string
  participant: Participant
  interviewDate: Date
  duration: number // minutes
  interviewer: string
  location: string
  format: 'IN_PERSON' | 'VIRTUAL' | 'PHONE'
  status: InterviewStatus
  audioFilePath?: string
  transcriptFilePath?: string
  transcript?: string
  notes?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface FocusGroup {
  id: string
  sessionDate: Date
  participants: Participant[]
  facilitator: string
  duration: number // minutes
  location: string
  status: InterviewStatus
  audioFilePath?: string
  transcriptFilePath?: string
  transcript?: string
  notes?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Code {
  id: string
  name: string // e.g., "QUERY_REGISTRATION"
  description: string
  category?: string // Group codes into categories
  color?: string // For visualization
  createdAt: Date
}

export interface CodedSegment {
  id: string
  interviewId: string
  text: string // The quoted segment
  codes: string[] // Array of code IDs
  startTime?: number // Timestamp in audio (seconds)
  endTime?: number
  memo?: string // Researcher notes
  createdAt: Date
  createdBy: string
}

export interface Theme {
  id: string
  name: string
  description: string
  codes: string[] // Related code IDs
  supportingQuotes: CodedSegment[]
  prevalence: number // How many participants mentioned
  createdAt: Date
  updatedAt: Date
}

export interface ResearchNote {
  id: string
  title: string
  content: string
  relatedInterviews?: string[]
  relatedCodes?: string[]
  relatedThemes?: string[]
  createdAt: Date
  updatedAt: Date
}
