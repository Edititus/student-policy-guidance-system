/**
 * Tracks policy upload/processing jobs for frontend status polling
 */

export interface ProcessingJob {
  id: string;
  filename: string;
  schoolId: string;
  status: 'uploading' | 'parsing' | 'ocr' | 'embedding' | 'complete' | 'error';
  progress: number; // 0-100
  totalChunks?: number;
  processedChunks?: number;
  policyId?: number;
  error?: string;
  startedAt: Date;
  updatedAt: Date;
}

class ProcessingTracker {
  private jobs: Map<string, ProcessingJob> = new Map();
  
  // Auto-cleanup completed jobs after 5 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

  constructor() {
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Start tracking a new processing job
   */
  startJob(id: string, filename: string, schoolId: string): ProcessingJob {
    const job: ProcessingJob = {
      id,
      filename,
      schoolId,
      status: 'uploading',
      progress: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    console.log(`📋 Started processing job: ${id} (${filename})`);
    return job;
  }

  /**
   * Update job status
   */
  updateJob(id: string, updates: Partial<ProcessingJob>): ProcessingJob | null {
    const job = this.jobs.get(id);
    if (!job) return null;

    Object.assign(job, updates, { updatedAt: new Date() });
    
    // Calculate progress based on status
    if (updates.status) {
      switch (updates.status) {
        case 'uploading': job.progress = 10; break;
        case 'parsing': job.progress = 20; break;
        case 'ocr': job.progress = 30; break;
        case 'embedding': 
          // Progress during embedding based on chunks
          if (job.totalChunks && job.processedChunks) {
            job.progress = 30 + Math.round((job.processedChunks / job.totalChunks) * 65);
          } else {
            job.progress = 50;
          }
          break;
        case 'complete': job.progress = 100; break;
        case 'error': break; // Keep current progress on error
      }
    }

    // If chunks are updated and progress wasn't explicitly set, recalculate
    if (
      updates.progress === undefined &&
      job.processedChunks !== undefined &&
      job.totalChunks !== undefined &&
      job.totalChunks > 0
    ) {
      job.progress = 30 + Math.round((job.processedChunks / job.totalChunks) * 65);
    }

    console.log(`📋 Job ${id}: ${job.status} (${job.progress}%)`);
    return job;
  }

  /**
   * Complete a job successfully
   */
  completeJob(id: string, policyId: number, chunks: number): ProcessingJob | null {
    return this.updateJob(id, {
      status: 'complete',
      policyId,
      totalChunks: chunks,
      processedChunks: chunks,
      progress: 100,
    });
  }

  /**
   * Mark job as failed
   */
  failJob(id: string, error: string): ProcessingJob | null {
    return this.updateJob(id, {
      status: 'error',
      error,
    });
  }

  /**
   * Get a specific job
   */
  getJob(id: string): ProcessingJob | null {
    return this.jobs.get(id) || null;
  }

  /**
   * Get all active jobs for a school
   */
  getActiveJobs(schoolId?: string): ProcessingJob[] {
    const activeStatuses = ['uploading', 'parsing', 'ocr', 'embedding'];
    const jobs = Array.from(this.jobs.values())
      .filter(job => activeStatuses.includes(job.status));
    
    if (schoolId) {
      return jobs.filter(job => job.schoolId === schoolId);
    }
    return jobs;
  }

  /**
   * Get recent jobs (active + completed in last 5 min)
   */
  getRecentJobs(schoolId?: string, limit = 10): ProcessingJob[] {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    let jobs = Array.from(this.jobs.values())
      .filter(job => job.updatedAt > fiveMinutesAgo || job.status === 'embedding' || job.status === 'ocr')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    if (schoolId) {
      jobs = jobs.filter(job => job.schoolId === schoolId);
    }
    
    return jobs.slice(0, limit);
  }

  /**
   * Cleanup old completed/failed jobs
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.CLEANUP_INTERVAL);
    let cleaned = 0;
    
    for (const [id, job] of this.jobs.entries()) {
      if ((job.status === 'complete' || job.status === 'error') && job.updatedAt < cutoff) {
        this.jobs.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old processing jobs`);
    }
  }
}

// Singleton instance
export const processingTracker = new ProcessingTracker();

export default processingTracker;
