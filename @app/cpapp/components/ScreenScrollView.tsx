import React from "react";
import { Platform, ScrollView, View } from "react-native";

type Props = React.ComponentProps<typeof ScrollView> & {
  useWindowScrolling?: boolean;
};

export function ScreenScrollView({
  useWindowScrolling = true, // defaults to true
  ...props
}: Props) {
  const Component = Platform.select({
    web: useWindowScrolling
      ? (View as unknown as typeof ScrollView)
      : ScrollView,
    default: ScrollView,
  });

  return <Component {...props} />;
}