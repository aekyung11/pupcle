import { Stack } from "expo-router/stack";
import React from "react";
export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
        name="index"
      />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
        name="default-info/index"
      />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
        name="detailed-info/index"
      />
    </Stack>
  );
}
