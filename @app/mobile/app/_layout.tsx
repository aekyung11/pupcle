import { Provider } from "@app/cpapp/provider";
import { Stack } from "expo-router";
import React from "react";

export default function Root() {
  return (
    <Provider>
      <Stack />
    </Provider>
  );
}
