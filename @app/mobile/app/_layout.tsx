import { Provider } from "@app/cpapp/provider";
import { Stack } from "expo-router";
import React from "react";
import { TamaguiProvider } from "tamagui";

import config from "../tamagui.config";

export default function Root() {
  return (
    <TamaguiProvider config={config}>
      <Provider>
        <Stack />
      </Provider>
    </TamaguiProvider>
  );
}
