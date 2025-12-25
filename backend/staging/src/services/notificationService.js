const { Notification, User, NotificationPreference } = require('../models');
const constants = require('../config/constants');
const logger = require('../utils/logger');
const { sendNotificationEmail } = require('./emailService');
const { sendNotificationToUser } = require('../websocket/socketServer');

/**
 * Create a notification
 * @param {Object} options
 * @param {string} options.userId - User ID to notify
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.priority - Priority level (critical, high, medium, low)
 * @param {string} options.actionUrl - URL to navigate when clicked
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<Notification>}
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  priority = 'medium',
  actionUrl = null,
  metadata = {},
  skipPreferences = false, // For system-critical notifications
}) {
  try {
    // Create notification record
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      priority,
      action_url: actionUrl,
      metadata,
      sent_at: new Date(),
    });

    logger.info(`Notification created: ${type} for user ${userId}`);

    // Get user preferences (if not skipping)
    let preferences = null;
    if (!skipPreferences) {
      try {
        preferences = await NotificationPreference.findOne({
          where: { user_id: userId },
        });
      } catch (error) {
        logger.warn('Could not fetch notification preferences, using defaults');
      }
    }

    // Check if in-app notifications are enabled
    const inAppEnabled = skipPreferences || !preferences || preferences.in_app_enabled !== false;
    const typePrefs = preferences?.type_preferences || {};
    const typeInApp = typePrefs[type]?.in_app !== false;

    // Send via WebSocket if enabled
    if (inAppEnabled && typeInApp) {
      try {
        sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          action_url: notification.action_url,
          metadata: notification.metadata,
          created_at: notification.createdAt,
        });
      } catch (error) {
        logger.error('Error sending notification via WebSocket:', error);
      }
    }

    // Send email if enabled
    const emailEnabled = skipPreferences || !preferences || preferences.email_enabled !== false;
    const typeEmail = typePrefs[type]?.email !== false;

    if (emailEnabled && typeEmail) {
      try {
        const user = await User.findByPk(userId);
        if (user && user.email) {
          const emailSent = await sendNotificationEmail(notification, user);
          if (emailSent) {
            await notification.update({ sent_email: true });
          }
        }
      } catch (error) {
        logger.error('Error sending notification email:', error);
      }
    }

    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
async function createBulkNotifications(notifications) {
  try {
    const created = await Notification.bulkCreate(notifications);
    logger.info(`Created ${created.length} notifications`);
    return created;
  } catch (error) {
    logger.error('Error creating bulk notifications:', error);
    throw error;
  }
}

/**
 * Notify users by role
 * @param {string|Array} roles - Role(s) to notify
 * @param {Object} notificationData - Notification data
 */
