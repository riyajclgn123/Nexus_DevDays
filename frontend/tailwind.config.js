/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',   // enables dark: variants via .dark class on <html>
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#0B1628',
          2:       '#132040',
          3:       '#1C3060',
          4:       '#243870',
        },
        gold: {
          DEFAULT: '#C9A84C',
          2:       '#E8C96A',
          3:       '#F5E4A0',
          4:       '#FDF6DC',
        },
        teal: {
          DEFAULT: '#0D7377',
          2:       '#14A6AC',
          3:       '#7DDFE3',
          4:       '#E1F8F9',
        },
        slate: {
          brand:   '#8B9DB5',
          2:       '#C4CFE0',
          3:       '#EEF2F8',
        },
      },
      boxShadow: {
        'card':      '0 4px 24px rgba(0,0,0,0.08)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.30)',
        'modal':     '0 24px 80px rgba(0,0,0,0.18)',
        'glow-teal': '0 6px 20px rgba(13,115,119,0.30)',
        'glow-gold': '0 6px 20px rgba(201,168,76,0.35)',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        slideIn: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.35s ease both',
        'fade-in':   'fadeIn 0.25s ease both',
        'spin-slow': 'spin 0.8s linear infinite',
        'slide-in':  'slideIn 0.3s ease both',
      },
    },
  },
  plugins: [],
}
