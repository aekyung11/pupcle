// @ts-check

const { theme } = require("@app/cpapp/design/tailwind/theme");

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./App.tsx", "../cpapp/**/*.{js,jsx,ts,tsx}"],
  theme: {
    ...theme,
  },
  plugins: [],
};
