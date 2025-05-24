module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber': {
          'primary': '#00ff9f',
          'secondary': '#ff00ff',
          'accent': '#00ffff',
          'dark': '#0a0a0f',
          'darker': '#050507',
          'light': '#1a1a2e',
          'lighter': '#2a2a3e',
          'neon': {
            'pink': '#ff00ff',
            'blue': '#00ffff',
            'green': '#00ff9f',
            'yellow': '#ffff00',
            'red': '#ff0000'
          }
        }
      },
      fontFamily: {
        'cyber': ['Orbitron', 'sans-serif'],
        'mono': ['Share Tech Mono', 'monospace']
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
        'pulse-neon': 'pulse-neon 1.5s ease-in-out infinite'
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #00ff9f, 0 0 10px #00ff9f, 0 0 15px #00ff9f' },
          '100%': { textShadow: '0 0 10px #00ff9f, 0 0 20px #00ff9f, 0 0 30px #00ff9f' }
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        }
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.cyber.primary), 0 0 20px theme(colors.cyber.primary)',
        'neon-pink': '0 0 5px theme(colors.cyber.neon.pink), 0 0 20px theme(colors.cyber.neon.pink)',
        'neon-blue': '0 0 5px theme(colors.cyber.neon.blue), 0 0 20px theme(colors.cyber.neon.blue)'
      }
    }
  },
  plugins: []
} 