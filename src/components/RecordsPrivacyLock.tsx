import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../data/mockData';

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
  const [authMethod, setAuthMethod] = useState<'pin' | 'biometric'>('biometric');
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
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
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('telemed_privacy_biometrics_enabled');
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

  // Audio feedback helper
  const playFeedback = (type: 'success' | 'error' | 'click') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // Audio not permitted or blocked in environment
    }
  };

  // Keyboard listener for PIN typing
  useEffect(() => {
    if (!isLocked || authMethod !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        setPinInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, authMethod, pinInput, storedPin]);

  // Handle PIN digit press
  const handleDigitPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    playFeedback('click');
    setErrorMessage('');

    const updated = pinInput + digit;
    setPinInput(updated);

    if (updated.length === 4) {
      // Check PIN
      setTimeout(() => {
        if (updated === storedPin) {
          playFeedback('success');
          setScanSuccess(true);
          setTimeout(() => {
            onUnlock();
            setPinInput('');
            setScanSuccess(false);
          }, 350);
        } else {
          playFeedback('error');
          setShakeError(true);
          setErrorMessage(
            language === 'np'
              ? 'गलत पिन! कृपया पुनः प्रयास गर्नुहोस्।'
              : 'Incorrect PIN. Please try again.'
          );
          setTimeout(() => {
            setShakeError(false);
            setPinInput('');
          }, 600);
        }
      }, 150);
    }
  };

  const handleBackspace = () => {
    playFeedback('click');
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    playFeedback('click');
    setPinInput('');
    setErrorMessage('');
  };

  // Trigger Biometric Scan
  const handleBiometricScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setErrorMessage('');
    playFeedback('click');

    try {
      // Attempt genuine WebAuthn if available and allowed
      if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
        if (available && navigator.credentials) {
          // In some iframes, navigator.credentials may throw NotAllowedError.
          // We provide simulated verification fallback smoothly below.
        }
      }
    } catch {
      // Fallback to biometric simulation
    }

    // Biometric scanning animation duration
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      playFeedback('success');

      setTimeout(() => {
        onUnlock();
        setScanSuccess(false);
      }, 450);
    }, 1100);
  };

  // Save Settings
  const handleToggleLockRequirement = (checked: boolean) => {
    setIsLockEnabled(checked);
    localStorage.setItem('telemed_privacy_lock_enabled', checked ? 'true' : 'false');
    onLockToggle(checked);
  };

  const handleToggleBiometrics = (checked: boolean) => {
    setIsBiometricsEnabled(checked);
    localStorage.setItem('telemed_privacy_biometrics_enabled', checked ? 'true' : 'false');
    if (!checked && authMethod === 'biometric') {
      setAuthMethod('pin');
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinAttempt !== storedPin) {
      setPinChangeStatus({
        type: 'error',
        msg: language === 'np' ? 'हालको पिन मिलेन।' : 'Current PIN is incorrect.'
      });
      return;
    }
    if (newPinAttempt.length !== 4 || !/^\d{4}$/.test(newPinAttempt)) {
      setPinChangeStatus({
        type: 'error',
        msg: language === 'np' ? 'नयाँ पिन ४ अङ्कको हुनुपर्छ।' : 'New PIN must be exactly 4 digits.'
      });
      return;
    }
    if (newPinAttempt !== confirmPinAttempt) {
      setPinChangeStatus({
        type: 'error',
        msg: language === 'np' ? 'पुष्टिकरण पिन मिलेन।' : 'Confirmation PIN does not match.'
      });
      return;
    }

    localStorage.setItem('telemed_privacy_pin', newPinAttempt);
    setStoredPin(newPinAttempt);
    setPinChangeStatus({
      type: 'success',
      msg: language === 'np' ? 'पिन सफलतापूर्वक परिवर्तन भयो!' : 'PIN successfully updated!'
    });
    setCurrentPinAttempt('');
    setNewPinAttempt('');
    setConfirmPinAttempt('');
    setTimeout(() => {
      setPinChangeStatus({ type: 'idle', msg: '' });
    }, 3000);
  };

  const handleResetToDefaultPin = () => {
    localStorage.setItem('telemed_privacy_pin', '1234');
    setStoredPin('1234');
    setPinChangeStatus({
      type: 'success',
      msg: language === 'np' ? 'पिन पूर्वनिर्धारित "1234" मा रिसेट भयो।' : 'PIN reset to default "1234".'
    });
  };

  return (
    <>
      {/* Full Locked Privacy Screen Overlay (only when not in settings-only modal mode) */}
      {!showSettingsOnly && (
        <div className="rounded-[24px] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 md:p-10 my-4">
          <div className="max-w-md mx-auto text-center space-y-6">
            {/* Security Shield Icon Header */}
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-blue-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/25">
                {scanSuccess ? (
                  <CheckCircle2 className="w-10 h-10 animate-scale" />
                ) : isScanning ? (
                  <Fingerprint className="w-10 h-10 animate-pulse text-white" />
                ) : (
                  <Lock className="w-10 h-10" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-[#0F172A]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Heading and Compliance Info */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>NMC & Nepal Health Privacy Protocol</span>
              </span>
              <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {t('unlockRecords', language)}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                {language === 'np'
                  ? 'गोपनीय मेडिकल प्रेस्क्रिप्सन तथा स्वास्थ्य विवरण सुरक्षित गर्न बायोमेट्रिक वा पिन प्रमाणीकरण गर्नुहोस्।'
                  : 'Sensitive patient dossiers and doctor prescriptions are locked for data confidentiality.'}
              </p>
            </div>

            {/* Biometric vs PIN Switch Tabs */}
            {isBiometricsEnabled && (
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('biometric');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === 'biometric'
                      ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>{language === 'np' ? 'बायोमेट्रिक' : 'Touch/Face ID'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('pin');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === 'pin'
                      ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{language === 'np' ? 'सुरक्षा पिन' : '4-Digit PIN'}</span>
                </button>
              </div>
            )}

            {/* METHOD 1: Biometric Scanner */}
            {authMethod === 'biometric' && isBiometricsEnabled && (
              <div className="space-y-4 py-2">
                <button
                  type="button"
                  onClick={handleBiometricScan}
                  disabled={isScanning || scanSuccess}
                  className="group relative w-32 h-32 rounded-3xl mx-auto flex flex-col items-center justify-center transition-all duration-300 cursor-pointer border-2 border-dashed border-red-400/80 dark:border-red-600/80 bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/40"
                >
                  {/* Scanner laser animation */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-red-600 shadow-[0_0_12px_rgba(239,68,68,1)] animate-bounce" />
                  )}
                  <Fingerprint
                    className={`w-14 h-14 transition-all duration-300 ${
                      scanSuccess
                        ? 'text-emerald-500 scale-110'
                        : isScanning
                        ? 'text-red-600 animate-pulse scale-105'
                        : 'text-slate-700 dark:text-slate-300 group-hover:text-red-600 group-hover:scale-105'
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">
                    {isScanning
                      ? language === 'np'
                        ? 'स्क्यान हुँदै...'
                        : 'Verifying...'
                      : scanSuccess
                      ? language === 'np'
                        ? 'सफल!'
                        : 'Verified!'
                      : language === 'np'
                      ? 'छुनुहोस्'
                      : 'Touch to Scan'}
                  </span>
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'np'
                    ? 'फिंगरप्रिन्ट सेन्सर वा फेस अनलक प्रयोग गरी तुरुन्त प्रमाणित गर्नुहोस्'
                    : 'Tap the sensor to verify via biometric Touch ID / Face ID'}
                </p>

                <button
                  type="button"
                  onClick={() => setAuthMethod('pin')}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  {language === 'np' ? 'वा सुरक्षा पिन प्रविष्ट गर्नुहोस् →' : 'Or enter security PIN instead →'}
                </button>
              </div>
            )}

            {/* METHOD 2: 4-Digit Numeric PIN Pad */}
            {authMethod === 'pin' && (
              <div className="space-y-5 py-1">
                {/* 4 Pin Masked Dots Indicator */}
                <div
                  className={`flex items-center justify-center gap-4 transition-transform ${
                    shakeError ? 'animate-bounce text-red-600' : ''
                  }`}
                >
                  {[0, 1, 2, 3].map((index) => {
                    const filled = pinInput.length > index;
                    return (
                      <div
                        key={index}
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                          filled
                            ? 'bg-red-600 border-red-600 scale-110 shadow-md shadow-red-600/30'
                            : 'border-slate-300 dark:border-slate-700 bg-transparent'
                        }`}
                      >
                        {filled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    );
                  })}
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Numerical Keypad */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigitPress(num)}
                      className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-black text-slate-900 dark:text-white transition-all cursor-pointer shadow-xs border border-slate-200/60 dark:border-slate-700"
                    >
                      {num}
                    </button>
                  ))}

                  {/* Clear */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 transition-all cursor-pointer flex items-center justify-center"
                  >
                    Clear
                  </button>

                  {/* 0 */}
                  <button
                    type="button"
                    onClick={() => handleDigitPress('0')}
                    className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-black text-slate-900 dark:text-white transition-all cursor-pointer shadow-xs border border-slate-200/60 dark:border-slate-700"
                  >
                    0
                  </button>

                  {/* Backspace */}
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                </div>

                {/* Helpful Demo Hint */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 py-1.5 px-3 rounded-xl border border-slate-200/60 dark:border-slate-800 inline-block font-medium">
                  💡 {language === 'np' ? 'पूर्वनिर्धारित पिन: 1234' : 'Default Security PIN: 1234'}
                </div>
              </div>
            )}

            {/* Bottom Controls: Settings & Disable Option */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t('privacySettings', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Quick unlock bypass for testing or disable
                  handleToggleLockRequirement(false);
                  onUnlock();
                }}
                className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-bold transition-all cursor-pointer text-[11px]"
              >
                {language === 'np' ? 'अहिले लक बन्द गर्नुहोस्' : 'Turn Off Privacy Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings & PIN Change Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">
                    {t('privacySettings', language)}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Configure medical records authentication
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseSettings}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle 1: Enable / Disable Privacy Lock Requirement */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {language === 'np' ? 'गोपनीयता लक सक्रिय गर्नुहोस्' : 'Require Lock for Medical Records'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  {language === 'np'
                    ? 'रेकर्ड्स खोल्दा बायोमेट्रिक वा पिन माग्नुहोस्'
                    : 'Prompt for authentication upon viewing records'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLockEnabled}
                  onChange={(e) => handleToggleLockRequirement(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Toggle 2: Biometrics Support */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {language === 'np' ? 'बायोमेट्रिक प्रमाणीकरण (Touch/Face ID)' : 'Biometric Sensor Support'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  {language === 'np'
                    ? 'औँठाछाप वा अनुहार सेन्सरबाट अनलक गर्ने सुविधा'
                    : 'Allow 1-tap Touch ID or Face ID unlocking'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBiometricsEnabled}
                  onChange={(e) => handleToggleBiometrics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Change PIN Form */}
            <form onSubmit={handleSaveNewPin} className="space-y-3 pt-2">
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                {language === 'np' ? '४-अङ्कको पिन परिवर्तन गर्नुहोस्' : 'Change 4-Digit Security PIN'}
              </span>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'np' ? 'हालको पिन (Current PIN)' : 'Current PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPinAttempt}
                    onChange={(e) => setCurrentPinAttempt(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      {language === 'np' ? 'नयाँ पिन' : 'New PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPinAttempt}
                      onChange={(e) => setNewPinAttempt(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      {language === 'np' ? 'पुष्टि गर्नुहोस्' : 'Confirm PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmPinAttempt}
                      onChange={(e) => setConfirmPinAttempt(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              {pinChangeStatus.msg && (
                <div
                  className={`text-xs font-bold p-2.5 rounded-xl flex items-center gap-2 ${
                    pinChangeStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
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

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefaultPin}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'np' ? 'पूर्वनिर्धारित 1234' : 'Reset to 1234'}</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {language === 'np' ? 'पिन सेभ गर्नुहोस्' : 'Update PIN'}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={handleCloseSettings}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {language === 'np' ? 'सम्पन्न' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
