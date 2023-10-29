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
import home from "@app/server/public/calendar_day_home.png";
import homeSelected from "@app/server/public/calendar_day_home_selected.png";
import defaultAvatar from "@app/server/public/calendar_friends_avatar_default.png";
import caret from "@app/server/public/caret_icon_blk.png";
import hamburger from "@app/server/public/hamburger_blue.png";
import pupcleIcon from "@app/server/public/pupcle_count.png";
import { format } from "date-fns";
import { Field, Formik } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Button, Circle, Tabs, useTheme } from "tamagui";

interface CalendarScreenInnerProps {
  currentUser: SharedLayout_UserFragment;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
}

const CalendarScreenInner: FC<CalendarScreenInnerProps> = ({
  currentUser,
  privateRecord,
  sharedRecord,
  day,
  refetch,
  pet,
}) => {
  const currentUserFirstPet = currentUser.pets.nodes[0];

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
              13
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
          <Text>put calendar here</Text>
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
  useEffect(() => setDay(format(new Date(), "yyyy-MM-dd")), []);
  return day;
};

export function CalendarScreen() {
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

  return (
    <SharedLayout
      title="calendar"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && today && pet ? (
        <CalendarScreenInner
          currentUser={query.data?.currentUser}
          privateRecord={todayPrivateDailyRecord}
          sharedRecord={todaySharedDailyRecord}
          day={today}
          refetch={refetch}
          pet={pet}
        />
      ) : (
        <Text>loading...</Text>
      )}
    </SharedLayout>
  );
}
