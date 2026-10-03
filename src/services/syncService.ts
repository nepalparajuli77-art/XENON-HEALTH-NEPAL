import { Appointment, ChatMessage, SyncStatus } from '../types';
import { addActivityLog } from '../data/activityService';

const PENDING_APPOINTMENTS_KEY = 'telemed_pending_appointments';
const PENDING_MESSAGES_KEY = 'telemed_pending_messages';
const SIMULATED_OFFLINE_KEY = 'telemed_simulated_offline';
const LAST_SYNC_KEY = 'telemed_last_sync_timestamp';

type SyncListener = (status: SyncStatus) => void;
const listeners: Set<SyncListener> = new Set();

let isSyncing = false;
let swRegistration: ServiceWorkerRegistration | null = null;

// Initialize Simulated Offline State from storage
function getSimulatedOffline(): boolean {
  try {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  } catch {
    return false;
  }
}

// Current effective online state (considers real browser online + simulated offline)
export function isAppOnline(): boolean {
  if (getSimulatedOffline()) {
    return false;
  }
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Toggle or set simulated offline mode (useful for testing & user control)
export function setSimulatedOffline(simulated: boolean) {
  try {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, simulated ? 'true' : 'false');
  } catch (e) {
    console.warn(e);
  }
  notifyListeners();

  if (!simulated && navigator.onLine) {
    // When transitioning back to online, automatically push pending data to database
    pushPendingQueueToDatabase();
  }
}

export function getPendingAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(PENDING_APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingAppointments(apts: Appointment[]) {
  try {
    localStorage.setItem(PENDING_APPOINTMENTS_KEY, JSON.stringify(apts));
  } catch (e) {
    console.warn(e);
  }
  notifyListeners();
}

export function queueAppointmentForSync(appointment: Appointment): Appointment {
  const queuedApt: Appointment = {
    ...appointment,
    synced: false,
    queuedAt: new Date().toISOString()
  };

  const pending = getPendingAppointments();
  // Filter out if already in pending
  const updated = [queuedApt, ...pending.filter((a) => a.id !== queuedApt.id)];
  savePendingAppointments(updated);

  addActivityLog({
    actorType: 'patient',
    actorName: queuedApt.patient_name,
    action: 'Appointment Queued Offline',
    category: 'appointment',
    details: `Queued booking with ${queuedApt.doctor_name} (${queuedApt.date}) for background database sync.`,
    status: 'pending'
  });

  // If online right now, attempt immediate push
  if (isAppOnline()) {
    pushPendingQueueToDatabase();
  } else {
    requestServiceWorkerBackgroundSync();
  }

  return queuedApt;
}

export function getPendingMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(PENDING_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.warn(e);
  }
  notifyListeners();
}

export function queueMessageForSync(message: ChatMessage): ChatMessage {
  const queuedMsg: ChatMessage = {
    ...message,
    id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    synced: false,
    queued_at: new Date().toISOString()
  };

  const pending = getPendingMessages();
  const updated = [...pending, queuedMsg];
  savePendingMessages(updated);

  addActivityLog({
    actorType: 'patient',
    actorName: 'Patient Inquirer',
    action: 'Hospital Message Queued',
    category: 'broadcast',
    details: `Hospital chat message to ${queuedMsg.hospital_name || 'Hospital'} cached offline for background sync.`,
    status: 'pending'
  });

  if (isAppOnline()) {
    pushPendingQueueToDatabase();
  } else {
    requestServiceWorkerBackgroundSync();
  }

  return queuedMsg;
}

// Request background sync through the Service Worker API if supported
export async function requestServiceWorkerBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'SyncManager' in window && swRegistration) {
      // @ts-expect-error SyncManager is not in default TS types
      await swRegistration.sync.register('sync-health-data');
      console.log('[SyncService] Background sync registration requested via ServiceWorker');
    }
  } catch (e) {
    console.log('[SyncService] Standard fallback sync will trigger on online event', e);
  }
}

