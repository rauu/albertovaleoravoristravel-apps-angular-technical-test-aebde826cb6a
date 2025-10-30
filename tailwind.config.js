/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'color-primary': '#003DA5',
        'color-primary-light': '#0052CC',
        'color-secondary': '#00D084',
        'color-accent': '#00C7B7',
        'color-danger': '#FF5757',
      },
    },
  },
  plugins: [],
}
