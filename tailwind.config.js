module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  // eslint-disable-next-line global-require
  plugins: [require('@tailwindcss/line-clamp')],
};
