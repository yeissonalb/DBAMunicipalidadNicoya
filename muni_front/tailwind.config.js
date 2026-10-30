/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        sigemun: {
          green: '#164B35',
          'green-dark': '#0F3626',
          'green-light': '#1F6347',
          'green-muted': '#E8F0EC',
          gold: '#B6944A',
          'gold-dark': '#967736',
          'gold-light': '#D4B872',
          'gold-muted': '#FBF7EE',
          bg: '#F5F7F4',
          card: '#FFFFFF',
          text: '#26352D',
          muted: '#5A6B61',
          border: '#DCE3DE',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(22, 75, 53, 0.06), 0 1px 2px -1px rgba(22, 75, 53, 0.04)',
        elevated: '0 10px 25px -5px rgba(22, 75, 53, 0.08), 0 8px 10px -6px rgba(22, 75, 53, 0.04)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

