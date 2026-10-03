import { ActivityLog } from '../types';

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act_001',
    timestamp: '2026-09-27 10:14 AM',
    actorType: 'patient',
    actorName: 'Nepal Parajuli',
    action: 'Booked Video Consultation',
    category: 'appointment',
    details: 'Scheduled with Dr. Bhagwan Koirala for routine cardiac SpO2 checkup.',
    status: 'completed'
  },
  {
    id: 'act_002',
    timestamp: '2026-09-27 09:30 AM',
    actorType: 'doctor',
    actorName: 'Dr. Bhagwan Koirala',
    action: 'OPD Schedule Updated',
    category: 'status',
    details: 'Set availability to Online for Shahid Gangalal teleconsultation queue.',
    status: 'completed'
  },
  {
    id: 'act_003',
    timestamp: '2026-09-26 04:45 PM',
    actorType: 'patient',
    actorName: 'Nepal Parajuli',
    action: 'Vitals Logged to Personal Vault',
    category: 'vitals',
    details: 'Logged baseline vitals: BP 120/80 mmHg, SpO2 99%, Pulse 74 bpm.',
    status: 'completed'
  },
  {
    id: 'act_004',
    timestamp: '2026-09-26 02:15 PM',
    actorType: 'doctor',
    actorName: 'Dr. Om Murti Anil',
    action: 'Issued Digital Rx #RX-001',
    category: 'prescription',
    details: 'Prescribed Cap. Vitamin C + Zinc with high-altitude lifestyle advice.',
    status: 'completed'
  },
  {
    id: 'act_005',
    timestamp: '2026-09-26 11:20 AM',
    actorType: 'admin',
    actorName: 'System Administrator',
    action: 'Security & Access Verified',
    category: 'security',
    details: 'Verified NMC license records and set system recovery contact to nepal.parajuli.77@gmail.com.',
    status: 'completed',
    targetEmail: 'nepal.parajuli.77@gmail.com'
  }
];

export const getActivityLogs = (): ActivityLog[] => {
  try {
    const saved = localStorage.getItem('xenon_dynamic_activity_logs');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_ACTIVITY_LOGS;
};

export const saveActivityLogs = (logs: ActivityLog[]): void => {
  try {
    localStorage.setItem('xenon_dynamic_activity_logs', JSON.stringify(logs));
  } catch (e) {
    console.warn(e);
  }
};

export const addActivityLog = (
  log: Omit<ActivityLog, 'id' | 'timestamp'>
): ActivityLog => {
  const currentLogs = getActivityLogs();
  const now = new Date();
  const formattedTime = now.toLocaleDateString('en-CA') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const newLog: ActivityLog = {
    ...log,
    id: `act_${Date.now()}`,
    timestamp: formattedTime
  };

  const updated = [newLog, ...currentLogs];
  saveActivityLogs(updated);
  return newLog;
};
