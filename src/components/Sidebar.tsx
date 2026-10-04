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
  LayoutDashboard,
  CheckSquare,
  ShieldCheck
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

/**
 * Conditional Layout Wrapper for the Sidebar Header.
 * Guarantees that the site logo emblem is dynamically repositioned without being
 * covered, clipped, or squashed by the collapse button or transition animations.
 */
interface HeaderWrapperProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogoClick: () => void;
}

const SidebarHeaderLayoutWrapper: React.FC<HeaderWrapperProps> = ({
  collapsed,
  onToggle,
  onLogoClick
}) => {
  if (collapsed) {
    /* COLLAPSED STATE: Dedicated centered vertical pod */
    return (
      <div className="flex flex-col items-center justify-center py-3.5 px-2 border-b border-slate-200/80 dark:border-white/10 gap-2.5 w-full relative">
        {/* Isolated Logo Capsule: Centered & Protected */}
        <div
          onClick={onLogoClick}
          className="w-11 h-11 rounded-2xl flex items-center justify-center liquid-glass border border-white/80 dark:border-white/20 shadow-xs hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Xenon Health — Home"
        >
          <Logo size={28} showText={false} showBadge={false} />
        </div>

        {/* Repositioned Expand Toggle Button: Sits cleanly below logo with zero overlap */}
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all active:scale-90 cursor-pointer"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* EXPANDED STATE: Horizontal flex row with full brand typography */
  return (
    <div className="flex items-center justify-between h-18 px-4 border-b border-slate-200/80 dark:border-white/10 w-full relative">
      {/* Brand Identity Wrapper */}
      <div
        onClick={onLogoClick}
        className="flex items-center gap-2.5 cursor-pointer overflow-hidden p-1.5 -ml-1 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-200 group"
      >
        <div className="shrink-0 transition-transform group-hover:scale-105">
          <Logo size={32} showText={true} showBadge={false} />
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="p-2 rounded-xl bg-white/60 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all active:scale-95 cursor-pointer"
        title="Collapse sidebar"
        aria-label="Collapse sidebar"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
};

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

  // Build navigation items based on role access boundaries
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
          label: language === 'np' ? 'स्वास्थ्य ड्यासबोर्ड' : 'Patient Dashboard',
          shortLabel: 'Dashboard',
          icon: LayoutDashboard
        },
        {
          id: 'records',
          label: language === 'np' ? 'भाइटल चेकलिस्ट र रेकर्डहरू' : 'Vitals Checklist & Records',
          shortLabel: 'Vitals & Rx',
          icon: CheckSquare,
          badge: 'Daily'
        },
        {
          id: 'book',
          label: language === 'np' ? 'विशेषज्ञ डाक्टर बुकिङ' : 'Book Specialist Doctor',
          shortLabel: 'Book OPD',
          icon: Stethoscope
        },
        {
          id: 'doctors',
          label: language === 'np' ? 'डाक्टर तथा NMC प्रमाणीकरण' : 'Doctors & NMC Verification',
          shortLabel: 'NMC Verify',
          icon: ShieldCheck,
          badge: 'NMC'
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
        id: 'doctors',
        label: language === 'np' ? 'डाक्टर तथा NMC प्रमाणीकरण' : 'Doctors & NMC Verification',
        shortLabel: 'NMC Verify',
        icon: ShieldCheck,
        badge: 'NMC'
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

  const handleToggle = () => {
    triggerHaptic('medium');
    onToggleCollapse();
  };

  const handleLogoClick = () => {
    handleTabClick(
      isDoctor ? 'doctors' : isDeveloper ? 'developer' : isPatient ? 'dashboard' : 'xenon'
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col h-full min-h-screen sticky top-0 bottom-0 self-stretch liquid-glass-sidebar transition-all duration-300 z-30 shrink-0 select-none relative overflow-hidden ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Liquid Ambient Gradient Glow Layers */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-0 w-36 h-36 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Brand Header with Conditional Layout Wrapper */}
      <SidebarHeaderLayoutWrapper
        collapsed={collapsed}
        onToggle={handleToggle}
        onLogoClick={handleLogoClick}
      />

      {/* Active Session Pill (Glass Look) */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3.5 py-2.5 rounded-2xl liquid-glass-card border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400 font-extrabold tracking-wider uppercase text-[9px]">Session</span>
            <span className="font-black text-slate-950 dark:text-white truncate max-w-[120px]">
              {currentUser ? currentUser.full_name : 'Guest Visitor'}
            </span>
          </div>
          <div className="text-[10px] text-slate-700 dark:text-slate-300 font-medium mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] inline-block shrink-0" />
            <span className="truncate font-semibold">
              {isDoctor
                ? 'NMC Verified Doctor'
                : isDeveloper
                ? 'System Administrator'
                : isPatient
                ? 'Verified Patient'
                : 'Public Access'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Section with Liquid Glass Momentum Scrolling */}
      <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto sidebar-scroll scroll-touch-y">
        {!collapsed && (
          <div className="px-2.5 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-all duration-200 cursor-pointer text-left relative overflow-hidden group ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black shadow-md border border-slate-800 dark:border-white/20'
                  : item.alert
                  ? 'text-red-700 dark:text-rose-400 font-black bg-red-500/10 hover:bg-red-500/20 border border-red-500/30'
                  : 'text-slate-800 dark:text-slate-200 font-bold hover:text-slate-950 dark:hover:text-white hover:bg-slate-900/[0.05] dark:hover:bg-white/10 hover:border-slate-300/80 dark:hover:border-white/10 border border-transparent shadow-2xs hover:shadow-xs'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active Specular Highlights */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/25 pointer-events-none" />
              )}

              <Icon
                className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                  isActive
                    ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                    : item.alert
                    ? 'text-red-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              />

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
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

      {/* Bottom Auth / User Section (Liquid Glass Pod) */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/10 space-y-1.5 mt-auto bg-white/40 dark:bg-white/[0.02]">
        {currentUser ? (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onLogout();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{language === 'np' ? 'लगआउट (Sign Out)' : 'Sign Out'}</span>}
          </button>
        ) : (
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAuth('login');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-md border border-slate-700 dark:border-white/10 transition-all active:scale-95 cursor-pointer ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Sign In"
          >
            <Lock className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{language === 'np' ? 'लगइन गर्नुहोस्' : 'Sign In'}</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
