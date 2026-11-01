/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./js/**/*.js"
  ],
  safelist: [
    'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
    'bg-emerald-600', 'bg-rose-600', 'bg-amber-600',
    'border-rose-600', 'border-amber-600', 'border-emerald-600',
    'ring-amber-400', 'ring-slate-900', 'dark:ring-white', 'scale-105',
    'ring-2'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        party: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        }
      }
    },
  },
  plugins: [],
}
