/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626', // Vibrant Corporate Red
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#45070A',
        },
        dark: {
          bg: '#1E1E24',
          surface: '#282832',
          card: '#22222C',
          border: '#3A3A48',
          input: '#1A1A22',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
