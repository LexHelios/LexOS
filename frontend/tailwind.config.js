/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cyber-pink': '#ff00c8',
        'cyber-cyan': '#00fff7',
        'cyber-purple': '#7d00ff',
        'cyber-yellow': '#ffe600',
        'cyber-bg': '#0f1021',
        'cyber-magenta': '#d726ff',
        'military-green': {
          light: '#00ff00',
          DEFAULT: '#00cc00',
          dark: '#006400',
        },
        'tactical-orange': '#ffae00',
        'hud-gray': '#23272e',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'tech': ['Share Tech Mono', 'monospace'],
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'scan': 'scan 2s linear infinite',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px, 0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px, 0) skew(0deg)' },
          '62%': { transform: 'translate(0, 0) skew(5deg)' },
        },
        scan: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(0, 255, 247, 0.4)' },
          '70%': { boxShadow: '0 0 0 20px rgba(0, 255, 247, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0, 255, 247, 0)' },
        },
      },
    },
  },
  plugins: [],
} 