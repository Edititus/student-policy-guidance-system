import { describe, it, expect } from 'vitest'
import QueryModel from '../QueryModel'
import AuditLog from '../AuditLog'

describe('Phase 2 schema models', () => {
  it('QueryModel includes escalation fields', () => {
    const attrs = QueryModel.getAttributes()

    expect(attrs.escalatedAt).toBeDefined()
    expect(attrs.escalationReason).toBeDefined()
    expect(attrs.escalationStatus).toBeDefined()
    expect(attrs.escalatedBy).toBeDefined()
    expect(attrs.resolvedAt).toBeDefined()
    expect(attrs.resolvedBy).toBeDefined()
    expect(attrs.resolutionNotes).toBeDefined()
  })

  it('AuditLog model exposes expected attributes', () => {
    const attrs = AuditLog.getAttributes()

    expect(attrs.action).toBeDefined()
    expect(attrs.entityType).toBeDefined()
    expect(attrs.entityId).toBeDefined()
    expect(attrs.userId).toBeDefined()
    expect(attrs.schoolId).toBeDefined()
    expect(attrs.ipAddress).toBeDefined()
    expect(attrs.userAgent).toBeDefined()
    expect(attrs.metadata).toBeDefined()
  })
})
