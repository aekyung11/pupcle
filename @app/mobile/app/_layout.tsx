import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { Provider } from "@app/cpapp/provider";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Stack, Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { TamaguiProvider } from "tamagui";

import config from "../tamagui.config";

export default function Root() {
  return (
    <TamaguiProvider className="bg-transparent" config={config}>
      <Provider>
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </Provider>
    </TamaguiProvider>
  );
}
