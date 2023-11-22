import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import tabAccount from "@app/server/public/tab_account.png";
import tabCalendar from "@app/server/public/tab_calendar.png";
import tabHome from "@app/server/public/tab_home.png";
import tabMission from "@app/server/public/tab_mission.png";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="/home"
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
        name="home"
        options={{
          headerShown: false,
          title: "",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 17,
                backgroundColor: "transparent",
              }}
            >
              {/* <TabBarIcon name="home" color={color} size={24} /> */}
              <Image
                style={{ width: 34, height: 34 }}
                source={tabHome}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: "#8F9092",
                  fontWeight: 600,
                }}
              >
                HOME
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          headerShown: false,
          title: "",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                // justifyContent: "center",
                marginTop: 17,
                backgroundColor: "transparent",
              }}
            >
              {/* <TabBarIcon name="home" color={color} size={24} /> */}
              <Image
                style={{ width: 34, height: 34 }}
                source={tabCalendar}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: "#8F9092",
                  fontWeight: 600,
                }}
              >
                CALENDAR
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          headerShown: false,
          title: "",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                // justifyContent: "center",
                marginTop: 17,
                backgroundColor: "transparent",
              }}
            >
              {/* <TabBarIcon name="home" color={color} size={24} /> */}
              <Image
                style={{ width: 34, height: 34 }}
                source={tabAccount}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: "#8F9092",
                  fontWeight: 600,
                }}
              >
                ACCOUNT
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mission"
        options={{
          headerShown: false,
          title: "",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                // justifyContent: "center",
                marginTop: 17,
                backgroundColor: "transparent",
              }}
            >
              {/* <TabBarIcon name="home" color={color} size={24} /> */}
              <Image
                style={{ width: 34, height: 34 }}
                source={tabMission}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: "#8F9092",
                  fontWeight: 600,
                }}
              >
                MISSION
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
