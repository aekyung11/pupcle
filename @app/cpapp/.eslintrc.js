// https://github.com/facebook/react-native/issues/28549#issuecomment-657249702
module.exports = {
  extends: `${__dirname}/../../.eslintrc.js`,
  plugins: [
    "jest",
    "@typescript-eslint",
    "react-hooks",
    "react",
    "react-native",
    "graphql",
    "simple-import-sort",
    "import",
  ],
  settings: {
    "import/ignore": ["node_modules/react-native/index\\.js$"],
  },
};
