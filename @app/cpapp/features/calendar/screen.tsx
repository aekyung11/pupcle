import CustomInput from "@app/cpapp/components/CustomInput";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  DailyRecordDayStatus,
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
import blueFiveSixth from "@app/server/public/b_five_sixth.png";
import blueFourSixth from "@app/server/public/b_four_sixth.png";
import blueFull from "@app/server/public/b_full.png";
import blueOneSixth from "@app/server/public/b_one_sixth.png";
import blueThreeSixth from "@app/server/public/b_three_sixth.png";
import blueTwoSixth from "@app/server/public/b_two_sixth.png";
import home from "@app/server/public/calendar_day_home.png";
import homeSelected from "@app/server/public/calendar_day_home_selected.png";
import defaultAvatar from "@app/server/public/calendar_friends_avatar_default.png";
import none from "@app/server/public/calendar_none.png";
import caret from "@app/server/public/caret_icon_blk.png";
import hamburger from "@app/server/public/hamburger_blue.png";
import purpleFiveSixth from "@app/server/public/p_five_sixth.png";
import purpleFourSixth from "@app/server/public/p_four_sixth.png";
import purpleFull from "@app/server/public/p_full.png";
import purpleOneSixth from "@app/server/public/p_one_sixth.png";
import purpleThreeSixth from "@app/server/public/p_three_sixth.png";
import purpleTwoSixth from "@app/server/public/p_two_sixth.png";
import pupcleIcon from "@app/server/public/pupcle_count.png";
import redFiveSixth from "@app/server/public/r_five_sixth.png";
import redFourSixth from "@app/server/public/r_four_sixth.png";
import redFull from "@app/server/public/r_full.png";
import redOneSixth from "@app/server/public/r_one_sixth.png";
import redThreeSixth from "@app/server/public/r_three_sixth.png";
import redTwoSixth from "@app/server/public/r_two_sixth.png";
import clsx from "clsx";
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
import { Avatar, Button, Tabs, useTheme } from "tamagui";

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
      <View className="flex h-[14%] w-full flex-row items-end">
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
          {/* {currentUserFirstPet && ( */}
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="font-poppins w-[120px] text-center text-[24px] font-semibold text-black"
          >
            {selectedPet?.name}
          </Text>
          {/* )} */}
          {/* <View className="absolute right-[20%]">
            <StyledComponent
              component={SolitoImage}
              className="h-[9px] w-[13px]"
              src={caret}
              alt=""
              // fill
            />
          </View> */}
        </View>
      </View>
      <View className="h-[86%] w-full pb-[120px]">
        <ScrollView>
          <View className="flex flex-row items-center justify-end py-5">
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
              dayComponent={({ date, state }) => {
                if (!date) {
                  return null;
                }
                const sharedDailyRecord = sharedDailyRecords[date.dateString];
                const complete = sharedDailyRecord?.completeStatusCount;
                const completePercentage =
                  ((sharedDailyRecord?.completeStatusCount ?? 0) / 6) * 100;
                return (
                  <>
                    <Text
                      style={{
                        textAlign: "center",
                        color: state === "disabled" ? "gray" : "black",
                      }}
                    >
                      {date && date.day}
                    </Text>
                    <Button
                      unstyled
                      disabled={
                        selectedPetId !== currentUserFirstPet.id ||
                        !sharedDailyRecord
                      }
                      onPress={() => {
                        router.push(
                          `/calendar/pet/${selectedPet?.id}/day/${date.dateString}`
                        );
                      }}
                    >
                      <View className="mt-1 h-[25px] w-[25px]">
                        <StyledComponent
                          component={SolitoImage}
                          className="h-full w-full"
                          src={
                            DailyRecordDayStatus.AllGood ===
                            sharedDailyRecord?.dayStatus
                              ? complete === 1
                                ? blueOneSixth
                                : complete === 2
                                ? blueTwoSixth
                                : complete === 3
                                ? blueThreeSixth
                                : complete === 4
                                ? blueFourSixth
                                : complete === 5
                                ? blueFiveSixth
                                : blueFull
                              : DailyRecordDayStatus.Mixed ===
                                sharedDailyRecord?.dayStatus
                              ? complete === 1
                                ? purpleOneSixth
                                : complete === 2
                                ? purpleTwoSixth
                                : complete === 3
                                ? purpleThreeSixth
                                : complete === 4
                                ? purpleFourSixth
                                : complete === 5
                                ? purpleFiveSixth
                                : purpleFull
                              : DailyRecordDayStatus.AllBad ===
                                sharedDailyRecord?.dayStatus
                              ? complete === 1
                                ? redOneSixth
                                : complete === 2
                                ? redTwoSixth
                                : complete === 3
                                ? redThreeSixth
                                : complete === 4
                                ? redFourSixth
                                : complete === 5
                                ? redFiveSixth
                                : redFull
                              : none
                          }
                          alt=""
                          // fill
                        />
                      </View>
                      {/* <Text>{sharedDailyRecord?.dayStatus || ""}</Text> */}
                      {/* <Text>{completePercentage || ""}</Text> */}
                    </Button>
                  </>
                );
              }}
            />
          </View>
          <View className="bg-pupcleBlue mb-5 flex h-[60px] w-full flex-row items-center rounded-[10px] px-[10px]">
            <ScrollView horizontal>
              <View className="h-15 w-15 flex items-center justify-center">
                <Button
                  className={clsx(
                    "flex h-10 w-10 rounded-full border-none bg-transparent p-0",
                    { active: selectedPetId === currentUserFirstPet?.id }
                  )}
                  onPress={() => {
                    const currentUserFirstPetId = currentUserFirstPet?.id;
                    if (currentUserFirstPetId) {
                      setSelectedPetId(currentUserFirstPetId);
                    }
                  }}
                >
                  <StyledComponent
                    component={SolitoImage}
                    className="h-10 w-10"
                    src={
                      selectedPetId === currentUserFirstPet.id
                        ? homeSelected
                        : home
                    }
                    alt=""
                    // fill
                  />
                </Button>
              </View>
              {friendEdges?.map((edge) => (
                <View
                  key={edge.toUser?.id}
                  className="h-15 w-15 flex items-center justify-center pl-[10px]"
                >
                  {/* <Tabs.Tab value="friend1" unstyled asChild> */}
                  <Button
                    className={clsx(
                      "flex h-10 w-10 rounded-full border-none bg-transparent p-0",
                      { active: selectedPetId === currentUserFirstPet?.id }
                    )}
                    onPress={() => {
                      const friendFirstPetId = edge.toUser?.pets.nodes[0]?.id;
                      if (friendFirstPetId) {
                        setSelectedPetId(friendFirstPetId);
                      }
                    }}
                  >
                    <Avatar circular size={40}>
                      <Avatar.Image
                        src={edge.toUser?.avatarUrl || defaultAvatar}
                      />
                    </Avatar>
                    {/* <StyledComponent
                      component={SolitoImage}
                      className="h-7 w-7"
                      src={edge.toUser?.avatarUrl || defaultAvatar}
                      alt=""
                      // fill
                    /> */}
                  </Button>

                  {/* </Tabs.Tab> */}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
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
