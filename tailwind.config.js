/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf0e5',
          200: '#bce0cc',
          300: '#8dc9a8',
          400: '#5aab80',
          500: '#379061',
          600: '#26744d',
          700: '#1e6b4f',
          800: '#1a5440',
          900: '#164535',
          950: '#0a271c',
        },
        accent: {
          50: '#fef7ee',
          100: '#fdedd4',
          200: '#fad7a8',
          300: '#f6ba71',
          400: '#f19238',
          500: '#ed761c',
          600: '#de5c12',
          700: '#b84513',
          800: '#933817',
          900: '#783015',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