// Main database sync function: Pushes pending queues to /api/sync
export async function pushPendingQueueToDatabase(): Promise<{
  success: boolean;
  syncedAppointments: number;
  syncedMessages: number;
  message: string;
}> {
  if (isSyncing) {
    return { success: false, syncedAppointments: 0, syncedMessages: 0, message: 'Sync already in progress' };
  }

  if (!isAppOnline()) {
    return { success: false, syncedAppointments: 0, syncedMessages: 0, message: 'App is currently offline' };
  }

  const pendingApts = getPendingAppointments();
  const pendingMsgs = getPendingMessages();

  if (pendingApts.length === 0 && pendingMsgs.length === 0) {
    return { success: true, syncedAppointments: 0, syncedMessages: 0, message: 'All records are already synced' };
  }

  isSyncing = true;
  notifyListeners();

  try {
    console.log(`[SyncService] Pushing ${pendingApts.length} appointments and ${pendingMsgs.length} messages to /api/sync...`);

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appointments: pendingApts,
        messages: pendingMsgs
      })
    });

    if (!response.ok) {
      throw new Error(`Sync server responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Mark stored appointments in telemed_appointments as synced
    try {
      const rawStoredApts = localStorage.getItem('telemed_appointments');
      if (rawStoredApts) {
        const storedApts: Appointment[] = JSON.parse(rawStoredApts);
        const pendingIds = new Set(pendingApts.map((a) => a.id));
        const updatedStoredApts = storedApts.map((a) =>
          pendingIds.has(a.id) ? { ...a, synced: true } : a
        );
        localStorage.setItem('telemed_appointments', JSON.stringify(updatedStoredApts));
      }
    } catch (e) {
      console.warn('Failed to update synced flags in telemed_appointments:', e);
    }

    // Clear pending queues
    savePendingAppointments([]);
    savePendingMessages([]);

    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem(LAST_SYNC_KEY, timestamp);
    } catch (e) {
      console.warn(e);
    }

    // Record completed sync in system activity
    addActivityLog({
      actorType: 'admin',
      actorName: 'Background Sync Worker',
      action: 'Offline-to-Online Database Sync',
      category: 'status',
      details: `Successfully pushed ${pendingApts.length} pending appointment(s) and ${pendingMsgs.length} message(s) to server database.`,
      status: 'completed'
    });

    // Dispatch global custom event for components to re-render
    window.dispatchEvent(
      new CustomEvent('xenon_sync_completed', {
        detail: {
          syncedAppointments: pendingApts.length,
          syncedMessages: pendingMsgs.length,
          timestamp
        }
      })
    );

    return {
      success: true,
      syncedAppointments: pendingApts.length,
      syncedMessages: pendingMsgs.length,
      message: `Successfully synchronized ${pendingApts.length} appointment(s) and ${pendingMsgs.length} message(s) to database.`
    };
  } catch (error: any) {
    console.warn('[SyncService] Failed to push offline data to database:', error?.message);
    return {
      success: false,
      syncedAppointments: 0,
      syncedMessages: 0,
      message: error?.message || 'Synchronization failed'
    };
  } finally {
    isSyncing = false;
    notifyListeners();
  }
}

// Get full sync status snapshot
export function getSyncStatus(): SyncStatus {
  let lastSynced: string | null = null;
  try {
    lastSynced = localStorage.getItem(LAST_SYNC_KEY);
  } catch {}

  return {
    isOnline: isAppOnline(),
    isSimulatedOffline: getSimulatedOffline(),
    isSyncing,
    pendingAppointmentsCount: getPendingAppointments().length,
    pendingMessagesCount: getPendingMessages().length,
    lastSyncedAt: lastSynced,
    serviceWorkerActive: !!swRegistration?.active
  };
}

function notifyListeners() {
  const currentStatus = getSyncStatus();
  listeners.forEach((callback) => {
    try {
      callback(currentStatus);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeToSyncStatus(callback: SyncListener): () => void {
  listeners.add(callback);
  callback(getSyncStatus());
  return () => {
    listeners.delete(callback);
  };
}

// Initialize Service Worker and listeners
export function initBackgroundSync(onOnlineSyncToast?: (message: string) => void) {
  // Listen for native online/offline transitions
  window.addEventListener('online', () => {
    console.log('[SyncService] App transitioned to ONLINE mode.');
    notifyListeners();

    if (isAppOnline()) {
      pushPendingQueueToDatabase().then((res) => {
        if (res.success && (res.syncedAppointments > 0 || res.syncedMessages > 0)) {
          if (onOnlineSyncToast) {
            onOnlineSyncToast(`🟢 Reconnected: Pushed ${res.syncedAppointments} appointment(s) & ${res.syncedMessages} message(s) to database.`);
          }
        }
      });
    }
  });

  window.addEventListener('offline', () => {
    console.log('[SyncService] App transitioned to OFFLINE mode.');
    notifyListeners();
  });

  // Register Service Worker in supported browsers
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        swRegistration = reg;
        console.log('[SyncService] Service Worker registered with scope:', reg.scope);
        notifyListeners();

        // Check for updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SyncService] New Service Worker content available; refreshing cache.');
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('[SyncService] Service Worker registration failed (falling back to client sync):', err);
      });

    // Listen to messages from the Service Worker (e.g. BACKGROUND_SYNC_TRIGGERED)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED') {
        console.log('[SyncService] Received BACKGROUND_SYNC_TRIGGERED message from Service Worker.');
        pushPendingQueueToDatabase().then((res) => {
          if (res.success && (res.syncedAppointments > 0 || res.syncedMessages > 0) && onOnlineSyncToast) {
            onOnlineSyncToast(`🟢 Background Sync: Pushed ${res.syncedAppointments} appointment(s) & ${res.syncedMessages} message(s) to database.`);
          }
        });
      }
    });
  }

  // Initial check on load: If online and there are pending items, push them
  if (isAppOnline()) {
    const pendingCount = getPendingAppointments().length + getPendingMessages().length;
    if (pendingCount > 0) {
      setTimeout(() => {
        pushPendingQueueToDatabase().then((res) => {
          if (res.success && (res.syncedAppointments > 0 || res.syncedMessages > 0) && onOnlineSyncToast) {
            onOnlineSyncToast(`🟢 Re-synced ${res.syncedAppointments} appointment(s) and ${res.syncedMessages} message(s) with database.`);
          }
        });
      }, 1000);
    }
  }
}
