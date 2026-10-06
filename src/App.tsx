/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DoctorDashboardView } from './components/DoctorDashboardView';
import { DoctorDirectoryView } from './components/DoctorDirectoryView';
import { DoctorPortalView } from './components/DoctorPortalView';
import { DeveloperConsoleView } from './components/DeveloperConsoleView';
import { DoctorsView } from './components/DoctorsView';
import { HospitalsView } from './components/HospitalsView';
import { PatientRecordsView } from './components/PatientRecordsView';
import { EmergencyView } from './components/EmergencyView';
import { XenonAiView } from './components/XenonAiView';
import { LocationMedevacView } from './components/LocationMedevacView';
import { LabReportsView } from './components/LabReportsView';
import { OfflineGuideView } from './components/OfflineGuideView';
import { BookModal } from './components/BookModal';
import { ChatModal } from './components/ChatModal';
import { IssueRxModal } from './components/IssueRxModal';
import { VideoRoomModal } from './components/VideoRoomModal';
import { AuthModal } from './components/AuthModal';
import { SyncStatusBar } from './components/SyncStatusBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { initBackgroundSync } from './services/syncService';
import {
  INITIAL_DOCTORS,
  INITIAL_HOSPITALS,
  INITIAL_APPOINTMENTS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_EMERGENCY_CONTACTS,
  INITIAL_USERS,
  INITIAL_LAB_REPORTS
} from './data/mockData';
import { Doctor, Hospital, Appointment, Prescription, Language, User, LabReport } from './types';
import { parseCurrentUrl, syncUrlWithState } from './utils/urlRouting';

// Auto-complete appointments whose date has passed
function syncAppointmentStatuses(apts: Appointment[]): Appointment[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return apts.map((apt) => {
    if (apt.status === 'Cancelled' || apt.status === 'Completed') {
      return apt;
    }
    // If appointment date is strictly before today's date string (YYYY-MM-DD), mark completed
    if (apt.date && apt.date < todayStr) {
      return { ...apt, status: 'Completed' as const };
    }
    return apt;
  });
}

