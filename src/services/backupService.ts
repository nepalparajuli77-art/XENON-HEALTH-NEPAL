import { triggerHaptic } from '../utils/haptics';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  actionType: string;
  summary: string;
  data: Record<string, string | null>;
}

const BACKUP_HISTORY_KEY = 'xenon_auto_backups_history';
const MAX_BACKUPS = 15;

/**
 * Capture a complete snapshot of all Xenon Telemedicine keys in localStorage
 */
export const captureBackupSnapshot = (actionType: string, summary: string): BackupSnapshot | null => {
  try {
    const keysToBackup = [
      'xenon_users',
      'telemed_users',
      'telemed_doctors',
      'telemed_appointments',
      'telemed_prescriptions',
      'xenon_custom_lab_reports',
      'telemed_privacy_pin',
      'telemed_privacy_lock_enabled',
      'xenon_dynamic_activity_logs'
    ];

    // Also dynamic user-specific keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('telemed_vitals_logs_') ||
        key.startsWith('telemed_vitals_checklist_') ||
        key.startsWith('xenon_health_vault_') ||
        key.startsWith('telemed_doses_')
      )) {
        if (!keysToBackup.includes(key)) {
          keysToBackup.push(key);
        }
      }
    }

    const dataSnapshot: Record<string, string | null> = {};
    keysToBackup.forEach(key => {
      dataSnapshot[key] = localStorage.getItem(key);
    });

    const newBackup: BackupSnapshot = {
      id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actionType,
      summary,
      data: dataSnapshot
    };

    // Store in history
    let history: BackupSnapshot[] = [];
    try {
      const savedHistory = localStorage.getItem(BACKUP_HISTORY_KEY);
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
    } catch (e) {
      console.warn('Failed to parse backup history', e);
    }

    // Keep history clean and prepend latest
    history.unshift(newBackup);
    if (history.length > MAX_BACKUPS) {
      history = history.slice(0, MAX_BACKUPS);
    }

    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
    console.log(`[BackupService] Auto-backup completed for action: ${actionType}`);
    return newBackup;
  } catch (e) {
    console.error('Failed to create auto-backup', e);
    return null;
  }
};

/**
 * Retrieve all local backups
 */
export const getBackupHistory = (): BackupSnapshot[] => {
  try {
    const saved = localStorage.getItem(BACKUP_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Restore state from a specific backup snapshot
 */
export const restoreFromSnapshot = (snapshot: BackupSnapshot): boolean => {
  try {
    triggerHaptic('medium');
    Object.entries(snapshot.data).forEach(([key, val]) => {
      if (val === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, val);
      }
    });
    triggerHaptic('success');
    return true;
  } catch (e) {
    console.error('Restore failed', e);
    triggerHaptic('warning');
    return false;
  }
};

/**
 * Delete a specific backup
 */
export const deleteBackupFromHistory = (backupId: string): BackupSnapshot[] => {
  try {
    const history = getBackupHistory();
    const updated = history.filter(b => b.id !== backupId);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

/**
 * Export history as file
 */
export const downloadBackupAsFile = (snapshot: BackupSnapshot) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const dateFormatted = new Date(snapshot.timestamp).toISOString().replace(/[:.]/g, '-');
  downloadAnchor.setAttribute("download", `xenon_backup_${snapshot.actionType.replace(/\s+/g, '_')}_${dateFormatted}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
