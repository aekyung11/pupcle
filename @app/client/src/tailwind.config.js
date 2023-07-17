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
      "pupcle-24px": "min(24px, 2vw)",
      "pupcle-30px": "min(30px, 2.4vw)",
    },
    extend: {
      colors: {
        "home-comment": "#615518",
        "lightblue-bg": "rgba(127, 179, 232, 0.1)",
        "friends-requests-bg": "#F2F7FD",
        pupcleOrange: "#FF9C06",
      },
    },
  },
  variants: {},
  plugins: [require("daisyui")],
};
