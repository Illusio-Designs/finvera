/**
 * Sound Service
 * Manages unique sounds for different notification types
 */

// Map notification types to sound files
const NOTIFICATION_SOUNDS = {
  // Success sounds
  target_achieved: '/sounds/success-1.mp3',
  target_exceeded: '/sounds/success-2.mp3',
  commission_approved: '/sounds/success-3.mp3',
  commission_paid: '/sounds/money.mp3',
  payout_completed: '/sounds/success-1.mp3',
  account_activated: '/sounds/success-2.mp3',
  subscription_activated: '/sounds/success-3.mp3',
  subscription_upgraded: '/sounds/success-1.mp3',
  payment_received: '/sounds/money.mp3',
  referral_reward_paid: '/sounds/success-2.mp3',
  ticket_resolved: '/sounds/success-3.mp3',
  backup_completed: '/sounds/info.mp3',
  lead_converted: '/sounds/success-1.mp3',
  performance_milestone: '/sounds/achievement.mp3',

  // Error sounds
  commission_rejected: '/sounds/error-1.mp3',
  payout_failed: '/sounds/error-2.mp3',
  account_deactivated: '/sounds/error-1.mp3',
  subscription_expired: '/sounds/warning-1.mp3',
  subscription_downgraded: '/sounds/error-2.mp3',
  payment_failed: '/sounds/error-1.mp3',
  target_expired: '/sounds/error-2.mp3',
  error_alert: '/sounds/alert.mp3',

  // Warning sounds
  target_pending: '/sounds/warning-1.mp3',
  target_behind: '/sounds/warning-2.mp3',
  target_deadline_warning: '/sounds/warning-3.mp3',
  subscription_renewal_due: '/sounds/warning-1.mp3',
  high_commission_alert: '/sounds/info.mp3',
  login_alert: '/sounds/warning-2.mp3',

  // Info sounds
  new_user_added: '/sounds/info.mp3',
  user_profile_updated: '/sounds/info.mp3',
  password_changed: '/sounds/info.mp3',
  target_created: '/sounds/info.mp3',
  commission_created: '/sounds/info.mp3',
  payout_generated: '/sounds/info.mp3',
  payout_processing: '/sounds/info.mp3',
  new_tenant_created: '/sounds/info.mp3',
  referral_code_used: '/sounds/info.mp3',
  referral_reward_earned: '/sounds/info.mp3',
  referral_reward_approved: '/sounds/info.mp3',
  new_support_ticket: '/sounds/notification.mp3',
  ticket_assigned: '/sounds/notification.mp3',
  ticket_status_changed: '/sounds/info.mp3',
  new_ticket_message: '/sounds/notification.mp3',
  ticket_closed: '/sounds/info.mp3',
  system_maintenance: '/sounds/warning-1.mp3',
  system_update: '/sounds/info.mp3',
  configuration_changed: '/sounds/info.mp3',
  new_lead_assigned: '/sounds/notification.mp3',
  lead_status_changed: '/sounds/info.mp3',
  territory_updated: '/sounds/info.mp3',

  // Default fallback
  default: '/sounds/notification.mp3',
};

// Cache audio elements for performance
const audioCache = new Map();

/**
 * Get sound file path for notification type
 */
export function getNotificationSound(notificationType) {
  return NOTIFICATION_SOUNDS[notificationType] || NOTIFICATION_SOUNDS.default;
}

/**
 * Play sound for notification
 * @param {string} notificationType - Type of notification
 * @param {number} volume - Volume level (0-1)
 */
export function playNotificationSound(notificationType, volume = 0.5) {
  try {
    // Check if sounds are enabled in preferences (stored in localStorage)
    const soundsEnabled = localStorage.getItem('notificationSoundsEnabled') !== 'false';
    if (!soundsEnabled) {
      return;
    }

    const soundPath = getNotificationSound(notificationType);

    // Get or create audio element
    let audio = audioCache.get(soundPath);
    if (!audio) {
      audio = new Audio(soundPath);
      audio.volume = volume;
      audioCache.set(soundPath, audio);
    }

    // Reset audio to beginning and play
    audio.currentTime = 0;
    audio.volume = volume;

    // Play sound (handle promise for browser autoplay policies)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Audio played successfully
        })
        .catch((error) => {
          // Auto-play was prevented or audio failed
          console.warn('Could not play notification sound:', error);
        });
    }
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
}

/**
 * Preload sound files for better performance
 */
export function preloadSounds() {
  const uniqueSounds = [...new Set(Object.values(NOTIFICATION_SOUNDS))];
  uniqueSounds.forEach((soundPath) => {
    try {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      audioCache.set(soundPath, audio);
    } catch (error) {
      console.warn(`Failed to preload sound: ${soundPath}`, error);
    }
  });
}

/**
 * Enable/disable notification sounds
 */
export function setSoundsEnabled(enabled) {
  localStorage.setItem('notificationSoundsEnabled', enabled.toString());
}

/**
 * Check if sounds are enabled
 */
export function areSoundsEnabled() {
  return localStorage.getItem('notificationSoundsEnabled') !== 'false';
}
