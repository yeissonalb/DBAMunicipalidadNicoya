/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        muni: {
          black: '#171717',
          charcoal: '#171717',
          navy: '#0F172A',
          blue: '#1D4ED8',
          'blue-dark': '#1E3A8A',
          'blue-soft': '#EFF6FF',
          red: '#DC2626',
          'red-soft': '#FEF2F2',
          green: '#15803D',
          'green-soft': '#F0FDF4',
          border: '#D1D5DB',
          'card-border': '#E5E7EB',
          canvas: '#F8FAFC',
          surface: '#FFFFFF',
          muted: '#4B5563',
          /* Compatibilidad con referencias heredadas mapeadas a la nueva paleta azul/negro */
          greenDark: '#1E3A8A',
          emerald: '#1D4ED8',
          mint: '#EFF6FF',
          gold: '#1D4ED8',
          'gold-light': '#DBEAFE',
          sand: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        control: '10px',
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        elevated: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
