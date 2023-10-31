import CustomInput from "@app/cpapp/components/CustomInput";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  FriendsAndPets_UserEdgeFragment,
  HomePage_PetFragment,
  HomePage_PrivateDailyRecordFragment,
  HomePage_SharedDailyRecordFragment,
  SharedLayout_PetFragment,
  SharedLayout_UserFragment,
  useCalendarPageQuery,
  useCalendarRecordsQuery,
  useFriendsAndPetsQuery,
  useHomePageQuery,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import home from "@app/server/public/calendar_day_home.png";
import homeSelected from "@app/server/public/calendar_day_home_selected.png";
import defaultAvatar from "@app/server/public/calendar_friends_avatar_default.png";
import caret from "@app/server/public/caret_icon_blk.png";
import hamburger from "@app/server/public/hamburger_blue.png";
import pupcleIcon from "@app/server/public/pupcle_count.png";
import { endOfMonth, format, isAfter, isBefore, startOfMonth } from "date-fns";
import { Field, Formik } from "formik";
import { keyBy } from "lodash";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Button, Circle, Tabs, useTheme } from "tamagui";

const pupcleBeginningStr = "2023-01-01";
const pupcleBeginningDate = startOfMonth(new Date("2023-01-01T14:00:00"));

interface CalendarScreenInnerProps {
  currentUserFirstPet: SharedLayout_PetFragment;
  friendEdges: FriendsAndPets_UserEdgeFragment[];
}

