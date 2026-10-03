import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../data/mockData';
import { triggerHaptic } from '../utils/haptics';

interface RecordsPrivacyLockProps {
  language: Language;
  onUnlock: () => void;
  isLocked: boolean;
  onLockToggle: (enabled: boolean) => void;
  showSettingsOnly?: boolean;
  onCloseSettingsOnly?: () => void;
}

export const RecordsPrivacyLock: React.FC<RecordsPrivacyLockProps> = ({
  language,
  onUnlock,
  isLocked,
  onLockToggle,
  showSettingsOnly = false,
  onCloseSettingsOnly
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shakeError, setShakeError] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Synchronize showSettingsOnly
  const isSettingsOpen = showSettingsOnly || showSettingsModal;
  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    if (onCloseSettingsOnly) {
      onCloseSettingsOnly();
    }
  };

  // Settings state
  const [storedPin, setStoredPin] = useState<string>(() => {
    return localStorage.getItem('telemed_privacy_pin') || '1234';
  });
  const [isLockEnabled, setIsLockEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('telemed_privacy_lock_enabled');
    return saved === null ? true : saved === 'true';
  });

  // PIN Change form state
  const [currentPinAttempt, setCurrentPinAttempt] = useState('');
  const [newPinAttempt, setNewPinAttempt] = useState('');
  const [confirmPinAttempt, setConfirmPinAttempt] = useState('');
  const [pinChangeStatus, setPinChangeStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg: string }>({
    type: 'idle',
    msg: ''
  });

  // Keyboard listener for PIN typing
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, pinInput, storedPin]);

  const handleDigitPress = (digit: string) => {
    triggerHaptic('light');
    setErrorMessage('');
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setErrorMessage('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    triggerHaptic('light');
    setErrorMessage('');
    setPinInput('');
  };

  const verifyPin = (candidatePin: string) => {
    if (candidatePin === storedPin) {
      triggerHaptic('success');
      setPinInput('');
      setErrorMessage('');
      onUnlock();
    } else {
      triggerHaptic('error');
      setErrorMessage(language === 'np' ? 'गलत गोप्य पिन नम्बर! पुन: प्रयास गर्नुहोस्।' : 'Incorrect Security PIN. Please try again.');
      setShakeError(true);
      setTimeout(() => {
        setShakeError(false);
        setPinInput('');
      }, 500);
    }
  };

  const handleSavePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinAttempt !== storedPin) {
      triggerHaptic('error');
      setPinChangeStatus({
        type: 'error',
        msg: language === 'np' ? 'हालको पिन मिलेन।' : 'Current PIN is incorrect.'
      });
      return;
    }

    if (newPinAttempt.length !== 4 || !/^\d{4}$/.test(newPinAttempt)) {
      triggerHaptic('warning');
      setPinChangeStatus({
        type: 'error',
        msg: language === 'np' ? 'नयाँ पिन ४ अंकको संख्या हुनुपर्छ।' : 'New PIN must be exactly 4 digits.'
      });
      return;
    }

    if (newPinAttempt !== confirmPinAttempt) {
      triggerHaptic('warning');
      setPinChangeStatus({
        type: 'error',
        msg: language === 'np' ? 'नयाँ पिन मेल खाएन।' : 'New PIN confirmation does not match.'
      });
      return;
    }

    triggerHaptic('success');
    localStorage.setItem('telemed_privacy_pin', newPinAttempt);
    setStoredPin(newPinAttempt);
    setCurrentPinAttempt('');
    setNewPinAttempt('');
    setConfirmPinAttempt('');
    setPinChangeStatus({
      type: 'success',
      msg: language === 'np' ? 'गोप्य पिन सफलतापूर्वक परिवर्तन भयो!' : 'Security PIN successfully updated!'
    });
  };

  const handleToggleLockSetting = (enabled: boolean) => {
    triggerHaptic('medium');
    setIsLockEnabled(enabled);
    localStorage.setItem('telemed_privacy_lock_enabled', String(enabled));
    onLockToggle(enabled);
  };

  // If Lock Screen is active
  if (isLocked) {
    return (
      <div className="w-full max-w-md mx-auto my-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl text-center space-y-6 animate-fade-in select-none">
        {/* Header Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Lock className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {language === 'np' ? 'सुरक्षित स्वास्थ्य रेकर्ड' : 'Protected Health Vault'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'np'
              ? 'गोपनीयताको लागि आफ्नो ४-अंकको सुरक्षा पिन प्रविष्ट गर्नुहोस्'
              : 'Enter your 4-digit security PIN to view medical records'}
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <div className={`flex justify-center items-center gap-3.5 my-4 ${shakeError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinInput.length > index;
            return (
              <div
                key={index}
                className={`w-4.5 h-4.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-600 scale-110 shadow-sm shadow-blue-500/40 ring-4 ring-blue-500/20'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-center gap-1.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-blue-500 active:text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xl font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100/60 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-blue-500 active:text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xl font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-100/60 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Delete
          </button>
        </div>

        {/* Demo Hint */}
        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <KeyRound className="w-3.5 h-3.5 text-blue-500" />
          <span>Default PIN: <strong className="text-slate-700 dark:text-slate-300 font-mono">1234</strong></span>
        </div>
      </div>
    );
  }

  // Settings Modal View
  if (isSettingsOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'np' ? 'गोपनीयता तथा पिन सेटिङ' : 'Privacy & Security PIN'}
              </h3>
            </div>
            <button
              onClick={handleCloseSettings}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toggle PIN Protection */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'np' ? 'पिन लक सक्रिय गर्नुहोस्' : 'Require PIN Protection'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'np' ? 'रेकर्ड हेर्नु अघि पिन सोध्ने' : 'Lock records when leaving the tab'}
              </p>
            </div>
            <button
              onClick={() => handleToggleLockSetting(!isLockEnabled)}
              className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                isLockEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                  isLockEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Change PIN Form */}
          <form onSubmit={handleSavePinChange} className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {language === 'np' ? 'पिन परिवर्तन गर्नुहोस्' : 'Change Security PIN'}
            </h4>

            <div>
              <label className="text-[11px] text-slate-500 font-medium">Current PIN</label>
              <input
                type="password"
                maxLength={4}
                value={currentPinAttempt}
                onChange={(e) => setCurrentPinAttempt(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPinAttempt}
                  onChange={(e) => setNewPinAttempt(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPinAttempt}
                  onChange={(e) => setConfirmPinAttempt(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {pinChangeStatus.msg && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                  pinChangeStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {pinChangeStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{pinChangeStatus.msg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Update PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
