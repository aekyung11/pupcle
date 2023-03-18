export default ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === "staging") {
    config.ios.bundleIdentifier = "my.project.here.mobile.staging";
    config.name = "My_Project_Here Staging";
  } else if (process.env.EAS_BUILD_PROFILE === "development") {
    config.ios.bundleIdentifier = "my.project.here.mobile.dev";
    config.name = "My_Project_Here Dev";
  }
  return config;
};
