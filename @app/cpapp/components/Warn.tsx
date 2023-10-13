import { Text } from "@app/cpapp/design/typography";
import React from "react";

export interface WarnProps {
  children: React.ReactNode;
  okay?: boolean;
}

export function Warn({ children }: WarnProps) {
  return <Text>{children}</Text>;
}
