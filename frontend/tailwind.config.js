/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'valorant-red': '#FF4655',
        'valorant-dark': '#0F1923',
        'valorant-dark-secondary': '#1C252E',
        'valorant-dark-tertiary': '#293641',
        'valorant-accent': '#FD4556',
        'valorant-light': '#ECE8E1',
        'valorant-gold': '#F4AA3A',
      },
      fontFamily: {
        'tungsten': ['Druk Wide', 'Impact', 'Arial Black', 'sans-serif'],
        'din': ['DIN Next', 'Arial', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #FF4655, 0 0 10px #FF4655' },
          '100%': { boxShadow: '0 0 10px #FF4655, 0 0 20px #FF4655, 0 0 30px #FF4655' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'valorant-gradient': 'linear-gradient(135deg, #0F1923 0%, #1C252E 50%, #0F1923 100%)',
      },
    },
  },
  plugins: [],
}
