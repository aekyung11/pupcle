// https://docs.expo.dev/guides/monorepos/#change-default-entrypoint

import "expo-dev-client";
import "expo/build/Expo.fx";

import { registerRootComponent } from "expo";
import { activateKeepAwakeAsync } from "expo-keep-awake";

import App from "./App";

if (__DEV__) {
  activateKeepAwakeAsync();
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
