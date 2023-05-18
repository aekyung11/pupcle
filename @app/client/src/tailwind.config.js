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
    fontSize: {
      "pupcle-30px": "min(30px, 2.4vw)",
    },
    extend: {
      colors: {
        "home-comment": "#615518",
      },
    },
  },
  variants: {},
  plugins: [],
};
