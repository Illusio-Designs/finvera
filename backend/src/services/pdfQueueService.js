const Bull = require('bull');
const pdfService = require('./pdfService');
const logger = require('../utils/logger');

class PDFQueueService {
  constructor() {
    // Initialize Bull queue with Redis
    this.queue = new Bull('pdf-generation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200 // Keep last 200 failed jobs
      }
    });

    this.setupQueueProcessor();
    this.setupQueueEvents();
  }

  setupQueueProcessor() {
    this.queue.process(async (job) => {
      const { templateName, data, options, userId } = job.data;

      logger.info(`Processing PDF job ${job.id} for user ${userId}`);

      // Update job progress
      await job.progress(25);

      const result = await pdfService.generatePDF(templateName, data, options);

      await job.progress(75);

      // Store metadata if needed
      if (result.success) {
        await this.savePDFMetadata({
          userId,
          filename: result.filename,
          filepath: result.filepath,
          templateName,
          jobId: job.id,
          generatedAt: new Date()
        });
      }

      await job.progress(100);

      return result;
    });
  }

  setupQueueEvents() {
    this.queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:`, err);
    });

    this.queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`);
    });
  }

  async addJob(templateName, data, options = {}, userId = null) {
    try {
      const job = await this.queue.add({
        templateName,
        data,
        options,
        userId,
        requestedAt: new Date()
      });

      logger.info(`PDF generation job ${job.id} queued`);

      return {
        success: true,
        jobId: job.id,
        status: 'queued'
      };
    } catch (error) {
      logger.error('Failed to queue PDF job:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getJobStatus(jobId) {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      const state = await job.getState();
      const progress = job.progress();

      const response = {
        success: true,
        jobId: job.id,
        status: state,
        progress: progress,
        data: job.data
      };

      if (state === 'completed') {
        response.result = job.returnvalue;
      } else if (state === 'failed') {
        response.error = job.failedReason;
      }

      return response;
    } catch (error) {
      logger.error('Failed to get job status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async savePDFMetadata(metadata) {
    // This can be extended to save to database
    // For now, just log it
    logger.info('PDF metadata:', metadata);
    
    // Example: Save to database
    // const PDFDocument = require('../models/PDFDocument');
    // await PDFDocument.create(metadata);
  }

  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
        this.queue.getDelayedCount()
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return null;
    }
  }

  async cleanQueue() {
    try {
      await this.queue.clean(7 * 24 * 60 * 60 * 1000); // Clean jobs older than 7 days
      logger.info('Queue cleaned successfully');
      return { success: true };
    } catch (error) {
      logger.error('Failed to clean queue:', error);
      return { success: false, error: error.message };
    }
  }

  async shutdown() {
    logger.info('Shutting down PDF Queue Service...');
    await this.queue.close();
    logger.info('PDF Queue Service shutdown complete');
  }
}

// Singleton instance
let queueServiceInstance = null;

function getPDFQueueService() {
  if (!queueServiceInstance) {
    queueServiceInstance = new PDFQueueService();
  }
  return queueServiceInstance;
}

module.exports = getPDFQueueService();
