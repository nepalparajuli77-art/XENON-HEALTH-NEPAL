/**
 * Haptic Vibration Feedback Utility for Mobile & Touch Devices
 * Utilizes navigator.vibrate() API safely with fallback checks.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'emergency';

export const triggerHaptic = (type: HapticType = 'light'): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    switch (type) {
      case 'light':
        // Subtle 10ms tap for tab selection, toggles, quick clicks
        return navigator.vibrate(10);

      case 'medium':
        // 25ms standard button feedback
        return navigator.vibrate(25);

      case 'heavy':
        // 45ms firm action feedback
        return navigator.vibrate(45);

      case 'success':
        // Double pulse for completed actions (Book Appointment, Issued Rx, Sync)
        return navigator.vibrate([15, 60, 30]);

      case 'warning':
        // 2 medium buzzes
        return navigator.vibrate([30, 50, 30]);

      case 'error':
        // 3 rapid pulses
        return navigator.vibrate([50, 40, 50, 40, 50]);

      case 'emergency':
        // Urgent distinct SOS sequence
        return navigator.vibrate([120, 60, 120, 60, 240]);

      default:
        return navigator.vibrate(15);
    }
  } catch (err) {
    // Fail silently on devices/browsers that block vibrate
    return false;
  }
};
