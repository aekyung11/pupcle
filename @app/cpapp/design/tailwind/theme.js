// @ts-check

/** @type {import('tailwindcss').Config['theme']} */

module.exports = {
  safelist: ["invisible", "hidden"],
  theme: {
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
};
