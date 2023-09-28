import { Row } from "@app/cpapp/design/layout";
import { A, H1, P, Text, TextLink } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import React from "react";
import { MotiLink } from "solito/moti";
import { Button, useTheme } from "tamagui";

export function HomeScreen() {
  const theme = useTheme();
  return (
    <View className="flex-1 items-center justify-center p-3">
      <H1>Welcome to Solito.</H1>
      <View className="max-w-xl">
        <P className="text-center">
          Here is a basic starter to show you how you can navigate from one
          screen to another. This screen uses the same code on Next.js and React
          Native.
        </P>
        <P className="text-center">
          Solito is made by{" "}
          <A
            href="https://twitter.com/fernandotherojo"
            hrefAttrs={{
              target: "_blank",
              rel: "noreferrer",
            }}
          >
            Fernando Rojo
          </A>
          .
        </P>
        <P className="text-center">
          NativeWind is made by{" "}
          <A
            href="https://twitter.com/mark__lawlor"
            hrefAttrs={{
              target: "_blank",
              rel: "noreferrer",
            }}
          >
            Mark Lawlor
          </A>
          .
        </P>
      </View>
      <View className="h-[32px]" />
      <Row className="space-x-8">
        <TextLink href="/user/fernando">Regular Link</TextLink>
        <MotiLink
          href="/user/fernando"
          animate={({ hovered, pressed }) => {
            "worklet";

            return {
              scale: pressed ? 0.95 : hovered ? 1.1 : 1,
              rotateZ: pressed ? "0deg" : hovered ? "-3deg" : "0deg",
            };
          }}
          transition={{
            type: "timing",
            duration: 150,
          }}
        >
          <Text selectable={false} className="text-base font-bold">
            Moti Link
          </Text>
        </MotiLink>
      </Row>
      <Row className="space-x-8">
        <Button theme="light" size="$8">
          Hello world
        </Button>
      </Row>
    </View>
  );
}