async function notifyByRole(roles, notificationData) {
  try {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const users = await User.findAll({
      where: {
        role: roleArray,
        is_active: true,
      },
      attributes: ['id'],
    });

    if (users.length === 0) {
      logger.warn(`No users found with roles: ${roleArray.join(', ')}`);
      return [];
    }

    const notifications = users.map(user => ({
      user_id: user.id,
      ...notificationData,
      sent_at: new Date(),
    }));

    return await createBulkNotifications(notifications);
  } catch (error) {
    logger.error('Error notifying by role:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.update({
      is_read: true,
      read_at: new Date(),
    });

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
  try {
    await Notification.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 */
async function getUnreadCount(userId) {
  try {
    return await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    return 0;
  }
}

// Predefined notification creators for common events
const notificationCreators = {
  targetCreated: async (userId, targetData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TARGET_CREATED,
      title: 'New Target Assigned',
      message: `A new target has been assigned to you: ${targetData.target_type} - ₹${targetData.target_value}`,
      priority: 'high',
      actionUrl: '/admin/targets',
      metadata: { target_id: targetData.id },
    });
  },

  targetAchieved: async (userId, targetData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TARGET_ACHIEVED,
      title: 'Target Achieved! 🎉',
      message: `Congratulations! You have achieved your target: ${targetData.target_type} - ₹${targetData.achieved_value} / ₹${targetData.target_value}`,
      priority: 'high',
      actionUrl: '/admin/targets',
      metadata: { target_id: targetData.id },
    });
  },

  targetPending: async (userId, targetData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TARGET_PENDING,
      title: 'Target Deadline Approaching',
      message: `Your target deadline is approaching: ${targetData.target_type} - ${targetData.daysLeft} days remaining`,
      priority: 'high',
      actionUrl: '/admin/targets',
      metadata: { target_id: targetData.id },
    });
  },

  commissionCreated: async (userId, commissionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.COMMISSION_CREATED,
      title: 'New Commission Generated',
      message: `A new commission of ₹${commissionData.amount} has been generated for you`,
      priority: 'medium',
      actionUrl: '/admin/commissions',
      metadata: { commission_id: commissionData.id },
    });
  },

  commissionApproved: async (userId, commissionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.COMMISSION_APPROVED,
      title: 'Commission Approved',
      message: `Your commission of ₹${commissionData.amount} has been approved`,
      priority: 'high',
      actionUrl: '/admin/commissions',
      metadata: { commission_id: commissionData.id },
    });
  },

  payoutCompleted: async (userId, payoutData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PAYOUT_COMPLETED,
      title: 'Payout Completed',
      message: `Your payout of ₹${payoutData.total_amount} has been completed`,
      priority: 'high',
      actionUrl: '/admin/payouts',
      metadata: { payout_id: payoutData.id },
    });
  },

  newTenantCreated: async (userId, tenantData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.NEW_TENANT_CREATED,
      title: 'New Tenant Created',
      message: `A new tenant "${tenantData.company_name}" has been created`,
      priority: 'medium',
      actionUrl: '/admin/tenants',
      metadata: { tenant_id: tenantData.id },
    });
  },

  // User & Account Notifications
  newUserAdded: async (userId, userData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.NEW_USER_ADDED,
      title: 'New User Added',
      message: `A new user "${userData.name || userData.email}" has been added to the system`,
      priority: 'medium',
      actionUrl: '/admin/users',
      metadata: { user_id: userData.id },
    });
  },

  userProfileUpdated: async (userId, userData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.USER_PROFILE_UPDATED,
      title: 'Profile Updated',
      message: 'Your profile information has been updated successfully',
      priority: 'low',
      actionUrl: '/admin/profile',
      metadata: { user_id: userData.id },
    });
  },

  passwordChanged: async (userId) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PASSWORD_CHANGED,
      title: 'Password Changed',
      message: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
      priority: 'critical',
      actionUrl: '/admin/profile',
      metadata: {},
    });
  },

  accountActivated: async (userId) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.ACCOUNT_ACTIVATED,
      title: 'Account Activated',
      message: 'Your account has been activated. You can now access all features.',
      priority: 'high',
      actionUrl: '/admin/dashboard',
      metadata: {},
    });
  },

  accountDeactivated: async (userId) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.ACCOUNT_DEACTIVATED,
      title: 'Account Deactivated',
      message: 'Your account has been deactivated. Please contact support for assistance.',
      priority: 'critical',
      actionUrl: '/admin/profile',
      metadata: {},
    });
  },

  loginAlert: async (userId, loginData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.LOGIN_ALERT,
      title: 'Unusual Login Activity',
      message: `A login was detected from ${loginData.location || 'unknown location'} at ${loginData.time || new Date().toLocaleString()}. If this wasn't you, please secure your account immediately.`,
      priority: 'critical',
      actionUrl: '/admin/profile',
      metadata: { ip: loginData.ip, location: loginData.location },
    });
  },

  // Target & Performance Notifications (additional)
  targetExceeded: async (userId, targetData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TARGET_EXCEEDED,
      title: 'Target Exceeded! 🚀',
      message: `Congratulations! You have exceeded your target: ${targetData.target_type} - ₹${targetData.achieved_value} / ₹${targetData.target_value} (${targetData.percentage}%)`,
      priority: 'high',
      actionUrl: '/admin/targets',
      metadata: { target_id: targetData.id },
    });
  },

  targetBehind: async (userId, targetData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TARGET_BEHIND,
      title: 'Target Progress Alert',
      message: `You are behind on your target: ${targetData.target_type} - Current: ${targetData.achieved_value} / Target: ${targetData.target_value} (${targetData.percentage}%). Time elapsed: ${targetData.timeElapsed}%`,
      priority: 'high',
      actionUrl: '/admin/targets',
      metadata: { target_id: targetData.id },
    });
  },

  targetDeadlineWarning: async (userId, targetData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TARGET_DEADLINE_WARNING,
      title: 'Target Deadline Warning',
      message: `Your target deadline is within 3 days: ${targetData.target_type} - ${targetData.daysLeft} days remaining`,
      priority: 'critical',
      actionUrl: '/admin/targets',
      metadata: { target_id: targetData.id },
    });
  },

  targetExpired: async (userId, targetData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TARGET_EXPIRED,
      title: 'Target Expired',
      message: `Your target deadline has passed: ${targetData.target_type} - Final: ₹${targetData.achieved_value} / Target: ₹${targetData.target_value}`,
      priority: 'high',
      actionUrl: '/admin/targets',
      metadata: { target_id: targetData.id },
    });
  },

  // Commission & Payout Notifications (additional)
  commissionPaid: async (userId, commissionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.COMMISSION_PAID,
      title: 'Commission Paid',
      message: `Your commission of ₹${commissionData.amount} has been paid out`,
      priority: 'high',
      actionUrl: '/admin/commissions',
      metadata: { commission_id: commissionData.id },
    });
  },

  commissionRejected: async (userId, commissionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.COMMISSION_REJECTED,
      title: 'Commission Rejected',
      message: `Your commission of ₹${commissionData.amount} has been rejected. Reason: ${commissionData.reason || 'Not specified'}`,
      priority: 'high',
      actionUrl: '/admin/commissions',
      metadata: { commission_id: commissionData.id },
    });
  },

  highCommissionAlert: async (userId, commissionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.HIGH_COMMISSION_ALERT,
      title: 'High Commission Alert',
      message: `A high-value commission of ₹${commissionData.amount} has been generated. This exceeds the threshold of ₹${commissionData.threshold}`,
      priority: 'high',
      actionUrl: '/admin/commissions',
      metadata: { commission_id: commissionData.id },
    });
  },

  payoutGenerated: async (userId, payoutData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PAYOUT_GENERATED,
      title: 'Payout Generated',
      message: `A new payout of ₹${payoutData.total_amount} has been generated for you`,
      priority: 'medium',
      actionUrl: '/admin/payouts',
      metadata: { payout_id: payoutData.id },
    });
  },

  payoutProcessing: async (userId, payoutData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PAYOUT_PROCESSING,
      title: 'Payout Processing',
      message: `Your payout of ₹${payoutData.total_amount} is being processed`,
      priority: 'medium',
      actionUrl: '/admin/payouts',
      metadata: { payout_id: payoutData.id },
    });
  },

  payoutFailed: async (userId, payoutData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PAYOUT_FAILED,
      title: 'Payout Failed',
      message: `Your payout of ₹${payoutData.total_amount} has failed. Reason: ${payoutData.reason || 'Unknown error'}. Please contact support.`,
      priority: 'critical',
      actionUrl: '/admin/payouts',
      metadata: { payout_id: payoutData.id },
    });
  },

  // Tenant & Subscription Notifications
  subscriptionActivated: async (userId, subscriptionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
      title: 'Subscription Activated',
      message: `Your subscription to "${subscriptionData.plan_name}" has been activated`,
      priority: 'high',
      actionUrl: '/admin/subscription',
      metadata: { subscription_id: subscriptionData.id },
    });
  },

  subscriptionRenewalDue: async (userId, subscriptionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_DUE,
      title: 'Subscription Renewal Due',
      message: `Your subscription will expire in ${subscriptionData.daysLeft} days. Please renew to continue using the service.`,
      priority: 'high',
      actionUrl: '/admin/subscription',
      metadata: { subscription_id: subscriptionData.id },
    });
  },

  subscriptionExpired: async (userId, subscriptionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED,
      title: 'Subscription Expired',
      message: `Your subscription has expired. Please renew to continue using the service.`,
      priority: 'critical',
      actionUrl: '/admin/subscription',
      metadata: { subscription_id: subscriptionData.id },
    });
  },

  subscriptionUpgraded: async (userId, subscriptionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED,
      title: 'Subscription Upgraded',
      message: `Your subscription has been upgraded to "${subscriptionData.new_plan_name}"`,
      priority: 'medium',
      actionUrl: '/admin/subscription',
      metadata: { subscription_id: subscriptionData.id },
    });
  },

  subscriptionDowngraded: async (userId, subscriptionData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED,
      title: 'Subscription Downgraded',
      message: `Your subscription has been downgraded to "${subscriptionData.new_plan_name}"`,
      priority: 'medium',
      actionUrl: '/admin/subscription',
      metadata: { subscription_id: subscriptionData.id },
    });
  },

  paymentReceived: async (userId, paymentData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `Payment of ₹${paymentData.amount} has been received successfully`,
      priority: 'high',
      actionUrl: '/admin/payments',
      metadata: { payment_id: paymentData.id },
    });
  },

  paymentFailed: async (userId, paymentData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PAYMENT_FAILED,
      title: 'Payment Failed',
      message: `Payment of ₹${paymentData.amount} has failed. Reason: ${paymentData.reason || 'Unknown error'}. Please try again or contact support.`,
      priority: 'critical',
      actionUrl: '/admin/payments',
      metadata: { payment_id: paymentData.id },
    });
  },

  // Referral Notifications
  referralCodeUsed: async (userId, referralData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.REFERRAL_CODE_USED,
      title: 'Referral Code Used',
      message: `Your referral code has been used by ${referralData.referred_user_name || 'a new user'}`,
      priority: 'medium',
      actionUrl: '/admin/referrals',
      metadata: { referral_id: referralData.id },
    });
  },

  referralRewardEarned: async (userId, rewardData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.REFERRAL_REWARD_EARNED,
      title: 'Referral Reward Earned',
      message: `You have earned a referral reward of ₹${rewardData.amount}`,
      priority: 'medium',
      actionUrl: '/admin/referrals',
      metadata: { reward_id: rewardData.id },
    });
  },

  referralRewardApproved: async (userId, rewardData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.REFERRAL_REWARD_APPROVED,
      title: 'Referral Reward Approved',
      message: `Your referral reward of ₹${rewardData.amount} has been approved`,
      priority: 'high',
      actionUrl: '/admin/referrals',
      metadata: { reward_id: rewardData.id },
    });
  },

  referralRewardPaid: async (userId, rewardData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.REFERRAL_REWARD_PAID,
      title: 'Referral Reward Paid',
      message: `Your referral reward of ₹${rewardData.amount} has been paid out`,
      priority: 'high',
      actionUrl: '/admin/referrals',
      metadata: { reward_id: rewardData.id },
    });
  },

  // Support & Ticket Notifications
  newSupportTicket: async (userId, ticketData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.NEW_SUPPORT_TICKET,
      title: 'New Support Ticket',
      message: `A new support ticket "${ticketData.subject}" has been created`,
      priority: 'medium',
      actionUrl: `/admin/support/tickets/${ticketData.id}`,
      metadata: { ticket_id: ticketData.id },
    });
  },

  ticketAssigned: async (userId, ticketData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TICKET_ASSIGNED,
      title: 'Ticket Assigned',
      message: `Support ticket "${ticketData.subject}" has been assigned to you`,
      priority: 'high',
      actionUrl: `/admin/support/tickets/${ticketData.id}`,
      metadata: { ticket_id: ticketData.id },
    });
  },

  ticketStatusChanged: async (userId, ticketData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TICKET_STATUS_CHANGED,
      title: 'Ticket Status Updated',
      message: `Support ticket "${ticketData.subject}" status has been changed to ${ticketData.status}`,
      priority: 'medium',
      actionUrl: `/admin/support/tickets/${ticketData.id}`,
      metadata: { ticket_id: ticketData.id },
    });
  },

  newTicketMessage: async (userId, ticketData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.NEW_TICKET_MESSAGE,
      title: 'New Message on Ticket',
      message: `A new message has been added to ticket "${ticketData.subject}"`,
      priority: 'medium',
      actionUrl: `/admin/support/tickets/${ticketData.id}`,
      metadata: { ticket_id: ticketData.id },
    });
  },

  ticketResolved: async (userId, ticketData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TICKET_RESOLVED,
      title: 'Ticket Resolved',
      message: `Support ticket "${ticketData.subject}" has been marked as resolved`,
      priority: 'medium',
      actionUrl: `/admin/support/tickets/${ticketData.id}`,
      metadata: { ticket_id: ticketData.id },
    });
  },

  ticketClosed: async (userId, ticketData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TICKET_CLOSED,
      title: 'Ticket Closed',
      message: `Support ticket "${ticketData.subject}" has been closed`,
      priority: 'low',
      actionUrl: `/admin/support/tickets/${ticketData.id}`,
      metadata: { ticket_id: ticketData.id },
    });
  },

  // System & Admin Notifications
  systemMaintenance: async (userId, maintenanceData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
      title: 'System Maintenance Scheduled',
      message: `System maintenance is scheduled for ${maintenanceData.scheduled_time || 'soon'}. ${maintenanceData.duration || 'The system may be unavailable during this time.'}`,
      priority: 'high',
      actionUrl: '/admin/dashboard',
      metadata: { maintenance_id: maintenanceData.id },
    });
  },

  systemUpdate: async (userId, updateData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.SYSTEM_UPDATE,
      title: 'System Update',
      message: `A new system update is available: ${updateData.update_message || 'New features and improvements have been added.'}`,
      priority: 'low',
      actionUrl: '/admin/dashboard',
      metadata: { update_id: updateData.id },
    });
  },

  configurationChanged: async (userId, configData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.CONFIGURATION_CHANGED,
      title: 'Configuration Changed',
      message: `Important system configuration has been changed: ${configData.config_name || 'Settings updated'}`,
      priority: 'high',
      actionUrl: '/admin/settings',
      metadata: { config_id: configData.id },
    });
  },

  backupCompleted: async (userId, backupData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.BACKUP_COMPLETED,
      title: 'Backup Completed',
      message: `System backup has been completed successfully at ${backupData.backup_time || new Date().toLocaleString()}`,
      priority: 'low',
      actionUrl: '/admin/settings',
      metadata: { backup_id: backupData.id },
    });
  },

  errorAlert: async (userId, errorData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.ERROR_ALERT,
      title: 'System Error Alert',
      message: `A critical system error has been detected: ${errorData.error_message || 'Please contact support immediately.'}`,
      priority: 'critical',
      actionUrl: '/admin/dashboard',
      metadata: { error_id: errorData.id },
    });
  },

  // Distributor/Salesman Specific Notifications
  newLeadAssigned: async (userId, leadData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.NEW_LEAD_ASSIGNED,
      title: 'New Lead Assigned',
      message: `A new lead "${leadData.company_name || leadData.name}" has been assigned to you`,
      priority: 'high',
      actionUrl: `/admin/leads/${leadData.id}`,
      metadata: { lead_id: leadData.id },
    });
  },

  leadStatusChanged: async (userId, leadData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.LEAD_STATUS_CHANGED,
      title: 'Lead Status Updated',
      message: `Lead "${leadData.company_name || leadData.name}" status has been changed to ${leadData.status}`,
      priority: 'medium',
      actionUrl: `/admin/leads/${leadData.id}`,
      metadata: { lead_id: leadData.id },
    });
  },

  leadConverted: async (userId, leadData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.LEAD_CONVERTED,
      title: 'Lead Converted! 🎉',
      message: `Lead "${leadData.company_name || leadData.name}" has been successfully converted to a tenant`,
      priority: 'high',
      actionUrl: `/admin/leads/${leadData.id}`,
      metadata: { lead_id: leadData.id, tenant_id: leadData.tenant_id },
    });
  },

  performanceMilestone: async (userId, milestoneData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.PERFORMANCE_MILESTONE,
      title: 'Performance Milestone Achieved! 🏆',
      message: `Congratulations! You have reached a performance milestone: ${milestoneData.milestone_name || 'Great achievement!'}`,
      priority: 'high',
      actionUrl: '/admin/dashboard',
      metadata: { milestone_id: milestoneData.id },
    });
  },

  territoryUpdated: async (userId, territoryData) => {
    return createNotification({
      userId,
      type: constants.NOTIFICATION_TYPES.TERRITORY_UPDATED,
      title: 'Territory Assignment Updated',
      message: `Your territory assignment has been updated: ${territoryData.territory_name || 'New territory assigned'}`,
      priority: 'medium',
      actionUrl: '/admin/territory',
      metadata: { territory_id: territoryData.id },
    });
  },
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyByRole,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  ...notificationCreators,
};
