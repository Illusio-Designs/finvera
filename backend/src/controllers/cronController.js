/**
 * Cron Controller
 * 
 * API endpoints for managing scheduled tasks
 */

const cronService = require('../services/cronService');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Get status of all cron jobs
   */
  async getStatus(req, res) {
    try {
      const status = cronService.getStatus();
      
      res.json({
        success: true,
        data: {
          jobs: status,
          initialized: cronService.isInitialized,
          timezone: process.env.TIMEZONE || 'UTC'
        }
      });
    } catch (error) {
      logger.error('Error getting cron status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cron job status',
        error: error.message
      });
    }
  },

  /**
   * Manually trigger trial cleanup (for testing)
   */
  async triggerTrialCleanup(req, res) {
    try {
      // Check if user has admin permissions
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin role required.'
        });
      }

      const { dryRun = true } = req.body;
      
      logger.info(`Manual trial cleanup triggered by user ${req.user?.email} (dry run: ${dryRun})`);
      
      const result = await cronService.triggerTrialCleanup(dryRun);
      
      res.json({
        success: result.success,
        message: result.message,
        dryRun: dryRun
      });
    } catch (error) {
      logger.error('Error triggering trial cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger trial cleanup',
        error: error.message
      });
    }
  },

  /**
   * Stop a specific cron job
   */
  async stopJob(req, res) {
    try {
      // Check if user has admin permissions
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin role required.'
        });
      }

      const { jobName } = req.params;
      
      cronService.stopJob(jobName);
      
      logger.info(`Cron job '${jobName}' stopped by user ${req.user?.email}`);
      
      res.json({
        success: true,
        message: `Job '${jobName}' stopped successfully`
      });
    } catch (error) {
      logger.error('Error stopping cron job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop cron job',
        error: error.message
      });
    }
  },

  /**
   * Start a specific cron job
   */
  async startJob(req, res) {
    try {
      // Check if user has admin permissions
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin role required.'
        });
      }

      const { jobName } = req.params;
      
      cronService.startJob(jobName);
      
      logger.info(`Cron job '${jobName}' started by user ${req.user?.email}`);
      
      res.json({
        success: true,
        message: `Job '${jobName}' started successfully`
      });
    } catch (error) {
      logger.error('Error starting cron job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start cron job',
        error: error.message
      });
    }
  }
};