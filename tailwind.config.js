const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      primary: colors.amber[600],
      accent: colors.cyan[300],
      blue: {
        light: colors.sky[200],
      },
      gray: {
        dark: colors.stone[600],
        light: colors.stone[200],
      },
      black: colors.stone[900],
      white: colors.stone[50],
      percents: {
        1: colors.sky[200],
        2: colors.yellow[300],
        3: colors.green[300],
        4: colors.stone[200],
        5: colors.red[300],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
