/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Twin Health uslubi: magenta asosiy + teal ikkilamchi
        brand: {
          DEFAULT: '#B42475', hover: '#96205F',
          50: '#fdf2f8', 100: '#fce7f3', 600: '#B42475', 700: '#96205F',
        },
        teal: { DEFAULT: '#117E96', hover: '#0E6A7E' },
        plum: '#373049',
        ink: '#1B2B3A',
        zone: { red: '#DC2626', amber: '#D97706', green: '#16A34A' },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
