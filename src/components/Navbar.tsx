import React, { useState, useEffect } from 'react';
import {
  Activity,
  Globe,
  Moon,
  Sun,
  Menu as MenuIcon,
  X,
  Lock,
  LogOut,
  Stethoscope,
  ChevronDown,
  Sparkles,
  PhoneCall,
  Search,
  ShieldCheck,
  Code,
  User,
  FileText,
  KeyRound,
  LayoutDashboard,
  Building2,
  Mountain,
  FlaskConical
} from 'lucide-react';
import { Language, User as UserType } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  currentUser: UserType | null;
  onOpenAuth: (mode?: 'login' | 'register-doctor' | 'register-patient') => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  isDark,
  setIsDark,
  currentUser,
  onOpenAuth,
  onLogout,
  onToggleSidebar
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isDoctor = currentUser?.role === 'doctor';
  const isDeveloper = currentUser?.role === 'developer';
  const isPatient = currentUser?.role === 'patient';

  // Active module title & breadcrumb
  const moduleInfo = React.useMemo(() => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: language === 'np' ? 'स्वास्थ्य पोर्टल (ड्यासबोर्ड)' : 'Patient Health Portal',
          subtitle: 'Clinical Overview & Personal Health Vault'
        };
      case 'records':
        return {
          title: language === 'np' ? 'भाइटल टेलिमेट्री र रेकर्डहरू' : 'Vitals Telemetry & Medical Records',
          subtitle: 'Longitudinal Telemetry, BP & SpO2 Analytics'
        };
      case 'doctors':
      case 'doctor-dashboard':
        return {
          title: language === 'np' ? 'डाक्टर क्लिनिकल ड्यासबोर्ड' : 'Doctor Clinical Workspace',
          subtitle: isDoctor ? 'Assigned Consultations & Patient Queue' : 'NMC Specialist Workspace'
        };
      case 'book':
        return {
          title: language === 'np' ? 'विशेषज्ञ डाक्टर बुकिङ' : 'Book Specialist Consultation',
          subtitle: 'Verified Nepal Medical Council (NMC) Directory'
        };
      case 'doctor-settings':
        return {
          title: language === 'np' ? 'प्राक्टिस सेटिङ्स र सुरक्षा PIN' : 'Practitioner Settings & PIN Control',
          subtitle: 'Security Credentials & OPD Availability'
        };
      case 'xenon':
        return {
          title: 'Xenon AI Medical Assistant',
          subtitle: 'Bilingual Clinical Triage & High-Altitude Diagnosis'
        };
      case 'emergency':
        return {
          title: language === 'np' ? 'आपतकालीन १०२ उद्धार हटलाइन' : 'National Emergency & SOS 102 Dispatch',
          subtitle: 'Nepal Army Helicopter Rescue & Blood Bank (105)'
        };
      case 'hospitals':
        return {
          title: language === 'np' ? 'अस्पताल तथा आईसीयू सूची' : 'Nepal Hospitals & ICU Directory',
          subtitle: 'Verified Medical Centers & Emergency Beds'
        };
      case 'lab':
        return {
          title: language === 'np' ? 'ल्याब तथा रेडियोलोजी' : 'Diagnostic Lab & Imaging Archive',
          subtitle: 'Biochemistry, Pathology & AI Summaries'
        };
      case 'developer':
        return {
          title: 'Developer & Admin Console',
          subtitle: 'System Telemetry, Doctor Verification & Audit'
        };
      default:
        return {
          title: 'Xenon Health Nepal',
          subtitle: 'Next-Gen Digital Healthcare & Telemedicine'
        };
    }
  }, [currentTab, language, isDoctor]);

  return (
    <header className="sticky top-0 z-20 w-full bg-white/95 dark:bg-[#090D1A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Left: Mobile Brand / Desktop Module Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Logo */}
            <div className="flex items-center md:hidden shrink-0">
              <Logo size={28} showText={false} />
            </div>

            {/* Breadcrumb Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="hidden sm:inline text-slate-400 font-mono text-[10px] tracking-wider uppercase">Xenon Health</span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600" aria-hidden="true">/</span>
                <span className="text-slate-900 dark:text-white font-bold truncate">
                  {moduleInfo.title}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate hidden lg:block">
                {moduleInfo.subtitle}
              </div>
            </div>
          </div>

          {/* Right: Actions, Language, Theme & User Capsule */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Quick Emergency 102 Button */}
            <button
              onClick={() => setCurrentTab('emergency')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20 transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS 102</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'np' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold border border-black/[0.04] dark:border-white/[0.06] transition-colors cursor-pointer"
              title="Switch Language (English / नेपाली)"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono uppercase">{language}</span>
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs border border-black/[0.04] dark:border-white/[0.06] transition-colors cursor-pointer"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>

            {/* User Profile Capsule or Sign In Trigger */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-900 dark:text-white border border-black/[0.04] dark:border-white/[0.06] transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold shadow-xs">
                    {isDoctor ? '🩺' : isDeveloper ? '💻' : currentUser.full_name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold truncate max-w-[110px]">
                      {currentUser.full_name}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-2">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {currentUser.email || currentUser.phone}
                        </div>
                      </div>

                      {isDoctor && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setCurrentTab('doctors');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                          <span>Clinical Workspace &amp; Queue</span>
                        </button>
                      )}

                      {isDeveloper && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setCurrentTab('developer');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors text-left font-bold"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>Admin Console</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAuth('login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Switch Account</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{language === 'np' ? 'लगइन' : 'Sign In'}</span>
              </button>
            )}

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 md:hidden border border-slate-200 dark:border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D1A] p-4 space-y-2 animate-in slide-in-from-top-2">
          {isDoctor ? (
            <>
              <button
                onClick={() => {
                  setCurrentTab('doctors');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'doctors' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor Workspace &amp; Queue</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('xenon');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'xenon' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Xenon AI Clinical Decision</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('emergency');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Emergency SOS (102)</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('doctor-settings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'doctor-settings' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Practitioner PIN &amp; Settings</span>
              </button>
            </>
          ) : isDeveloper ? (
            <>
              <button
                onClick={() => {
                  setCurrentTab('developer');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              >
                <Code className="w-4 h-4" />
                <span>Dev Console &amp; Admin Ops</span>
              </button>
              <button
                onClick={() => {
                  setCurrentTab('xenon');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Sparkles className="w-4 h-4" />
                <span>Xenon AI Test Sandbox</span>
              </button>
            </>
          ) : isPatient ? (
            <>
              <button
                onClick={() => {
                  setCurrentTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'dashboard' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Patient Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('records');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'records' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Vitals Telemetry &amp; Records</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('book');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'book' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Book Specialist Doctor</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('hospitals');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Building2 className="w-4 h-4" />
                <span>Hospitals Directory</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('xenon');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Sparkles className="w-4 h-4" />
                <span>Xenon AI Assistant (24/7)</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('emergency');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Emergency SOS (102)</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setCurrentTab('xenon');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Sparkles className="w-4 h-4" />
                <span>Xenon AI Triage (24/7)</span>
              </button>
              <button
                onClick={() => {
                  setCurrentTab('emergency');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Emergency SOS (102)</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
