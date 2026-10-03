import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          canvas: '#F8FAFC',
          card: '#FFFFFF',
          subtle: '#F1F5F9',
          border: 'rgba(0, 0, 0, 0.07)',
          'border-dark': 'rgba(255, 255, 255, 0.08)',
          text: '#0F172A',
          muted: '#64748B',
        },
      },
      boxShadow: {
        'apple-subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
        'apple-card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 12px 0 rgba(0, 0, 0, 0.03)',
        'apple-elevated': '0 8px 30px rgba(0, 0, 0, 0.06)',
        'apple-modal': '0 20px 50px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'apple-card': '1rem',
        'apple-pill': '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config;
