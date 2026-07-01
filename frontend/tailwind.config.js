/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C3E50',
        background: '#F8F9FA',
        accent: '#C9A227',
      },
    },
  },
  plugins: [],
};

