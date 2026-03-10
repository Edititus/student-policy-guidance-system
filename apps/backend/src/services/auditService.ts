import { AuditLog } from '../models/AuditLog'

export type AuditInput = {
  action: string
  entityType: string
  entityId?: string
  userId?: number
  schoolId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export class AuditService {
  private static instance: AuditService

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  async log(event: AuditInput): Promise<void> {
    try {
      await AuditLog.create({
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId || '',
        userId: event.userId,
        schoolId: event.schoolId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: event.metadata || {},
      })
    } catch (error) {
      console.error('Audit log write failed:', error)
    }
  }
}

export default AuditService
