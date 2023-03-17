/** @type {import('tailwindcss').Config} */
const path = require("path");

module.exports = {
  content: [
    path.join(__dirname, "**", "*.{js,jsx,ts,tsx}"),
    path.join(
      __dirname,
      "..",
      "..",
      "components",
      "src",
      "**",
      "*.{js,jsx,ts,tsx}"
    ),
  ],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [],
};
