/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        card: '#111111',
        border: '#222222',
        accent: '#2563EB',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        cta: '8px',
      },
    },
  },
  plugins: [],
}