export default function App() {
  // Parse dynamic URL parameters and path on initial load
  const initialUrl = useMemo(() => parseCurrentUrl(), []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('telemed_current_user');
      if (saved) {
        return JSON.parse(saved) as User;
      }
    } catch (e) {
      console.warn('Failed to parse cached current user', e);
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (initialUrl.tab) {
      return initialUrl.tab;
    }
    return currentUser ? 'dashboard' : 'xenon';
  });
  const [language, setLanguage] = useState<Language>(() => initialUrl.lang || 'en');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('xenon_theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false; // Default to pristine light mode
  });

  // Universal Auto-Backup Interceptor: Intercepts all database and telemetry saves
  useEffect(() => {
    try {
      const originalSetItem = localStorage.setItem;
      let backupTimeout: any = null;

      localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments as any);

        if (
          key.startsWith('telemed_') ||
          key.startsWith('xenon_')
        ) {
          if (key !== 'xenon_auto_backups_history' && key !== 'xenon_theme') {
            if (backupTimeout) clearTimeout(backupTimeout);
            backupTimeout = setTimeout(() => {
              import('./services/backupService').then(({ captureBackupSnapshot }) => {
                captureBackupSnapshot('Auto-Save', `System snapshot secured after saving "${key}"`);
              });
            }, 600);
          }
        }
      };

      return () => {
        localStorage.setItem = originalSetItem;
        if (backupTimeout) clearTimeout(backupTimeout);
      };
    } catch (e) {
      console.warn('Failed to install auto-backup interceptor', e);
    }
  }, []);

  // Sync theme with document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('xenon_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('xenon_theme', 'light');
      } catch {}
    }
  }, [isDark]);

  // Core Data Collections (Stateful with localStorage persistence)
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('xenon_users') || localStorage.getItem('telemed_users');
      if (saved) {
        const parsed = JSON.parse(saved) as User[];
        // Filter out legacy mock accounts
        const cleaned = parsed.filter(
          (u) =>
            u.username !== 'patient_bina' &&
            u.full_name !== 'Bina Pokharel' &&
            u.full_name !== 'Bina Pokhrel' &&
            u.username !== 'user_patient_demo' &&
            u.full_name !== 'Ram Sharan Parajuli'
        );
        // Ensure Nepal Parajuli is present
        if (!cleaned.some((u) => u.username === 'nepal')) {
          cleaned.unshift(INITIAL_USERS[0]);
        }
        // Ensure Developer is present
        if (!cleaned.some((u) => u.username === 'developer' || u.role === 'developer')) {
          cleaned.push(INITIAL_USERS[1]);
        }
        localStorage.setItem('xenon_users', JSON.stringify(cleaned));
        return cleaned;
      }
    } catch (e) {
      console.warn('Failed to parse cached users', e);
    }
    return INITIAL_USERS;
  });

  // Track whether site has already been operated
  const [hasOperatedSite, setHasOperatedSite] = useState<boolean>(() => {
    try {
      return localStorage.getItem('telemed_site_operated') === 'true';
    } catch {
      return false;
    }
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('telemed_doctors');
      if (saved) {
        const parsed = JSON.parse(saved) as Doctor[];
        // Sync unique individual PINs and official verified real NMC numbers
        const synced = parsed.map((doc) => {
          const match = INITIAL_DOCTORS.find((d) => d.id === doc.id);
          if (match) {
            return {
              ...doc,
              nmc_number: match.nmc_number,
              pin: (!doc.pin || doc.pin === '1234') ? match.pin : doc.pin
            };
          }
          return doc;
        });
        localStorage.setItem('telemed_doctors', JSON.stringify(synced));
        return synced;
      }
    } catch (e) {
      console.warn('Failed to parse cached doctors', e);
    }
    return INITIAL_DOCTORS;
  });

  const [hospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('telemed_appointments');
      if (saved) {
        const parsed = JSON.parse(saved) as Appointment[];
        // Filter out any data of Bina Pokhrel and sync statuses
        const cleaned = parsed.filter(
          (a) =>
            a.patient_username !== 'patient_bina' &&
            a.patient_name !== 'Bina Pokharel' &&
            a.patient_name !== 'Bina Pokhrel'
        );
        const synced = syncAppointmentStatuses(cleaned);
        localStorage.setItem('telemed_appointments', JSON.stringify(synced));
        return synced;
      }
    } catch (e) {
      console.warn('Failed to parse cached appointments', e);
    }
    return syncAppointmentStatuses(INITIAL_APPOINTMENTS);
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    try {
      const saved = localStorage.getItem('telemed_prescriptions');
      if (saved) {
        const parsed = JSON.parse(saved) as Prescription[];
        const cleaned = parsed.filter(
          (p) =>
            p.patient_username !== 'patient_bina' &&
            p.patient_name !== 'Bina Pokharel' &&
            p.patient_name !== 'Bina Pokhrel'
        );
        localStorage.setItem('telemed_prescriptions', JSON.stringify(cleaned));
        return cleaned;
      }
    } catch (e) {
      console.warn('Failed to parse cached prescriptions', e);
    }
    return INITIAL_PRESCRIPTIONS;
  });

  const [labReports, setLabReports] = useState<LabReport[]>(() => {
    try {
      const saved = localStorage.getItem('xenon_custom_lab_reports');
      if (saved) {
        return JSON.parse(saved) as LabReport[];
      }
    } catch (e) {
      console.warn('Failed to parse cached lab reports', e);
    }
    return INITIAL_LAB_REPORTS;
  });

  const handleAddLabReport = (newReport: LabReport) => {
    setLabReports((prev) => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem('xenon_custom_lab_reports', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showToast(`Analyzed and archived report for ${newReport.test_name}!`);
  };

  const handleAddDoctor = (newDoc: Doctor) => {
    setDoctors((prev) => {
      const updated = [newDoc, ...prev];
      try {
        localStorage.setItem('telemed_doctors', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleUpdateDoctor = (updatedDoc: Doctor) => {
    setDoctors((prev) => {
      const updated = prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
      try {
        localStorage.setItem('telemed_doctors', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleDeleteDoctor = (doctorId: string) => {
    setDoctors((prev) => {
      const updated = prev.filter((d) => d.id !== doctorId);
      try {
        localStorage.setItem('telemed_doctors', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Keep appointment statuses synced on schedule / mount
  useEffect(() => {
    setAppointments((prev) => {
      const synced = syncAppointmentStatuses(prev);
      try {
        localStorage.setItem('telemed_appointments', JSON.stringify(synced));
      } catch (e) {
        console.warn(e);
      }
      return synced;
    });
  }, []);

  // Initialize Service Worker, Offline-to-Online Background Sync, and fetch state from backend
  useEffect(() => {
    initBackgroundSync((msg) => {
      showToast(msg);
    });

    const handleSyncComplete = () => {
      try {
        const raw = localStorage.getItem('telemed_appointments');
        if (raw) {
          const parsed = JSON.parse(raw);
          // Sort chronologically (latest date & time first)
          const sorted = parsed.sort((a: Appointment, b: Appointment) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return b.time.localeCompare(a.time);
          });
          setAppointments(sorted);
        }
      } catch (err) {
        console.warn(err);
      }
    };

    window.addEventListener('xenon_sync_completed', handleSyncComplete);

    // Initial fetch from backend to keep in sync and prevent data from reverting to local defaults
    const fetchBackendData = async () => {
      try {
        const res = await fetch('/api/appointments');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.appointments)) {
            setAppointments((prev) => {
              const backendApts: Appointment[] = data.appointments;
              const mergedMap = new Map<string, Appointment>();
              
              // Local items as baseline
              prev.forEach((a) => mergedMap.set(a.id, a));
              // Backend as source of truth
              backendApts.forEach((a) => mergedMap.set(a.id, a));
              
              const merged = Array.from(mergedMap.values());
              const synced = syncAppointmentStatuses(merged);
              
              // Sort chronologically (latest date & time first)
              const sorted = synced.sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return b.time.localeCompare(a.time);
              });

              localStorage.setItem('telemed_appointments', JSON.stringify(sorted));
              return sorted;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to sync initial appointments with backend:', err);
      }
    };

    fetchBackendData();

    return () => {
      window.removeEventListener('xenon_sync_completed', handleSyncComplete);
    };
  }, []);

  // Modal States
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedHospitalForChat, setSelectedHospitalForChat] = useState<Hospital | null>(null);

  const [issueRxModalOpen, setIssueRxModalOpen] = useState(false);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoAppointment, setActiveVideoAppointment] = useState<Appointment | null>(null);

  // Auth Modal state - Automatically opens when visiting without an active session
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(() => !currentUser);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register-doctor' | 'register-patient'>('login');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const markSiteOperated = () => {
    setHasOperatedSite(true);
    try {
      localStorage.setItem('telemed_site_operated', 'true');
    } catch (e) {
      console.warn(e);
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Active Doctor session resolution for strict clinical isolation
  const activeDoctor = useMemo(() => {
    if (currentUser?.role === 'doctor') {
      const savedId = localStorage.getItem('xenon_logged_doctor_id');
      return (
        doctors.find((d) => d.id === savedId) ||
        doctors.find((d) => d.name.toLowerCase().includes(currentUser.full_name.toLowerCase())) ||
        doctors[0]
      );
    }
    return null;
  }, [currentUser, doctors]);

  // Enforce role-based landing on role change or invalid active route
  useEffect(() => {
    if (currentUser?.role === 'developer') {
      const adminAllowed = ['developer', 'xenon', 'emergency'];
      if (!adminAllowed.includes(currentTab)) {
        setCurrentTab('developer');
        syncUrlWithState('developer', { lang: language });
      }
    } else if (currentUser?.role === 'doctor') {
      const docAllowed = ['doctors', 'doctor-dashboard', 'doctor-settings', 'xenon', 'emergency'];
      if (!docAllowed.includes(currentTab)) {
        setCurrentTab('doctors');
        syncUrlWithState('doctors', { lang: language });
      }
    }
  }, [currentUser, currentTab, language]);

  // Dynamic URL: Deep link resolution on initial mount
  useEffect(() => {
    if (initialUrl.doctorId) {
      const matched = doctors.find((d) => d.id === initialUrl.doctorId);
      if (matched) {
        setSelectedDoctorForBooking(matched);
        if (initialUrl.tab === 'book') {
          setBookModalOpen(true);
        }
      }
    }

    if (initialUrl.authMode && !currentUser) {
      setAuthModalMode(initialUrl.authMode);
      setAuthModalOpen(true);
    }

    // Normalize initial URL in browser history
    syncUrlWithState(currentTab, {
      replace: true,
      doctorId: initialUrl.doctorId,
      authMode: initialUrl.authMode,
      lang: language
    });
  }, []);

  // Dynamic URL: Synchronize with browser Back and Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseCurrentUrl();
      if (parsed.tab && parsed.tab !== currentTab) {
        setCurrentTab(parsed.tab);
      }
      if (parsed.lang && parsed.lang !== language) {
        setLanguage(parsed.lang);
      }
      if (parsed.authMode) {
        setAuthModalMode(parsed.authMode);
        setAuthModalOpen(true);
      } else {
        setAuthModalOpen(false);
      }
      if (parsed.doctorId) {
        const matched = doctors.find((d) => d.id === parsed.doctorId);
        if (matched) {
          setSelectedDoctorForBooking(matched);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab, language, doctors]);

  // Protected Navigation Interceptor: Automatically triggers AuthModal when accessing private account tabs
  const handleSelectTab = (tab: string) => {
    if (!currentUser) {
      const guestAllowed = ['xenon', 'emergency', 'hospitals', 'offlineGuide', 'book', 'doctors'];
      if (!guestAllowed.includes(tab)) {
        setAuthModalMode('login');
        setAuthModalOpen(true);
        syncUrlWithState(tab, { authMode: 'login', lang: language });
        showToast('Please sign in or register to access personal account features.');
        return;
      }
      setCurrentTab(tab);
      syncUrlWithState(tab, { lang: language });
      return;
    }

    if (currentUser.role === 'developer') {
      const adminAllowed = ['developer', 'xenon', 'emergency'];
      if (!adminAllowed.includes(tab)) {
        showToast('Admin accounts are dedicated strictly to system operations & monitoring.');
        setCurrentTab('developer');
        syncUrlWithState('developer', { lang: language });
        return;
      }
      setCurrentTab(tab);
      syncUrlWithState(tab, { lang: language });
      return;
    }

    if (currentUser.role === 'doctor') {
      const docAllowed = ['doctors', 'doctor-dashboard', 'doctor-settings', 'xenon', 'emergency'];
      if (!docAllowed.includes(tab)) {
        showToast('Doctor access is isolated to clinical workspace & practice management.');
        setCurrentTab('doctors');
        syncUrlWithState('doctors', { lang: language });
        return;
      }
      setCurrentTab(tab);
      syncUrlWithState(tab, { lang: language });
      return;
    }

    // Patient Role
    if (tab === 'developer' || tab === 'doctor-settings') {
      showToast('Access restricted to verified administrators and medical practitioners.');
      setCurrentTab('dashboard');
      syncUrlWithState('dashboard', { lang: language });
      return;
    }

    setCurrentTab(tab);
    syncUrlWithState(tab, { lang: language });
  };

  const handleSetLanguage = (newLang: Language) => {
    setLanguage(newLang);
    syncUrlWithState(currentTab, { lang: newLang });
  };

  // Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'register-doctor' | 'register-patient' | 'doctor-login' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    syncUrlWithState(currentTab, { authMode: mode, lang: language });
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
    syncUrlWithState(currentTab, { lang: language });
  };

  const handleLoginSuccess = (user: User) => {
    markSiteOperated();
    setCurrentUser(user);
    setAuthModalOpen(false);
    const targetTab = user.role === 'developer' ? 'developer' : user.role === 'doctor' ? 'doctors' : 'dashboard';
    setCurrentTab(targetTab);
    syncUrlWithState(targetTab, { lang: language });
    try {
      localStorage.setItem('telemed_current_user', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    showToast(`Welcome, ${user.full_name}! Logged in as ${user.role}.`);
  };

  const handleDoctorLogin = (doc: Doctor, docUser: User) => {
    markSiteOperated();
    setCurrentUser(docUser);
    try {
      localStorage.setItem('telemed_current_user', JSON.stringify(docUser));
      localStorage.setItem('xenon_logged_doctor_id', doc.id);
    } catch (e) {
      console.warn(e);
    }
    setAuthModalOpen(false);
    setCurrentTab('doctors');
    syncUrlWithState('doctors', { lang: language });
    showToast(`Welcome Dr. ${doc.name.replace('Dr. ', '')}! Clinical workspace unlocked.`);
  };

  const saveUsersList = (updatedUsers: User[]) => {
    try {
      localStorage.setItem('xenon_users', JSON.stringify(updatedUsers));
      localStorage.setItem('telemed_users', JSON.stringify(updatedUsers));
    } catch (e) {
      console.warn('Failed to persist users list', e);
    }
  };

  const handleDoctorRegistered = (newDoctor: Doctor, newUser: User) => {
    markSiteOperated();
    setDoctors((prev) => {
      const updated = [newDoctor, ...prev];
      try {
        localStorage.setItem('telemed_doctors', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    setUsers((prev) => {
      const exists = prev.some((u) => u.id === newUser.id || u.username === newUser.username);
      const updated = exists
        ? prev.map((u) => (u.id === newUser.id || u.username === newUser.username ? newUser : u))
        : [newUser, ...prev];
      saveUsersList(updated);
      return updated;
    });

    setCurrentUser(newUser);
    setAuthModalOpen(false);
    setCurrentTab('doctors');
    syncUrlWithState('doctors', { lang: language });
    try {
      localStorage.setItem('telemed_current_user', JSON.stringify(newUser));
    } catch (e) {
      console.warn(e);
    }

    showToast(`Doctor registration approved! Welcome, ${newDoctor.name} (${newDoctor.nmc_number}).`);
  };

  const handlePatientRegistered = (newPatient: User) => {
    markSiteOperated();
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === newPatient.id || u.username === newPatient.username);
      const updated = exists
        ? prev.map((u) => (u.id === newPatient.id || u.username === newPatient.username ? newPatient : u))
        : [newPatient, ...prev];
      saveUsersList(updated);
      return updated;
    });

    setCurrentUser(newPatient);
    setAuthModalOpen(false);
    setCurrentTab('dashboard');
    syncUrlWithState('dashboard', { lang: language });
    try {
      localStorage.setItem('telemed_current_user', JSON.stringify(newPatient));
    } catch (e) {
      console.warn(e);
    }

    showToast(`Patient registered! Welcome, ${newPatient.full_name} (PID: ${newPatient.id}).`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updatedUser.id || u.username === updatedUser.username);
      const updated = exists
        ? prev.map((u) => (u.id === updatedUser.id || u.username === updatedUser.username ? updatedUser : u))
        : [updatedUser, ...prev];
      saveUsersList(updated);
      return updated;
    });
    try {
      localStorage.setItem('telemed_current_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn(e);
    }
    showToast(`Health profile updated for ${updatedUser.full_name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('telemed_current_user');
      localStorage.removeItem('xenon_logged_doctor_id');
    } catch (e) {
      console.warn(e);
    }
    setCurrentTab('xenon');
    setAuthModalMode('login');
    setAuthModalOpen(true);
    syncUrlWithState('xenon', { authMode: 'login', lang: language });
    showToast('Signed out successfully. Please sign in or register to continue.');
  };

  // Handlers
  const handleOpenBookModal = (doc?: Doctor) => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      syncUrlWithState(currentTab, { authMode: 'login', lang: language });
      showToast('Sign in required to schedule an OPD consultation.');
      return;
    }
    const chosen = doc || doctors[0];
    setSelectedDoctorForBooking(chosen);
    setBookModalOpen(true);
    syncUrlWithState('book', { doctorId: chosen.id, lang: language });
  };

  const handleCloseBookModal = () => {
    setBookModalOpen(false);
    syncUrlWithState(currentTab, { lang: language });
  };

  const handleConfirmBooking = (newApt: Appointment) => {
    setAppointments((prev) => {
      const updated = [newApt, ...prev];
      try {
        localStorage.setItem('telemed_appointments', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showToast(`Appointment confirmed with ${newApt.doctor_name} for ${newApt.date}!`);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments((prev) => {
      const updated = prev.map((apt) => {
        if (apt.id === appointmentId) {
          const cancelledApt = { ...apt, status: 'Cancelled' as const };
          // Immediately POST the cancellation to the backend database
          fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cancelledApt)
          }).catch((err) => {
            console.warn('Failed to sync cancelled appointment with backend:', err);
          });
          return cancelledApt;
        }
        return apt;
      });
      try {
        localStorage.setItem('telemed_appointments', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showToast(`Appointment #${appointmentId.toUpperCase()} has been cancelled.`);
  };

  const handleOpenChat = (hosp: Hospital) => {
    setSelectedHospitalForChat(hosp);
    setChatModalOpen(true);
  };

  const handleOpenVideoRoom = (apt: Appointment) => {
    setActiveVideoAppointment(apt);
    setVideoModalOpen(true);
  };

  const handleSavePrescription = (newRx: Prescription) => {
    setPrescriptions((prev) => {
      const updated = [newRx, ...prev];
      try {
        localStorage.setItem('telemed_prescriptions', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showToast(`Digital Prescription #${newRx.id.toUpperCase()} successfully issued and signed!`);
  };

  // Safe fallback user for records and booking if logged out
  const activeUser = currentUser || INITIAL_USERS[0];

  // Automatic orientation / landscape mode handler
  useEffect(() => {
    const handleOrientationOrResize = () => {
      const isLandscape = window.innerWidth > window.innerHeight && window.innerHeight < 600;
      if (isLandscape && window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleOrientationOrResize();
    window.addEventListener('resize', handleOrientationOrResize);
    window.addEventListener('orientationchange', handleOrientationOrResize);
    return () => {
      window.removeEventListener('resize', handleOrientationOrResize);
      window.removeEventListener('orientationchange', handleOrientationOrResize);
    };
  }, []);

  return (
    <div className={`min-h-screen w-full flex justify-center transition-colors duration-200 ${isDark ? 'dark bg-[#03060E]' : 'bg-[#E2E8F0]'}`}>
      <div className={`w-full max-w-[1440px] min-h-screen flex relative font-sans shadow-2xl border-x border-slate-200/50 dark:border-slate-800/50 ${isDark ? 'bg-[#070A12] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
        {/* Ambient Liquid Glass Refraction Mesh Orbs */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-500/15 to-purple-500/10 blur-3xl opacity-90 dark:opacity-30" />
          <div className="absolute top-1/3 -right-32 w-[40rem] h-[40rem] rounded-full bg-gradient-to-bl from-cyan-400/20 via-sky-500/15 to-blue-600/10 blur-3xl opacity-85 dark:opacity-25" />
          <div className="absolute -bottom-32 left-1/4 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-teal-400/15 via-emerald-400/10 to-indigo-500/15 blur-3xl opacity-80 dark:opacity-25" />
        </div>

      {/* Desktop Vertical Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        language={language}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen w-full">
        {/* Navigation Bar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={handleSelectTab}
          language={language}
          setLanguage={handleSetLanguage}
          isDark={isDark}
          setIsDark={setIsDark}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNotifyToast={showToast}
        />

        {/* Offline-to-Online Background Sync Status Bar: STRICTLY ADMIN DEVELOPER ONLY */}
        {currentUser?.role === 'developer' && (
          <SyncStatusBar onNotifyToast={showToast} />
        )}

        {/* Dynamic View Body */}
        <main className="flex-1 flex flex-col w-full min-w-0 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-mobile-nav overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              doctors={doctors}
              hospitals={hospitals}
              appointments={appointments}
              prescriptions={prescriptions}
              language={language}
              onNavigate={handleSelectTab}
              onBookClick={() => handleOpenBookModal()}
              onOpenVideoRoom={handleOpenVideoRoom}
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onUpdateUser={handleUpdateUser}
              onUpdateAppointment={(updatedApt) => {
                setAppointments((prev) => {
                  const updated = prev.map((a) => (a.id === updatedApt.id ? updatedApt : a));
                  try {
                    localStorage.setItem('telemed_appointments', JSON.stringify(updated));
                  } catch (e) {
                    console.warn(e);
                  }
                  return updated;
                });
                
                // Immediately POST the updated appointment to the backend database
                fetch('/api/appointments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedApt)
                }).catch((err) => {
                  console.warn('Failed to sync updated appointment with backend:', err);
                });
              }}
            />
          )}

          {currentTab === 'xenon' && (
            <XenonAiView
              language={language}
              onBookDoctor={() => handleOpenBookModal()}
              onNavigate={handleSelectTab}
            />
          )}

          {/* DOCTOR WORKSPACE: Strictly isolated clinical dashboard for doctors, directory for patients */}
          {(currentTab === 'doctors' || currentTab === 'doctor-dashboard' || currentTab === 'doctor-settings') && (
            currentUser?.role === 'doctor' && activeDoctor ? (
              <DoctorDashboardView
                currentDoctor={activeDoctor}
                appointments={appointments}
                prescriptions={prescriptions}
                labReports={labReports}
                language={language}
                onOpenVideoRoom={handleOpenVideoRoom}
                onIssueRxClick={() => setIssueRxModalOpen(true)}
                onNavigateToXenon={() => handleSelectTab('xenon')}
                onUpdateDoctorProfile={handleUpdateDoctor}
              />
            ) : (
              <DoctorsView
                doctors={doctors}
                language={language}
                onBookDoctor={(doc) => handleOpenBookModal(doc)}
                onOpenDoctorRegister={() => handleOpenAuth('doctor-login')}
              />
            )
          )}

          {/* BOOK SPECIALIST FOR PATIENTS */}
          {currentTab === 'book' && (
            <DoctorDirectoryView
              doctors={doctors}
              language={language}
              onBookDoctor={(doc) => handleOpenBookModal(doc)}
            />
          )}

          {currentTab === 'developer' && (
            currentUser?.role === 'developer' ? (
              <DeveloperConsoleView
                doctors={doctors}
                users={users}
                appointments={appointments}
                prescriptions={prescriptions}
                language={language}
                onAddDoctor={handleAddDoctor}
                onUpdateDoctor={handleUpdateDoctor}
                onDeleteDoctor={handleDeleteDoctor}
                onUpdatePatient={handleUpdateUser}
                 onUpdateAppointment={(updatedApt) => {
                   setAppointments((prev) => {
                     const updated = prev.map((a) => (a.id === updatedApt.id ? updatedApt : a));
                     try {
                       localStorage.setItem('telemed_appointments', JSON.stringify(updated));
                     } catch (e) {
                       console.warn(e);
                     }
                     return updated;
                   });

                   // Immediately POST the updated appointment to the backend database
                   fetch('/api/appointments', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(updatedApt)
                   }).catch((err) => {
                     console.warn('Failed to sync updated appointment with backend:', err);
                   });

                   showToast(`Appointment #${updatedApt.id.toUpperCase()} updated successfully!`);
                 }}
                onSwitchUserSession={(user) => {
                  setCurrentUser(user);
                  showToast(`Switched session to ${user.full_name} (${user.role})`);
                }}
                onNavigate={handleSelectTab}
              />
            ) : (
              <div className="py-16 px-4 text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-600 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'np' ? 'प्रशासक पहुँच प्रतिबन्धित' : 'Administrator Access Restricted'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {language === 'np'
                    ? 'विकासकर्ता तथा डाटाबेस कन्सोल आधिकारिक प्रशासकहरूका लागि मात्र उपलब्ध छ।'
                    : 'Operational database records, system logs, and telemetry are strictly restricted to authorized administrators.'}
                </p>
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer shadow-md hover:bg-slate-800 transition-colors"
                >
                  {language === 'np' ? 'प्रशासक खातामा लगइन गर्नुहोस्' : 'Sign In as Administrator'}
                </button>
              </div>
            )
          )}

          {currentTab === 'hospitals' && (
            <HospitalsView
              hospitals={hospitals}
              language={language}
              onOpenChat={handleOpenChat}
            />
          )}

          {currentTab === 'locationMedevac' && (
            <LocationMedevacView
              language={language}
              onBookDoctor={(hospId) => handleOpenBookModal()}
              onNavigate={handleSelectTab}
            />
          )}

          {currentTab === 'records' && (
            <PatientRecordsView
              appointments={appointments}
              prescriptions={prescriptions}
              currentUser={activeUser}
              language={language}
              onOpenVideoRoom={handleOpenVideoRoom}
              onIssueRxClick={() => setIssueRxModalOpen(true)}
              onOpenPatientRegister={() => handleOpenAuth('register-patient')}
              onCancelAppointment={handleCancelAppointment}
              onOpenConsultation={() => handleOpenBookModal()}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {currentTab === 'lab' && (
            <LabReportsView
              labReports={labReports}
              onAddLabReport={handleAddLabReport}
              language={language}
            />
          )}

          {currentTab === 'offlineGuide' && (
            <OfflineGuideView
              language={language}
            />
          )}

          {currentTab === 'emergency' && (
            <EmergencyView
              contacts={INITIAL_EMERGENCY_CONTACTS}
              language={language}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-auto shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090D1A]/95 py-4 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            <p>
              🇳🇵 <b>XENON HEALTH</b> — Clinical Telemedicine, AI Triage &amp; Vitals Telemetry Platform
            </p>
          </div>
        </footer>
      </div>


      {/* Floating Action Modals */}
      <BookModal
        isOpen={bookModalOpen}
        doctor={selectedDoctorForBooking}
        doctors={doctors}
        currentUser={activeUser}
        language={language}
        onClose={handleCloseBookModal}
        onConfirmBooking={handleConfirmBooking}
      />

      <ChatModal
        isOpen={chatModalOpen}
        hospital={selectedHospitalForChat}
        currentUser={activeUser}
        onClose={() => setChatModalOpen(false)}
      />

      <IssueRxModal
        isOpen={issueRxModalOpen}
        currentUser={activeUser}
        onClose={() => setIssueRxModalOpen(false)}
        onSavePrescription={handleSavePrescription}
      />

      <VideoRoomModal
        isOpen={videoModalOpen}
        appointment={activeVideoAppointment}
        onClose={() => setVideoModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={handleCloseAuth}
        onLoginSuccess={handleLoginSuccess}
        onDoctorLoginSuccess={handleDoctorLogin}
        onDoctorRegistered={handleDoctorRegistered}
        onPatientRegistered={handlePatientRegistered}
        hospitals={hospitals}
        doctors={doctors}
        existingUsers={users}
        language={language}
        isFirstVisit={false}
        currentUser={currentUser}
      />

      {/* Native Thumb-Friendly Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab as any}
        onSelectTab={(tab) => handleSelectTab(tab)}
        language={language}
        currentUser={currentUser}
      />

      {/* Toast Popup Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] text-black dark:text-white text-xs font-bold shadow-2xl border border-black/10 dark:border-white/20 flex items-center gap-2.5"
          >
            <span>✨</span>
            <span className="text-black dark:text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

