import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SyncStatus } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  getSyncStatus,
  subscribeToSyncStatus,
  setSimulatedOffline,
  pushPendingQueueToDatabase,
  getPendingAppointments,
  getPendingMessages
} from '../services/syncService';

interface SyncStatusBarProps {
  onNotifyToast?: (msg: string) => void;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ onNotifyToast }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  const totalPending = syncStatus.pendingAppointmentsCount + syncStatus.pendingMessagesCount;

  const handleManualSync = async () => {
    if (!syncStatus.isOnline) {
      triggerHaptic('warning');
      onNotifyToast?.('App is offline. Reconnect or disable offline simulation to sync with database.');
      return;
    }
    triggerHaptic('medium');
    const result = await pushPendingQueueToDatabase();
    if (result.success) {
      triggerHaptic('success');
      if (result.syncedAppointments > 0 || result.syncedMessages > 0) {
        onNotifyToast?.(`🟢 ${result.message}`);
      } else {
        onNotifyToast?.('Database is already up to date!');
      }
    } else {
      triggerHaptic('error');
      onNotifyToast?.(`⚠️ ${result.message}`);
    }
  };

  const toggleOfflineSimulation = () => {
    triggerHaptic('medium');
    const nextState = !syncStatus.isSimulatedOffline;
    setSimulatedOffline(nextState);
    if (nextState) {
      onNotifyToast?.('📴 Offline Mode Simulated. Any new appointments or chat messages will be queued locally.');
    } else {
      onNotifyToast?.('🟢 Reconnected to Online. Background sync is pushing queued records to database...');
    }
  };

  const pendingApts = getPendingAppointments();
  const pendingMsgs = getPendingMessages();

  return (
    <div className="w-full max-w-full liquid-glass border-b border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 transition-all text-xs overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 w-full">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Compact Status Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold border transition-colors shrink-0 ${
                !syncStatus.isOnline
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
                  : syncStatus.isSyncing
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}
            >
              {!syncStatus.isOnline ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{syncStatus.isSimulatedOffline ? 'Offline (Sim)' : 'Offline'}</span>
                </>
              ) : syncStatus.isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Online</span>
                </>
              )}
            </div>

            {/* Pending items badge */}
            {totalPending > 0 ? (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-600 text-white flex items-center gap-1 shadow-xs shrink-0">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>
                  {totalPending} <span className="hidden xs:inline">Queued</span>
                </span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>Synced</span>
              </span>
            )}

            {/* Service Worker Indicator (Desktop only) */}
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <Database className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              <span>SW: {syncStatus.serviceWorkerActive ? 'Active' : 'Standby'}</span>
            </span>
          </div>

          {/* Right: Controls & Simulation Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sync Now Button */}
            <button
              onClick={handleManualSync}
              disabled={syncStatus.isSyncing || !syncStatus.isOnline}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                syncStatus.isSyncing || !syncStatus.isOnline
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
              title="Force push cached pending queue to server database"
            >
              <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncStatus.isSyncing ? 'Pushing...' : 'Sync'}</span>
            </button>

            {/* Simulate Offline Button */}
            <button
              onClick={toggleOfflineSimulation}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                syncStatus.isSimulatedOffline
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={
                syncStatus.isSimulatedOffline
                  ? 'Click to restore online connection and push pending data'
                  : 'Simulate network cut-off to test offline queueing and background sync'
              }
            >
              {syncStatus.isSimulatedOffline ? (
                <>
                  <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">Restore</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">Simulate</span>
                </>
              )}
            </button>

            {/* Expand Details Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              title="View queue details"
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Queue Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
            {/* Pending Appointments */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pending Offline Appointments ({pendingApts.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Pushes on reconnect</span>
              </div>

              {pendingApts.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No appointments waiting in offline queue.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {pendingApts.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{apt.doctor_name}</div>
                        <div className="text-slate-400 text-[10px]">
                          {apt.date} • {apt.time} ({apt.type})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Queued
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Hospital Messages */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pending Offline Messages ({pendingMsgs.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Pushes on reconnect</span>
              </div>

              {pendingMsgs.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No messages waiting in offline queue.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {pendingMsgs.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between"
                    >
                      <div className="truncate max-w-[200px]">
                        <div className="font-bold text-white truncate">{msg.text}</div>
                        <div className="text-slate-400 text-[10px]">
                          To: {msg.hospital_name || 'Hospital'} • {msg.time}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                        Queued
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
