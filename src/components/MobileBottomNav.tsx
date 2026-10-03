import React from 'react';
import { TabType, Language, User } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  LayoutDashboard,
  Stethoscope,
  Sparkles,
  PhoneCall,
  Activity,
  Code,
  KeyRound,
  Building2
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: Language;
  currentUser?: User | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  language,
  currentUser
}) => {
  const isDoctor = currentUser?.role === 'doctor';
  const isDeveloper = currentUser?.role === 'developer';
  const isPatient = currentUser?.role === 'patient';

  const tabs = React.useMemo(() => {
    if (isDoctor) {
      return [
        {
          id: 'doctors',
          label: language === 'np' ? 'क्लिनिकल लाम' : 'Queue & Rx',
          icon: Stethoscope
        },
        {
          id: 'xenon',
          label: 'Clinical AI',
          icon: Sparkles,
          isSpecial: true
        },
        {
          id: 'emergency',
          label: 'SOS 102',
          icon: PhoneCall,
          isEmergency: true
        }
      ];
    }

    if (isDeveloper) {
      return [
        {
          id: 'developer',
          label: 'Console',
          icon: Code
        },
        {
          id: 'xenon',
          label: 'AI Sandbox',
          icon: Sparkles,
          isSpecial: true
        },
        {
          id: 'emergency',
          label: 'SOS Monitor',
          icon: PhoneCall,
          isEmergency: true
        }
      ];
    }

    if (isPatient) {
      return [
        {
          id: 'dashboard',
          label: language === 'np' ? 'ड्यासबोर्ड' : 'Overview',
          icon: LayoutDashboard
        },
        {
          id: 'records',
          label: language === 'np' ? 'भाइटल' : 'Vitals & Rx',
          icon: Activity
        },
        {
          id: 'xenon',
          label: 'Xenon AI',
          icon: Sparkles,
          isSpecial: true
        },
        {
          id: 'book',
          label: language === 'np' ? 'डाक्टर' : 'Book OPD',
          icon: Stethoscope
        },
        {
          id: 'emergency',
          label: 'SOS 102',
          icon: PhoneCall,
          isEmergency: true
        }
      ];
    }

    // Guest
    return [
      {
        id: 'xenon',
        label: 'Xenon AI',
        icon: Sparkles,
        isSpecial: true
      },
      {
        id: 'emergency',
        label: 'SOS 102',
        icon: PhoneCall,
        isEmergency: true
      },
      {
        id: 'hospitals',
        label: language === 'np' ? 'अस्पताल' : 'Hospitals',
        icon: Building2
      }
    ];
  }, [isDoctor, isDeveloper, isPatient, language]);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 liquid-glass border-t border-white/60 dark:border-white/10 shadow-2xl transition-all w-full max-w-full pb-safe"
      style={{
        paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))'
      }}
    >
      <div className={`grid ${tabs.length === 3 ? 'grid-cols-3' : tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} items-center px-1 pt-1.5 h-16 max-w-md mx-auto`}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('medium');
                  onSelectTab(tab.id);
                }}
                className="relative -top-3 flex flex-col items-center justify-center group cursor-pointer focus:outline-none"
                title="Xenon AI Assistant"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-2 ring-slate-400'
                      : 'bg-slate-800 text-white shadow-md'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-slate-700 dark:text-slate-300">
                  {tab.label}
                </span>
              </button>
            );
          }

          if (tab.isEmergency) {
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('emergency');
                  onSelectTab(tab.id);
                }}
                className="flex flex-col items-center justify-center min-h-[44px] py-1 group cursor-pointer touch-target-mobile"
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-red-100 dark:bg-red-950 text-red-600' : 'text-red-500'}`}>
                  <PhoneCall className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold mt-0.5 text-red-600 dark:text-red-400">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                onSelectTab(tab.id);
              }}
              className="flex flex-col items-center justify-center min-h-[44px] py-1 group cursor-pointer touch-target-mobile"
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span
                className={`text-[10px] font-medium mt-0.5 truncate max-w-[64px] ${
                  isActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
