/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        sigemun: {
          navy: '#102A43',
          primary: '#1E5A9C',
          medium: '#3E8FD6',
          sky: '#BFE3FA',
          'sky-muted': '#E3F2FC',
          bg: '#F1F8FE',
          surface: '#F8FBFE',
          card: '#FFFFFF',
          text: '#243746',
          muted: '#526B7A',
          border: '#D9E6F2',
          'border-strong': '#B7CCE0',
          focus: '#3E8FD6',
          canvas: '#F1F8FE',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(16, 42, 67, 0.07), 0 1px 2px -1px rgba(30, 90, 156, 0.05)',
        elevated: '0 14px 30px -8px rgba(16, 42, 67, 0.16), 0 8px 14px -8px rgba(30, 90, 156, 0.10)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

