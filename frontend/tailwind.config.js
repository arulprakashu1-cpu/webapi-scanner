/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yellow: {
          400: '#FFE033',
          500: '#FFD600',
          600: '#E6C100',
        },
        dark: {
          50:  '#888888',
          100: '#444444',
          200: '#2A2A2A',
          300: '#222222',
          400: '#1A1A1A',
          500: '#141414',
          600: '#111111',
          700: '#0D0D0D',
          800: '#0A0A0A',
          900: '#050505',
        },
      },
      borderRadius: {
        xl:  '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'yellow': '0 0 20px rgba(255, 214, 0, 0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
