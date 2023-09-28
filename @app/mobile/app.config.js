export default ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === "staging") {
    config.ios.bundleIdentifier = "com.pupcle.mobile.staging";
    config.name = "PupCle Staging";
  } else if (process.env.EAS_BUILD_PROFILE === "development") {
    config.ios.bundleIdentifier = "com.pupcle.mobile.dev";
    config.name = "PupCle Dev";
  }
  config.extra = config.extra || {};
  config.extra.ROOT_URL = process.env.ROOT_URL;
  return config;
};
