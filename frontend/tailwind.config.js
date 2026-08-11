/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          50: '#f0fdfa', 100: '#ccfbf1', 600: '#0D9488', 700: '#0F766E',
        },
        zone: { red: '#DC2626', amber: '#D97706', green: '#16A34A' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
