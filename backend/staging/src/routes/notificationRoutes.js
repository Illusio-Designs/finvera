const { Router } = require('express');
const notificationController = require('../controllers/notificationController');
const notificationPreferenceController = require('../controllers/notificationPreferenceController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Notification routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Notification preferences routes
router.get('/preferences', notificationPreferenceController.getPreferences);
router.put('/preferences', notificationPreferenceController.updatePreferences);

module.exports = router;
