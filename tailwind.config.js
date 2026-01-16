/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          900: '#312e81',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f8fafc',
          elevated: '#f1f5f9',
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
        'soft-lg': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
};
