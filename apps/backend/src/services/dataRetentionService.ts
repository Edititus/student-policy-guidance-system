import { Op } from 'sequelize'
import Query from '../models/QueryModel'
import { AuditLog } from '../models/AuditLog'

export class DataRetentionService {
  private static instance: DataRetentionService
  private intervalHandle?: NodeJS.Timeout
  private readonly retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '90', 10)

  static getInstance(): DataRetentionService {
    if (!DataRetentionService.instance) {
      DataRetentionService.instance = new DataRetentionService()
    }
    return DataRetentionService.instance
  }

  start(): void {
    if (this.intervalHandle) return
    this.runCleanup().catch((error) => console.error('Retention cleanup failed:', error))
    this.intervalHandle = setInterval(
      () => this.runCleanup().catch((error) => console.error('Retention cleanup failed:', error)),
      24 * 60 * 60 * 1000
    )
  }

  async runCleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000)

    const [deletedQueries, deletedAudit] = await Promise.all([
      Query.destroy({
        where: { createdAt: { [Op.lt]: cutoff } },
      }),
      AuditLog.destroy({
        where: { createdAt: { [Op.lt]: cutoff } },
      }),
    ])

    if (deletedQueries > 0 || deletedAudit > 0) {
      console.log(
        `🧹 Retention cleanup removed ${deletedQueries} queries and ${deletedAudit} audit logs older than ${this.retentionDays} days`
      )
    }
  }
}

export default DataRetentionService
