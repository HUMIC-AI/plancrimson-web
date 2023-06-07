const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      yellow: colors.yellow[200],
      orange: colors.orange[300],
      pink: colors.rose[300],
      accent: colors.cyan[300],
      green: colors.green[300],
      blue: {
        light: colors.sky[200],
        dark: colors.blue[900],
        primary: 'rgb(var(--color-blue-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-blue-secondary) / <alpha-value>)',
      },
      gray: {
        dark: colors.stone[600],
        light: colors.stone[200],
        primary: 'rgb(var(--color-gray-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-gray-secondary) / <alpha-value>)',
      },
      red: colors.red[400],
      primary: 'rgb(var(--color-primary) / <alpha-value>)',
      secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
      black: colors.stone[900],
      white: colors.stone[50],
      percents: {
        1: colors.sky[300],
        2: colors.emerald[300],
        3: colors.amber[300],
        4: colors.orange[300],
        5: colors.rose[300],
      },
      season: {
        spring: 'rgb(var(--color-season-spring) / <alpha-value>)',
        fall: 'rgb(var(--color-season-fall) / <alpha-value>)',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
