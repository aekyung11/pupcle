import CustomInput from "@app/cpapp/components/CustomInput";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  HomePage_PetFragment,
  HomePage_PrivateDailyRecordFragment,
  HomePage_SharedDailyRecordFragment,
  SharedLayout_UserFragment,
  useHomePageQuery,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import fourOhFour from "@app/server/public/404_page.png";
import logo from "@app/server/public/logo.png";
import defaultAvatar from "@app/server/public/profile_default_avatar.png";
import pupcleIcon from "@app/server/public/pupcle_count.png";
import { format } from "date-fns";
import { Field, Formik } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Button, Circle, Tooltip, useTheme } from "tamagui";

enum Tab {
  SLEEP = "sleep",
  DIET = "diet",
  WALKING = "walking",
  PLAY = "play",
  BATHROOM = "bathroom",
  HEALTH = "health",
}

interface CalendarPetDayScreenInnerProps {
  currentUser: SharedLayout_UserFragment;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
  selectedTab: Tab | undefined;
  setSelectedTab: React.Dispatch<React.SetStateAction<Tab | undefined>>;
}

const CalendarPetDayScreenInner: FC<CalendarPetDayScreenInnerProps> = ({
  currentUser,
  privateRecord,
  sharedRecord,
  day,
  refetch,
  pet,
  selectedTab,
  setSelectedTab,
}) => {
  return (
    <View className="h-full">
      <Text>day</Text>
    </View>
  );
};

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(format(new Date(), "yyyy-MM-dd")), []);
  return day;
};

type CalendarPetDayScreenParams = {
  petId?: string;
  day?: string;
};

export function CalendarPetDayScreen() {
  const { useParam } = createParam<CalendarPetDayScreenParams>();
  const [todoPetId] = useParam("petId");
  const [todoDay] = useParam("day");

  const today = useToday();
  const query = useHomePageQuery({ variables: { day: today || "2023-01-01" } });
  const refetch = async () => query.refetch();
  const pet = query.data?.currentUser?.pets.nodes[0];
  const todayPrivateDailyRecord = pet?.privateDailyRecords.nodes.find(
    (record) => record.day === today
  );
  const todaySharedDailyRecord = pet?.sharedDailyRecords.nodes.find(
    (record) => record.day === today
  );
  const [selectedTab, setSelectedTab] = useState<Tab | undefined>();

  useEffect(() => {
    if (selectedTab === undefined) {
      const completeStatusCount =
        todaySharedDailyRecord?.completeStatusCount || 0;

      const initialTab =
        completeStatusCount === 0
          ? undefined
          : Object.values(Tab)[completeStatusCount - 1];

      setSelectedTab(initialTab);
    }
  }, [selectedTab, todaySharedDailyRecord]);

  return (
    <SharedLayout
      title="calendar"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <Text>
        TODO REMOVE {todoPetId} {todoDay}
      </Text>
      {query.data?.currentUser && today && pet ? (
        <CalendarPetDayScreenInner
          currentUser={query.data?.currentUser}
          privateRecord={todayPrivateDailyRecord}
          sharedRecord={todaySharedDailyRecord}
          day={today}
          refetch={refetch}
          pet={pet}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      ) : (
        <Text>loading...</Text>
      )}
    </SharedLayout>
  );
}
