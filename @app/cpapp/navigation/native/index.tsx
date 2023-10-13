import { CalendarScreen } from "@app/cpapp/features/calendar/screen";
import { IndexScreen } from "@app/cpapp/features/index/screen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

const Stack = createNativeStackNavigator<{
  index: undefined;
  calendar: undefined;
}>();

export function NativeNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="index"
        component={IndexScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="calendar"
        component={CalendarScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
