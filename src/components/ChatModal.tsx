import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Building2, Phone, PhoneCall, Bot, UserCheck, ShieldCheck, MessageCircle, Globe, ExternalLink, WifiOff, Clock, Check } from 'lucide-react';
import { Hospital, ChatMessage, User } from '../types';
import { isAppOnline, queueMessageForSync } from '../services/syncService';

interface ChatModalProps {
  hospital: Hospital | null;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  hospital,
  currentUser,
  isOpen,
  onClose
}) => {
  if (!isOpen || !hospital) return null;

  const cleanPhone = hospital.phone.replace(/[^0-9+]/g, '');
  const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(`Hello ${hospital.name}, I am contacting you through XENON HEALTH regarding an inquiry.`)}`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'hospital',
      text: `Namaste! Thank you for contacting ${hospital.name}. How can our clinical team assist you today?`,
      time: '09:00 AM'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Listen for sync completion event to mark messages as synced
  useEffect(() => {
    const handleSyncCompleted = () => {
      setMessages((prev) =>
        prev.map((m) => (m.sender === 'user' ? { ...m, synced: true } : m))
      );
    };
    window.addEventListener('xenon_sync_completed', handleSyncCompleted);
    return () => {
      window.removeEventListener('xenon_sync_completed', handleSyncCompleted);
    };
  }, []);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isOnline = isAppOnline();

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'user',
      text,
      time: timeStr,
      synced: isOnline,
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      queued_at: !isOnline ? new Date().toISOString() : undefined
    };

    if (!isOnline) {
      queueMessageForSync(userMsg);
    } else {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMsg)
      }).catch((err) => {
        console.warn('Network issue during message send, adding to offline queue:', err);
        queueMessageForSync(userMsg);
      });
    }

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Auto-reply logic
    setTimeout(() => {
      let reply = `Thank you for your message. A patient care coordinator at ${hospital.name} will respond shortly. You can also call us directly at ${hospital.phone} or send a direct SMS.`;
      const lower = text.toLowerCase();

      if (lower.includes('emergency') || lower.includes('ambulance') || lower.includes('urgent') || lower.includes('sos')) {
        reply = `🚨 FOR IMMEDIATE EMERGENCIES: Please call our 24/7 emergency line directly at ${hospital.emergency} or dial toll-free 102. Our trauma team is on standby.`;
      } else if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
        reply = `To book an appointment at ${hospital.name}, you can use the 'Book Appointment' button on XENON HEALTH or visit our OPD counter during 9 AM - 5 PM (Sun-Fri).`;
      } else if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('fee')) {
        reply = `Our hospital features senior consultants across ${hospital.specialties.join(', ')}. Please check the Doctors directory in the app for availability and direct video consultation booking.`;
      }

      setMessages((prev) => [...prev, { sender: 'hospital', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setIsTyping(false);
    }, 1000);
  };

  const isOnline = isAppOnline();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg h-[88vh] sm:h-[640px] rounded-t-[32px] sm:rounded-[28px] bg-white dark:bg-[#0F172A] border-t sm:border border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 bg-white dark:bg-[#0F172A] text-black dark:text-white border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-red-600/20 border border-white/20 shrink-0">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm leading-tight text-black dark:text-white">{hospital.name}</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-black dark:text-white mt-0.5 font-medium opacity-80">
                📞 {hospital.phone} • 🚨 {hospital.emergency}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        {/* Directory Quick Bar: Native SMS & Official Website */}
        <div className="px-4 py-2 bg-[#F1F5F9]/80 dark:bg-[#1E293B]/80 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs">
          <a
            href={smsUri}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
            title="Open device Messages app to compose SMS to this hospital"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Open Device Messages (SMS)</span>
          </a>

          {hospital.website && (
            <a
              href={hospital.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-black/10 dark:border-white/10 text-[11px] font-bold transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Official Website</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          )}
        </div>

        {/* Offline notice bar if offline */}
        {!isOnline && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
            <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>Offline: Messages sent now will be cached and automatically pushed when reconnected.</span>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#F8FAFC] dark:bg-[#020617] space-y-3">
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            return (
              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-sm shadow-red-600/20 rounded-br-xs'
                      : 'bg-white dark:bg-[#1E293B] text-black dark:text-white border border-black/[0.08] dark:border-white/[0.08] rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-black dark:text-white opacity-70 font-medium">
                  <span>{m.time}</span>
                  {isUser && (
                    m.synced === false ? (
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold" title="Cached locally, waiting for background sync">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Queued</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-emerald-500" title="Synced with server database">
                        <Check className="w-2.5 h-2.5" />
                        <span>Synced</span>
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-black dark:text-white font-medium opacity-70">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Hospital care coordinator typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-white dark:bg-[#0F172A] border-t border-black/[0.08] dark:border-white/[0.08] flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleSend('What are your emergency department timings?')}
            className="px-3 py-1.5 rounded-full bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-black/10 dark:hover:bg-white/10 text-[11px] font-bold text-black dark:text-white border border-black/10 dark:border-white/10 whitespace-nowrap cursor-pointer transition-colors"
          >
            🚨 Emergency Timings
          </button>
          <button
            onClick={() => handleSend('How do I book a cardiology OPD appointment?')}
            className="px-3 py-1.5 rounded-full bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-black/10 dark:hover:bg-white/10 text-[11px] font-bold text-black dark:text-white border border-black/10 dark:border-white/10 whitespace-nowrap cursor-pointer transition-colors"
          >
            📅 OPD Booking
          </button>
          <button
            onClick={() => handleSend('Is ICU bed currently available?')}
            className="px-3 py-1.5 rounded-full bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-black/10 dark:hover:bg-white/10 text-[11px] font-bold text-black dark:text-white border border-black/10 dark:border-white/10 whitespace-nowrap cursor-pointer transition-colors"
          >
            🛏️ ICU Availability
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-[#0F172A] border-t border-black/[0.08] dark:border-white/[0.08] flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your healthcare inquiry..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2.5 rounded-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-red-600"
          />
          <button
            onClick={() => handleSend()}
            className="p-2.5 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
