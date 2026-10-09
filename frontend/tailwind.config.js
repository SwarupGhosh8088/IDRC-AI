/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#09090B',
        surfaceSecondary: '#18181B',
        primary: '#27272A',
        textPrimary: '#FAFAFA',
        textSecondary: '#A1A1AA',
        success: '#3F3F46',
        warning: '#52525B',
        critical: '#71717A',
        borderSubtle: '#27272A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
