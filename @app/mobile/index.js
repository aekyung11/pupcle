// https://docs.expo.dev/guides/monorepos/#change-default-entrypoint

import "expo-dev-client";
import "expo/build/Expo.fx";

import { activateKeepAwakeAsync } from "expo-keep-awake";
import React from "react";

if (__DEV__) {
  activateKeepAwakeAsync();
}

import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
