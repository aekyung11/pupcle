import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import tabAccount from "@app/server/public/tab_account.png";
import tabAccountFocused from "@app/server/public/tab_account_focused.png";
import tabCalendar from "@app/server/public/tab_calendar.png";
import tabCalendarFocused from "@app/server/public/tab_calendar_focused.png";
import tabHome from "@app/server/public/tab_home.png";
import tabHomeFocused from "@app/server/public/tab_home_focused.png";
import tabMission from "@app/server/public/tab_mission.png";
import tabMissionFocused from "@app/server/public/tab_mission_focused.png";
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
          shadowColor: "black",
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8,
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
          tabBarIcon: ({ focused }) => (
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
                source={focused ? tabHomeFocused : tabHome}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: focused ? "#7FB3E8" : "#8F9092",
                  fontWeight: focused ? 700 : 600,
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
          tabBarIcon: ({ focused }) => (
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
                source={focused ? tabCalendarFocused : tabCalendar}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: focused ? "#7FB3E8" : "#8F9092",
                  fontWeight: focused ? 700 : 600,
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
          tabBarIcon: ({ focused }) => (
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
                source={focused ? tabAccountFocused : tabAccount}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: focused ? "#7FB3E8" : "#8F9092",
                  fontWeight: focused ? 700 : 600,
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
          tabBarIcon: ({ focused }) => (
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
                source={focused ? tabMissionFocused : tabMission}
                contentFit="contain"
              />
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 8,
                  color: focused ? "#7FB3E8" : "#8F9092",
                  fontWeight: focused ? 700 : 600,
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
