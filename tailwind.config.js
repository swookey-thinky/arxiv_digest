import scrollbar from 'tailwind-scrollbar';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      maxHeight: {
        '280px': '280px', // ~5 items on mobile
        '400px': '400px', // ~10 items on desktop
      },
    },
  },
  plugins: [
    scrollbar({ nocompatible: true }),
  ],
};