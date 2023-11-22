const withEntitlementsPlist =
  require("@expo/config-plugins").withEntitlementsPlist;

const withRemoveiOSNotificationEntitlement = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults["aps-environment"];
    // mod.modResults = { ...mod.modResults, "aps-environment": undefined };
    return mod;
  });
};

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
  config.plugins = [
    ...(config.plugins || []),
    [withRemoveiOSNotificationEntitlement],
  ];
  return config;
};
