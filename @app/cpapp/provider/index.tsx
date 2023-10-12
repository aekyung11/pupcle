import React from "react";

import { AuthProvider } from "../utils/auth.ios";
import { FederationProvider } from "../utils/FederationProvider.ios";
import { SafeArea } from "./safe-area";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FederationProvider>
        <SafeArea>{children}</SafeArea>
      </FederationProvider>
    </AuthProvider>
  );
}
