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
  safelist: ["invisible", "hidden"],
  theme: {
    fontSize: {
      "pupcle-20px": "min(20px, 14px + 0.2vw)",
      "pupcle-24px": "min(24px, 2vw)",
      "pupcle-30px": "min(30px, 2.4vw)",
      "pupcle-48px": [
        "min(calc(16px + 2vw), 48px)",
        {
          letterSpacing: "1.5%",
          lineHeight: "0.96",
        },
      ],
    },
    fontFamily: {
      sans: '"DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      poppins: '"Poppins"',
    },
    fontWeight: {
      bold: 700,
      semibold: 600,
      medium: 500,
      light: 100,
    },
    extend: {
      colors: {
        "home-comment": "#615518",
        "lightblue-bg": "rgba(127, 179, 232, 0.1)",
        "friends-requests-bg": "#F2F7FD",
        pupcleOrange: "#FF9C06",
        pupcleBlue: "#7FB3E8",
        pupcleMiddleBlue: "#D9E8F8",
        pupcleLightBlue: "#F2F7FD",
        pupcleLightGray: "#D9D9D9",
        pupcleLightLightGray: "#F5F5F5",
        pupcleGray: "#8F9092",
        pupcleDarkBlue: "#B1C1D2",
        pupcleDisabled: "rgba(10, 10, 10, 0.25)",
      },
      dropShadow: {
        lg: "2px 3px 3px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  variants: {},
  plugins: [require("daisyui")],
};
