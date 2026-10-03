import React from 'react';
import {
  Stethoscope,
  Activity,
  Building2,
  PhoneCall,
  Sparkles,
  Mountain,
  Code,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lock,
  FlaskConical,
  LayoutDashboard
} from 'lucide-react';
import { User, Language } from '../types';
import { Logo } from './Logo';
import { triggerHaptic } from '../utils/haptics';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  language: Language;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAuth: (mode?: 'login' | 'register-doctor' | 'register-patient') => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  language,
  collapsed,
  onToggleCollapse,
  onOpenAuth,
  onLogout
}) => {
  const isDoctor = currentUser?.role === 'doctor';
  const isDeveloper = currentUser?.role === 'developer';
  const isPatient = currentUser?.role === 'patient';
  const isGuest = !currentUser;

  // Build navigation items based on strict role access boundaries
  const navItems = React.useMemo(() => {
    if (isDoctor) {
      return [
        {
          id: 'doctors',
          label: language === 'np' ? 'क्लिनिकल ड्यासबोर्ड' : 'Doctor Workspace & Queue',
          shortLabel: 'Queue',
          icon: Stethoscope,
          badge: 'NMC'
        },
        {
          id: 'xenon',
          label: language === 'np' ? 'जेमिनी क्लिनिकल AI' : 'Xenon Clinical Decision AI',
          shortLabel: 'Xenon AI',
          icon: Sparkles
        },
        {
          id: 'emergency',
          label: language === 'np' ? 'आपतकालीन १०२ उद्धार' : 'Emergency SOS (102)',
          shortLabel: 'SOS 102',
          icon: PhoneCall,
          alert: true
        }
      ];
    }

    if (isDeveloper) {
      return [
        {
          id: 'developer',
          label: language === 'np' ? 'विकासकर्ता तथा एडमिन कन्सोल' : 'Dev Console & Admin Ops',
          shortLabel: 'Dev Console',
          icon: Code,
          badge: 'Root'
        },
        {
          id: 'xenon',
          label: language === 'np' ? 'जेमिनी AI स्यान्डबक्स' : 'Xenon AI Test Sandbox',
          shortLabel: 'AI Sandbox',
          icon: Sparkles
        },
        {
          id: 'emergency',
          label: language === 'np' ? 'आपतकालीन उद्धार मनिटर' : 'Emergency SOS Monitor',
          shortLabel: 'SOS Monitor',
          icon: PhoneCall,
          alert: true
        }
      ];
    }

    if (isPatient) {
      return [
        {
          id: 'dashboard',
          label: language === 'np' ? 'स्वास्थ्य पोर्टल (ड्यासबोर्ड)' : 'Patient Dashboard',
          shortLabel: 'Dashboard',
          icon: LayoutDashboard
        },
        {
          id: 'records',
          label: language === 'np' ? 'भाइटल टेलिमेट्री र रेकर्डहरू' : 'Vitals Telemetry & Records',
          shortLabel: 'Vitals & Rx',
          icon: Activity,
          badge: 'Live'
        },
        {
          id: 'book',
          label: language === 'np' ? 'विशेषज्ञ डाक्टर बुकिङ' : 'Book Specialist Doctor',
          shortLabel: 'Book OPD',
          icon: Stethoscope
        },
        {
          id: 'hospitals',
          label: language === 'np' ? 'अस्पताल तथा आईसीयू सूची' : 'Hospitals & ICU Directory',
          shortLabel: 'Hospitals',
          icon: Building2
        },
        {
          id: 'lab',
          label: language === 'np' ? 'ल्याब तथा रेडियोलोजी' : 'Diagnostic Lab Archive',
          shortLabel: 'Lab Reports',
          icon: FlaskConical
        },
        {
          id: 'xenon',
          label: language === 'np' ? 'जेनोन AI स्वास्थ्य सहायक' : 'Xenon AI Assistant (24/7)',
          shortLabel: 'Xenon AI',
          icon: Sparkles
        },
        {
          id: 'emergency',
          label: language === 'np' ? 'आपतकालीन १०२ उद्धार' : 'Emergency SOS (102)',
          shortLabel: 'SOS 102',
          icon: PhoneCall,
          alert: true
        },
        {
          id: 'offlineGuide',
          label: language === 'np' ? 'हिमाली प्राथमिक उपचार' : 'High Altitude Guide',
          shortLabel: 'Altitude',
          icon: Mountain
        }
      ];
    }

    // GUEST / UNAUTHENTICATED
    return [
      {
        id: 'xenon',
        label: language === 'np' ? 'जेनोन AI स्वास्थ्य सहायक' : 'Xenon AI Triage (24/7)',
        shortLabel: 'Xenon AI',
        icon: Sparkles
      },
      {
        id: 'emergency',
        label: language === 'np' ? 'आपतकालीन १०२ हटलाइन' : 'Emergency SOS (102)',
        shortLabel: 'SOS 102',
        icon: PhoneCall,
        alert: true
      },
      {
        id: 'hospitals',
        label: language === 'np' ? 'अस्पताल तथा आईसीयू सूची' : 'Hospitals & ICU Directory',
        shortLabel: 'Hospitals',
        icon: Building2
      },
      {
        id: 'offlineGuide',
        label: language === 'np' ? 'हिमाली प्राथमिक उपचार' : 'High Altitude Guide',
        shortLabel: 'Altitude',
        icon: Mountain
      }
    ];
  }, [isDoctor, isDeveloper, isPatient, isGuest, language]);

  const handleTabClick = (tabId: string, isAlert?: boolean) => {
    if (isAlert) {
      triggerHaptic('emergency');
    } else {
      triggerHaptic('light');
    }
    onSelectTab(tabId);
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#FBFBFD] dark:bg-[#090D1A] border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 z-30 shrink-0 sticky top-0 h-screen select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/60 dark:border-slate-800/80">
        <div
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden p-1 rounded-xl hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition-colors"
          onClick={() => handleTabClick(isDoctor ? 'doctors' : isDeveloper ? 'developer' : isPatient ? 'dashboard' : 'xenon')}
        >
          <Logo size={collapsed ? 28 : 32} showText={!collapsed} showBadge={false} />
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Session Card */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Session</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
              {currentUser ? currentUser.full_name : 'Guest Visitor'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>{isDoctor ? 'NMC Verified Doctor' : isDeveloper ? 'System Admin' : isPatient ? 'Verified Patient' : 'Public Access'}</span>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto sidebar-scroll scroll-touch-y">
        {!collapsed && (
          <div className="px-2.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isDoctor ? 'Clinical Workspace' : isDeveloper ? 'Admin Console' : 'Navigation'}
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id, item.alert)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left relative ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold shadow-xs'
                  : item.alert
                  ? 'text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30'
                  : 'text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-white dark:text-slate-950'
                    : item.alert
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 dark:bg-black/15 text-white dark:text-slate-900'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Auth / User Section */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
        {currentUser ? (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>{language === 'np' ? 'लगआउट (Sign Out)' : 'Sign Out'}</span>}
          </button>
        ) : (
          <button
            onClick={() => onOpenAuth('login')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign In"
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>{language === 'np' ? 'लगइन गर्नुहोस्' : 'Sign In'}</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
