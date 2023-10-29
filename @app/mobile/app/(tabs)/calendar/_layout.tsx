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
        name="pet/[petId]/day/[day]"
      />
    </Stack>
  );
}
