import CustomInput from "@app/cpapp/components/CustomInput";
import { FourOhFour } from "@app/cpapp/components/FourOhFour";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  CalendarRecords_PrivateDailyRecordFragment,
  HomePage_PetFragment,
  HomePage_PrivateDailyRecordFragment,
  HomePage_SharedDailyRecordFragment,
  SharedLayout_UserFragment,
  useCalendarPageQuery,
  useCalendarRecordsQuery,
  useHomePageQuery,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import fourOhFour from "@app/server/public/404_page.png";
import logo from "@app/server/public/logo.png";
import defaultAvatar from "@app/server/public/profile_default_avatar.png";
import pupcleIcon from "@app/server/public/pupcle_count.png";
import { format, parseISO } from "date-fns";
import { Field, Formik } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Button, Circle, Tooltip, useTheme } from "tamagui";

interface CalendarPetDayScreenInnerProps {
  privateDailyRecord: CalendarRecords_PrivateDailyRecordFragment;
}

const CalendarPetDayScreenInner: FC<CalendarPetDayScreenInnerProps> = ({
  privateDailyRecord,
}) => {
  return (
    <View className="h-full">
      <Text>{privateDailyRecord.sleepStatus}</Text>
      <Text>{privateDailyRecord.sleepComment}</Text>
    </View>
  );
};

type CalendarPetDayScreenParams = {
  petId?: string;
  day?: string;
};

export function CalendarPetDayScreen() {
  const query = useCalendarPageQuery();
  const { useParam } = createParam<CalendarPetDayScreenParams>();
  const [petId] = useParam("petId");
  const [day] = useParam("day");
  const formattedDay = format(parseISO(day ?? "2023-01-01"), "yyyy.MM.dd");

  const { data: calendarRecordsData, loading: calendarRecordsDataLoading } =
    useCalendarRecordsQuery({
      fetchPolicy: "network-only",
      variables: {
        petId: petId,
        start: day,
        end: day,
      },
    });
  const pet = calendarRecordsData?.pet;
  const dailyRecord = pet?.privateDailyRecords.nodes[0];

  return (
    <SharedLayout
      title="calendar-pet-day"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.loading || calendarRecordsDataLoading ? (
        <Text>loading...</Text>
      ) : !dailyRecord ? (
        <FourOhFour />
      ) : (
        <>
          <Text>{formattedDay}</Text>
          <CalendarPetDayScreenInner privateDailyRecord={dailyRecord} />
        </>
      )}
    </SharedLayout>
  );
}
