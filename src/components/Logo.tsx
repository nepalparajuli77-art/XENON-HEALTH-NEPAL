import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  showText = true,
  showBadge = true
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none whitespace-nowrap ${className}`}>
      {/* Modern Futuristic Xenon Medical Tech Icon */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-[1.5px] shadow-lg shadow-red-950/20 group cursor-pointer transition-transform duration-300 hover:scale-105 flex items-center justify-center"
      >
        {/* Outer glowing border ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-blue-600 opacity-90 transition-opacity group-hover:opacity-100" />

        {/* Inner Dark Surface */}
        <div className="relative w-full h-full rounded-[14px] bg-[#0A0F1D] flex items-center justify-center overflow-hidden">
          {/* Subtle dynamic ambient glow */}
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-500/30 blur-md pointer-events-none" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-red-500/30 blur-md pointer-events-none" />

          {/* SVG: Precision-engineered Xenon 'X' + Pulse Line + Cross */}
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[72%] h-[72%] drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)]"
          >
            {/* Primary Diagonal Blade (Crimson Red Gradient) */}
            <path
              d="M10 11C10 9.89543 10.8954 9 12 9H16.5C17.2956 9 18.0587 9.31607 18.6213 9.87868L37.1213 28.3787C37.6839 28.9413 38 29.7044 38 30.5V37C38 38.1046 37.1046 39 36 39H31.5C30.7044 39 29.9413 38.6839 29.3787 38.1213L10.8787 19.6213C10.3161 19.0587 10 18.2956 10 17.5V11Z"
              fill="url(#xenon-red-gradient)"
            />

            {/* Secondary Diagonal Blade (Royal Blue Gradient) */}
            <path
              d="M38 11C38 9.89543 37.1046 9 36 9H31.5C30.7044 9 29.9413 9.31607 29.3787 9.87868L10.8787 28.3787C10.3161 28.9413 10 29.7044 10 30.5V37C10 38.1046 10.8954 39 12 39H16.5C17.2956 39 18.0587 38.6839 18.6213 38.1213L37.1213 19.6213C37.6839 19.0587 38 18.2956 38 17.5V11Z"
              fill="url(#xenon-blue-gradient)"
              fillOpacity="0.9"
            />

            {/* Central Precision Cross / Node Core */}
            <circle cx="24" cy="24" r="5" fill="#0A0F1D" />
            <circle cx="24" cy="24" r="3.2" fill="url(#xenon-core-glow)" />

            {/* Dynamic ECG Health Pulse Wave overlay */}
            <path
              d="M11 24H18L21 16L27 32L30 24H37"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
            />

            {/* Linear Gradients */}
            <defs>
              <linearGradient id="xenon-red-gradient" x1="10" y1="9" x2="38" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F43F5E" />
                <stop offset="0.5" stopColor="#E11D48" />
                <stop offset="1" stopColor="#BE123C" />
              </linearGradient>
              <linearGradient id="xenon-blue-gradient" x1="38" y1="9" x2="10" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="0.5" stopColor="#2563EB" />
                <stop offset="1" stopColor="#1D4ED8" />
              </linearGradient>
              <radialGradient id="xenon-core-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 24) rotate(90) scale(3.5)">
                <stop stopColor="#38BDF8" />
                <stop offset="1" stopColor="#E11D48" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Text Identity */}
      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              XENON
            </span>
            <span className="font-extrabold text-lg tracking-tight text-red-600 dark:text-rose-500">
              HEALTH
            </span>
            {showBadge && (
              <span className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-xs uppercase leading-none">
                नेपाल
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase mt-0.5 hidden sm:block">
            AI Telemedicine Platform
          </span>
        </div>
      )}
    </div>
  );
};
