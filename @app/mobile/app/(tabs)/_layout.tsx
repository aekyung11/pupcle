import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarStyle: Platform.OS === "ios" && {
          backgroundColor: "white",
          height: 120,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        },
        headerShown: false,
      }}
      tabBar={(props) =>
        Platform.OS === "ios" ? (
          <BlurView
            style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
            intensity={0}
          >
            <BottomTabBar {...props} />
          </BlurView>
        ) : (
          <BottomTabBar {...props} />
        )
      }
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          href: "/",
          title: "",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                marginTop: 17,
                backgroundColor: "transparent",
              }}
            >
              {/* <TabBarIcon name="home" color={color} size={24} /> */}
              <Text style={{ marginTop: 5, fontSize: 10, opacity: 0.5 }}>
                Home
              </Text>
            </View>
          ),
        }}
      />
      {/* <Stack screenOptions={{ headerShown: false }} /> */}
    </Tabs>
  );
}
