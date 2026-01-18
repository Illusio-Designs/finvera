/**
 * Cron Routes
 * 
 * Routes for managing scheduled tasks
 */

const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');
const { authenticate } = require('../middleware/auth');

// All cron routes require authentication
router.use(authenticate);

// Get cron job status
router.get('/status', cronController.getStatus);

// Manually trigger trial cleanup
router.post('/trigger-trial-cleanup', cronController.triggerTrialCleanup);

// Stop a specific job
router.post('/jobs/:jobName/stop', cronController.stopJob);

// Start a specific job
router.post('/jobs/:jobName/start', cronController.startJob);

module.exports = router;