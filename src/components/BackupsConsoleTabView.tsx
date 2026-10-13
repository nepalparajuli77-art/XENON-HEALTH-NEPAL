import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  UploadCloud,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  History,
  FileJson,
  Plus,
  RefreshCw,
  Save
} from 'lucide-react';
import {
  getBackupHistory,
  captureBackupSnapshot,
  restoreFromSnapshot,
  deleteBackupFromHistory,
  downloadBackupAsFile,
  BackupSnapshot
} from '../services/backupService';
import { triggerHaptic } from '../utils/haptics';

interface BackupsConsoleTabViewProps {
  showToast: (msg: string) => void;
}

export const BackupsConsoleTabView: React.FC<BackupsConsoleTabViewProps> = ({ showToast }) => {
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [manualBackupTitle, setManualBackupTitle] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setBackups(getBackupHistory());
  }, []);

  const refreshHistory = () => {
    setBackups(getBackupHistory());
  };

  const handleManualBackup = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    const title = manualBackupTitle.trim() || 'Manual System Snapshot';
    const snap = captureBackupSnapshot('Manual Backup', title);
    if (snap) {
      triggerHaptic('success');
      showToast('Custom system backup successfully created.');
      setManualBackupTitle('');
      refreshHistory();
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'restore' | 'delete' | 'import';
    data: any;
    title: string;
    message: string;
  } | null>(null);

  const handleRestore = (snap: BackupSnapshot) => {
    setConfirmDialog({
      type: 'restore',
      data: snap,
      title: 'Confirm Database Rollback',
      message: `Restoring this backup will replace current session records, appointments, and telemetry logs with data from: "${snap.summary}" (${new Date(snap.timestamp).toLocaleString()}).`
    });
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      type: 'delete',
      data: id,
      title: 'Delete Backup Snapshot',
      message: 'Are you sure you want to permanently delete this backup checkpoint from storage history?'
    });
  };

  const executeConfirmedAction = () => {
    if (!confirmDialog) return;
    triggerHaptic('medium');

    if (confirmDialog.type === 'restore') {
      const snap = confirmDialog.data as BackupSnapshot;
      const ok = restoreFromSnapshot(snap);
      if (ok) {
        showToast('Database state successfully restored. Reloading application...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showToast('Failed to restore database state.');
      }
    } else if (confirmDialog.type === 'delete') {
      const id = confirmDialog.data as string;
      const updated = deleteBackupFromHistory(id);
      setBackups(updated);
      showToast('Backup snapshot deleted from local storage history.');
    } else if (confirmDialog.type === 'import') {
      const parsed = confirmDialog.data as BackupSnapshot;
      const ok = restoreFromSnapshot(parsed);
      if (ok) {
        showToast('Database successfully restored from imported file. Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setUploadError('Failed to apply data restore from imported snapshot.');
      }
    }

    setConfirmDialog(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processBackupFile(file);
  };

  const processBackupFile = (file: File) => {
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupSnapshot;

        if (!parsed.id || !parsed.actionType || !parsed.data) {
          throw new Error('Invalid file structure. Make sure this is a valid Xenon Auto-Backup JSON file.');
        }

        setConfirmDialog({
          type: 'import',
          data: parsed,
          title: 'Validated Backup Checkpoint',
          message: `Checkpoint: "${parsed.actionType}" - ${parsed.summary} (${new Date(parsed.timestamp).toLocaleString()}). Restore and sync entire workspace to this checkpoint?`
        });
      } catch (err: any) {
        triggerHaptic('warning');
        setUploadError(err?.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 animate-in fade-in text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Status & Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Stats Panel */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Disaster Recovery Console</h3>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
              The platform secures real-time auto-backups to browser memory whenever any save/change operation is completed in the clinical interface.
            </p>
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-bold">Total Backups Logged:</span>
              <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">{backups.length} / 15</span>
            </div>
          </div>

          {/* Trigger Manual Checkpoint */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Create Manual Checkpoint</span>
            </h4>
            <form onSubmit={handleManualBackup} className="space-y-2">
              <input
                type="text"
                placeholder="e.g. Pre-operation Clinical Sync..."
                value={manualBackupTitle}
                onChange={(e) => setManualBackupTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-[11px]"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-md shadow-amber-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Safe Checkpoint</span>
              </button>
            </form>
          </div>

          {/* Upload JSON Backup Checkpoint */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Import External Checkpoint</span>
            </h4>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:border-blue-500/50 transition-colors relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileJson className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-slate-500 font-bold">Drag or click to upload `.json` backup file</p>
            </div>
            {uploadError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-[10px] flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Auto-Backup Logs History */}
        <div className="lg:col-span-2 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xs min-h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Automated Backup checkpoints history</h3>
              </div>
              <button
                onClick={refreshHistory}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex items-center gap-1"
                title="Refresh history stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Stream</span>
              </button>
            </div>

            {backups.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                <Database className="w-10 h-10 mb-2 opacity-50" />
                <p className="font-bold text-xs text-slate-600 dark:text-slate-400">No automated backups captured yet.</p>
                <p className="text-[10px] max-w-xs mt-1">Make changes or save data inside the medical system to trigger auto-checkpoints.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {backups.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-extrabold text-[9px] uppercase tracking-wider">
                          {snap.actionType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                        </span>
                      </div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {snap.summary}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Checkpoint ID: <span className="font-mono text-[9px]">{snap.id}</span> • Key count: {Object.keys(snap.data).length} active stores
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Download Snapshot file */}
                      <button
                        onClick={() => downloadBackupAsFile(snap)}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1"
                        title="Download JSON checkpoint file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export</span>
                      </button>

                      {/* Restore State */}
                      <button
                        onClick={() => handleRestore(snap)}
                        className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shadow-amber-600/15"
                        title="Rollback system state to this checkpoint"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>

                      {/* Delete check */}
                      <button
                        onClick={() => handleDelete(snap.id)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                        title="Delete checkpoint from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Confirmation Dialog (Replaces window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer ${
                  confirmDialog.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmDialog.type === 'delete' ? 'Delete Snapshot' : 'Confirm & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
