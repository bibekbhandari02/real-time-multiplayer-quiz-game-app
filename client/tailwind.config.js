export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',      // Emerald green
        secondary: '#059669',    // Dark green
        accent: '#34d399',       // Light green
        dark: {
          900: '#0a0e27',        // Deep dark blue-black
          800: '#1a2332',        // Dark slate
          700: '#0f1419',        // Almost black
        },
        neon: {
          green: '#00ff88',      // Bright neon green
          cyan: '#00ffff',       // Neon cyan
        }
      }
    }
  },
  plugins: []
};
