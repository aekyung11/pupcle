import CustomInput from "@app/cpapp/components/CustomInput";
import { FourOhFour } from "@app/cpapp/components/FourOhFour";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  CalendarRecords_PrivateDailyRecordFragment,
  DailyRecordStatus,
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
import blueCaret from "@app/server/public/blue_caret.png";
import calendar from "@app/server/public/calendar_blk.png";
import logo from "@app/server/public/logo.png";
import { format, parseISO } from "date-fns";
import { Field, Formik } from "formik";
import { ScrollView } from "moti";
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
  status: DailyRecordStatus;
}

const CalendarPetDayScreenInner: FC<CalendarPetDayScreenInnerProps> = ({
  privateDailyRecord,
  status,
}) => {
  return (
    <View className="">
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
        <View className="flex h-full w-full flex-col bg-[#F2F7FD] px-5">
          <View className="flex h-[15%] w-full flex-row items-end justify-start">
            <View className="flex h-[45px] flex-row items-center">
              <Link href="/calendar">
                <StyledComponent
                  component={SolitoImage}
                  className="mr-10 h-[13px] w-[9px]"
                  src={blueCaret}
                  alt=""
                  // fill
                />
              </Link>

              <Text className="font-poppins text-[24px] font-semibold text-black">
                {pet.name}
              </Text>
              <View className="ml-2 mt-1 flex flex-row">
                <Text className="font-poppins text-[16px] font-semibold text-black">
                  {formattedDay}
                </Text>
                <StyledComponent
                  component={SolitoImage}
                  className="mt-[1px] ml-[2px] h-4 w-4"
                  src={calendar}
                  alt=""
                  // fill
                />
              </View>
            </View>
          </View>
          <View className="flex h-[85%] w-full flex-col justify-start px-5 pb-[140px] pt-5">
            <ScrollView>
              <View className="h-fit w-full rounded-[30px] bg-white p-5">
                <Text className="font-poppins text-[24px] font-semibold uppercase text-[#FF9C06]">
                  good
                </Text>
                <CalendarPetDayScreenInner
                  status={DailyRecordStatus.Good}
                  privateDailyRecord={dailyRecord}
                />
              </View>
              <View className="mt-5 h-fit w-full rounded-[30px] bg-white p-5">
                <Text className="font-poppins text-pupcleBlue text-[24px] font-semibold uppercase">
                  bad
                </Text>
                <CalendarPetDayScreenInner
                  status={DailyRecordStatus.Good}
                  privateDailyRecord={dailyRecord}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SharedLayout>
  );
}
