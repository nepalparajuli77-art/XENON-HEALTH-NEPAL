import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck, MessageSquare, Volume2 } from 'lucide-react';
import { Appointment } from '../types';

interface VideoRoomModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoRoomModal: React.FC<VideoRoomModalProps> = ({
  appointment,
  isOpen,
  onClose
}) => {
  if (!isOpen || !appointment) return null;

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[620px] rounded-[28px] bg-white dark:bg-[#0F172A] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-black dark:text-white">
        {/* Top Video Header */}
        <div className="p-4 bg-white dark:bg-[#0F172A] border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-red-600/20 border border-white/20">
              👨‍⚕️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-black dark:text-white">{appointment.doctor_name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" /> Sandbox Simulation Mode
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 font-bold mt-0.5">
                {appointment.specialty} • {appointment.hospital}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-[#F8FAFC] dark:bg-[#1E293B] text-xs font-mono font-bold text-black dark:text-white border border-black/10 dark:border-white/10">
              ⏱️ {formatDuration(callDuration)}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>
        </div>

        {/* System Error / Sandbox Notice Alert Banner */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-semibold">
            <span>⚠️</span>
            <span>
              <b>System Notice:</b> Video calls are in preview sandbox mode. Live hospital teleconsult lines launch in official release.
            </span>
          </div>
        </div>

        {/* Video Canvas Stages */}
        <div className="flex-1 relative bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center p-6">
          {/* Doctor Video Main Feed */}
          <div className="w-full h-full rounded-[22px] bg-white dark:bg-[#0F172A] border border-black/[0.08] dark:border-white/[0.08] flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center text-4xl shadow-lg shadow-red-600/20 border-2 border-white/20">
              👨‍⚕️
            </div>
            <h4 className="mt-4 text-base font-black text-black dark:text-white">
              {appointment.doctor_name}
            </h4>
            <p className="text-xs text-black dark:text-white font-medium opacity-85 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected via Nepal Health Cloud (Kathmandu WebRTC Node)
            </p>

            {/* Self Video PIP Preview */}
            <div className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 shadow-lg flex flex-col items-center justify-center p-2">
              {cameraOn ? (
                <>
                  <div className="text-2xl">👤</div>
                  <span className="text-[10px] text-black dark:text-white font-semibold mt-1">
                    You ({appointment.patient_name})
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-black dark:text-white flex items-center gap-1 font-bold">
                  <VideoOff className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Camera Off
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Call Control Dock */}
        <div className="p-4 bg-white dark:bg-[#0F172A] border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center gap-3">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`p-3.5 rounded-full transition-all cursor-pointer border ${
              micOn 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}
            title={micOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setCameraOn(!cameraOn)}
            className={`p-3.5 rounded-full transition-all cursor-pointer border ${
              cameraOn 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}
            title={cameraOn ? "Turn off Video" : "Turn on Video"}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4 text-white" />
            <span>End Teleconsultation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
