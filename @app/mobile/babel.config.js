const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxRuntime: "automatic" }],
      "@babel/preset-typescript",
    ],
    plugins: [
      [
        "inline-dotenv",
        {
          path: path.resolve(__dirname, "../../.env"),
        },
      ],
      "react-native-reanimated/plugin",
      "nativewind/babel",
      "expo-router/babel",
    ],
  };
};
