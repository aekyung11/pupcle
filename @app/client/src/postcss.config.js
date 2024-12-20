module.exports = {
  plugins:
    process.env.NODE_ENV !== "development"
      ? [
          "postcss-flexbugs-fixes",
          [
            "postcss-preset-env",
            {
              autoprefixer: {
                flexbox: "no-2009",
              },
              stage: 3,
              features: {
                "custom-properties": false,
              },
            },
          ],
          ["tailwindcss", { config: "tailwind.config.js" }],
          "autoprefixer",
        ]
      : [
          ["tailwindcss", { config: "../client/src/tailwind.config.js" }],
          "autoprefixer",
        ],
};
