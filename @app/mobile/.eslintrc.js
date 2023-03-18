// https://github.com/facebook/react-native/issues/28549#issuecomment-657249702
module.exports = {
  extends: `${__dirname}/../../.eslintrc.js`,
  settings: {
    "import/ignore": ["node_modules/react-native/index\\.js$"],
  },
};
