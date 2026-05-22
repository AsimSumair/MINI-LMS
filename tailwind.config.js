/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#1E293B',
        muted: '#94A3B8',
        danger: '#EF4444',
        success: '#22C55E',
      },
    },
  },
  plugins: [],
};