/**
 * Cron Service
 * 
 * Manages scheduled tasks within the application
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const TrialCleanupService = require('../../scripts/cleanup-expired-trials');

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all cron jobs
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('CronService already initialized');
      return;
    }

    try {
      logger.info('🕒 Initializing Cron Service...');

      // Setup trial cleanup job - runs daily at 2:00 AM
      this.setupTrialCleanupJob();

      // Setup other scheduled jobs here
      // this.setupOtherJob();

      this.isInitialized = true;
      logger.info('✅ Cron Service initialized successfully');
      
      // Log active jobs
      const activeJobs = Array.from(this.jobs.keys());
      if (activeJobs.length > 0) {
        logger.info(`📋 Active cron jobs: ${activeJobs.join(', ')}`);
      }

    } catch (error) {
      logger.error('❌ Failed to initialize Cron Service:', error);
      throw error;
    }
  }

  /**
   * Setup trial cleanup job
   */
  setupTrialCleanupJob() {
    const jobName = 'trial-cleanup';
    
    // Run daily at 2:00 AM
    // Cron format: second minute hour day month dayOfWeek
    const schedule = '0 2 * * *'; // Every day at 2:00 AM
    
    const job = cron.schedule(schedule, async () => {
      logger.info('🧹 Starting scheduled trial cleanup...');
      
      try {
        const cleanup = new TrialCleanupService();
        await cleanup.run();
        logger.info('✅ Scheduled trial cleanup completed successfully');
      } catch (error) {
        logger.error('❌ Scheduled trial cleanup failed:', error);
        // Don't throw - we don't want to crash the server
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    
    // Start the job
    job.start();
    
    logger.info(`📅 Trial cleanup job scheduled: ${schedule} (${process.env.TIMEZONE || 'UTC'})`);
    
    // Log next execution time
    const nextExecution = this.getNextExecutionTime(schedule);
    if (nextExecution) {
      logger.info(`⏰ Next trial cleanup: ${nextExecution.toISOString()}`);
    }
  }

  /**
   * Setup other scheduled jobs (example)
   */
  setupOtherJob() {
    // Example: Database backup job
    const jobName = 'database-backup';
    const schedule = '0 1 * * 0'; // Every Sunday at 1:00 AM
    
    const job = cron.schedule(schedule, async () => {
      logger.info('💾 Starting scheduled database backup...');
      
      try {
        // Add your backup logic here
        logger.info('✅ Scheduled database backup completed');
      } catch (error) {
        logger.error('❌ Scheduled database backup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    logger.info(`📅 Database backup job scheduled: ${schedule}`);
  }

  /**
   * Get next execution time for a cron schedule
   */
  getNextExecutionTime(schedule) {
    try {
      // Simple calculation for daily 2:00 AM job
      const now = new Date();
      const next = new Date();
      next.setHours(2, 0, 0, 0);
      
      // If 2:00 AM today has passed, schedule for tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next;
    } catch (error) {
      return null;
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      logger.info(`⏹️  Stopped cron job: ${jobName}`);
    }
  }

  /**
   * Start a specific job
   */
  startJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      logger.info(`▶️  Started cron job: ${jobName}`);
    }
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    for (const [jobName, job] of this.jobs) {
      job.stop();
      logger.info(`⏹️  Stopped cron job: ${jobName}`);
    }
    logger.info('⏹️  All cron jobs stopped');
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const status = {};
    for (const [jobName, job] of this.jobs) {
      status[jobName] = {
        running: job.running || false,
        scheduled: job.scheduled || false
      };
    }
    return status;
  }

  /**
   * Manually trigger trial cleanup (for testing)
   */
  async triggerTrialCleanup(dryRun = true) {
    logger.info(`🧪 Manually triggering trial cleanup (dry run: ${dryRun})...`);
    
    try {
      // Temporarily set dry run mode
      const originalDryRun = process.env.CLEANUP_DRY_RUN;
      process.env.CLEANUP_DRY_RUN = dryRun.toString();
      
      const cleanup = new TrialCleanupService();
      await cleanup.run();
      
      // Restore original setting
      if (originalDryRun !== undefined) {
        process.env.CLEANUP_DRY_RUN = originalDryRun;
      } else {
        delete process.env.CLEANUP_DRY_RUN;
      }
      
      logger.info('✅ Manual trial cleanup completed');
      return { success: true, message: 'Trial cleanup completed successfully' };
    } catch (error) {
      logger.error('❌ Manual trial cleanup failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
const cronService = new CronService();
module.exports = cronService;