const CalendarScreenInner: FC<CalendarScreenInnerProps> = ({
  currentUserFirstPet,
  friendEdges,
}) => {
  const router = useRouter();

  const {
    // day: today,
    dayDate: todayDate,
    monthStart,
    setMonthStart,
    monthStartStr,
    setMonthStartStr,
    monthEnd,
    setMonthEnd,
    monthEndStr,
    setMonthEndStr,
  } = useToday();

  const [initialMonthStartStr, setInitialMonthStartStr] =
    useState(monthStartStr);
  useEffect(() => {
    if (monthStartStr !== null && initialMonthStartStr === null) {
      setInitialMonthStartStr(monthStartStr);
    }
  }, [initialMonthStartStr, monthStartStr]);

  const [selectedPetId, setSelectedPetId] = useState(
    currentUserFirstPet?.id as string | undefined
  );
  // TODO: use inner to ensure loaded state
  const selectedPetIdOrDefault = selectedPetId ?? currentUserFirstPet?.id;

  const { data: calendarRecordsData } = useCalendarRecordsQuery({
    fetchPolicy: "network-only",
    variables: {
      petId: selectedPetIdOrDefault,
      start: monthStart ?? "2023-01-01",
      end: monthEnd ?? "2023-01-31",
    },
  });
  const selectedPet = calendarRecordsData?.pet;
  const pupcleCount = selectedPet?.sharedDailyRecords.nodes.filter((sdr) => {
    return sdr.isComplete;
  }).length;

  const sharedDailyRecords = keyBy(
    selectedPet?.sharedDailyRecords.nodes,
    "day"
  );

  return (
    <View className="h-full bg-[#F2F7FD] px-5">
      <View className="flex h-[15%] w-full flex-row items-end">
        <View className="absolute left-5">
          <StyledComponent
            component={SolitoImage}
            className="h-[46px] w-[44px]"
            src={hamburger}
            alt=""
            // fill
          />
        </View>
        <View className="relative flex h-[46px] w-full flex-row items-center justify-center">
          {currentUserFirstPet && (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="font-poppins w-[120px] text-center text-[24px] font-semibold text-black"
            >
              {currentUserFirstPet.name}
            </Text>
          )}
          <View className="absolute right-[20%]">
            <StyledComponent
              component={SolitoImage}
              className="h-[9px] w-[13px]"
              src={caret}
              alt=""
              // fill
            />
          </View>
        </View>
      </View>
      <View className="h-[85%] w-full px-5 pb-[120px]">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center py-5">
            <Text className="font-poppins w-[fit] text-[24px] font-semibold text-black">
              Oct
            </Text>
            <StyledComponent
              component={SolitoImage}
              className="ml-2 mr-3 h-[9px] w-[13px]"
              src={caret}
              alt=""
              // fill
            />
            <Text className="font-poppins w-[fit] text-[24px] font-semibold text-black">
              2023
            </Text>
            <StyledComponent
              component={SolitoImage}
              className="ml-2 mr-3 h-[9px] w-[13px]"
              src={caret}
              alt=""
              // fill
            />
          </View>
          <View className="flex flex-row items-center">
            <Text className="font-poppins mr-1 w-[fit] text-[24px] font-semibold text-black">
              {pupcleCount}
            </Text>
            <StyledComponent
              component={SolitoImage}
              className="h-[21px] w-[22px]"
              src={pupcleIcon}
              alt=""
              // fill
            />
          </View>
        </View>
        <View className="mb-5 h-fit w-full rounded-[20px] bg-white p-5">
          <Calendar
            initialDate={initialMonthStartStr ?? "2023-01-01"}
            minDate={pupcleBeginningStr}
            firstDay={1}
            onMonthChange={(month) => {
              // TODO: use local date parsing
              const startOfMonthDate = startOfMonth(
                new Date(`${month.dateString}T14:00:00`)
              );
              setMonthStart(startOfMonthDate);
              setMonthStartStr(format(startOfMonthDate, "yyyy-MM-dd"));
              const endOfMonthDate = endOfMonth(
                new Date(`${month.dateString}T14:00:00`)
              );
              setMonthEnd(endOfMonthDate);
              setMonthEndStr(format(endOfMonthDate, "yyyy-MM-dd"));
            }}
            onPressArrowLeft={(subtractMonth) => {
              if (monthStart && !isAfter(monthStart, pupcleBeginningDate)) {
                return;
              }
              subtractMonth();
            }}
            disableArrowLeft={
              !!(monthStart && !isAfter(monthStart, pupcleBeginningDate))
            }
            // TODO: max year = today's year
            monthFormat={"MMM yyyy"}
            onDayPress={(day) => {
              router.push(
                `/calendar/pet/${selectedPet?.id}/day/${day.dateString}`
              );
            }}

            // TODO(now): day component

            // dayComponent={

            // }
          />
          <Link href="/calendar/pet/1234/day/5678">
            <Text>go to a day</Text>
          </Link>
        </View>
        <View className="bg-pupcleBlue flex h-12 w-full flex-row items-center rounded-[10px] px-[10px]">
          <ScrollView horizontal>
            <Tabs defaultValue={currentUserFirstPet.id}>
              <Tabs.List>
                <View className="mr-[5px] flex h-12 w-[38px] justify-center">
                  <Tabs.Tab value={currentUserFirstPet.id} unstyled asChild>
                    <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={home}
                      alt=""
                      // fill
                    />
                  </Tabs.Tab>
                </View>
                <View className="flex h-12 w-12 items-center justify-center">
                  <Tabs.Tab value="friend1" unstyled asChild>
                    <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={defaultAvatar}
                      alt=""
                      // fill
                    />
                  </Tabs.Tab>
                </View>
                <View className="flex h-12 w-12 items-center justify-center">
                  <Tabs.Tab value="friend1" unstyled asChild>
                    <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={defaultAvatar}
                      alt=""
                      // fill
                    />
                  </Tabs.Tab>
                </View>
                <View className="flex h-12 w-12 items-center justify-center">
                  <Tabs.Tab value="friend1" unstyled asChild>
                    <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={defaultAvatar}
                      alt=""
                      // fill
                    />
                  </Tabs.Tab>
                </View>
                <View className="flex h-12 w-12 items-center justify-center">
                  <Tabs.Tab value="friend1" unstyled asChild>
                    <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={defaultAvatar}
                      alt=""
                      // fill
                    />
                  </Tabs.Tab>
                </View>
                <View className="flex h-12 w-12 items-center justify-center">
                  <Tabs.Tab value="friend1" unstyled asChild>
                    <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={defaultAvatar}
                      alt=""
                      // fill
                    />
                  </Tabs.Tab>
                </View>
                <View className="flex h-12 w-12 items-center justify-center">
                  <Tabs.Tab value="friend1" unstyled asChild>
                    <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={defaultAvatar}
                      alt=""
                      // fill
                    />
                  </Tabs.Tab>
                </View>
              </Tabs.List>
            </Tabs>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  const [dayDate, setDayDate] = useState<Date | null>(null);
  const [monthStart, setMonthStart] = useState<Date | null>(null);
  const [monthEnd, setMonthEnd] = useState<Date | null>(null);

  // computed
  const [monthStartStr, setMonthStartStr] = useState<string | null>(null);
  const [monthEndStr, setMonthEndStr] = useState<string | null>(null);
  useEffect(() => {
    const date = new Date();
    const startOfMonthDate = startOfMonth(date);
    const endOfMonthDate = endOfMonth(date);
    setDay(format(date, "yyyy-MM-dd"));
    setDayDate(date);
    setMonthStart(startOfMonthDate);
    setMonthStartStr(format(startOfMonthDate, "yyyy-MM-dd"));
    setMonthEnd(endOfMonthDate);
    setMonthEndStr(format(endOfMonthDate, "yyyy-MM-dd"));
  }, []);
  return {
    day,
    dayDate,
    monthStart,
    setMonthStart,
    monthStartStr,
    setMonthStartStr,
    monthEnd,
    setMonthEnd,
    monthEndStr,
    setMonthEndStr,
  };
};

export function CalendarScreen() {
  const query = useCalendarPageQuery();
  const { data: friendsAndPetsData } = useFriendsAndPetsQuery();
  const friendEdges =
    friendsAndPetsData?.currentUser?.userEdgesByFromUserId.nodes;
  const currentUserFirstPet = query.data?.currentUser?.pets.nodes[0];

  return (
    <SharedLayout
      title="calendar"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {currentUserFirstPet && friendEdges ? (
        <CalendarScreenInner
          currentUserFirstPet={currentUserFirstPet}
          friendEdges={friendEdges}
        />
      ) : (
        <Text>loading...</Text>
      )}
    </SharedLayout>
  );
}
