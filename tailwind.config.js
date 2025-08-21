/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict Black, Red, White theme
        'primary-black': '#000000',
        'primary-red': '#dc2626',
        'primary-white': '#ffffff',
        'red-dark': '#b91c1c',
        'red-light': '#ef4444',
        'black-90': 'rgba(0, 0, 0, 0.9)',
        'black-75': 'rgba(0, 0, 0, 0.75)',
        'black-50': 'rgba(0, 0, 0, 0.5)',
        'black-25': 'rgba(0, 0, 0, 0.25)',
        'black-10': 'rgba(0, 0, 0, 0.1)',
        'red-10': 'rgba(220, 38, 38, 0.1)',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.5px' }],
        'section': ['2rem', { lineHeight: '1.2' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'small': ['0.875rem', { lineHeight: '1.5' }],
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
