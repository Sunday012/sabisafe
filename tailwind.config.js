/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f5ff',
          100: '#e8ebff',
          300: '#aeb8ff',
          500: '#6373e8',
          600: '#5362d8',
          700: '#444fc0',
          900: '#24295f',
        },
      },
      boxShadow: {
        glass: '0 18px 45px rgba(68, 79, 192, 0.22)',
      },
    },
  },
  plugins: [],
}
