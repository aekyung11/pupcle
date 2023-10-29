import CustomInput from "@app/cpapp/components/CustomInput";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  DailyRecordStatus,
  HomePage_PetFragment,
  HomePage_PrivateDailyRecordFragment,
  HomePage_SharedDailyRecordFragment,
  PetGender,
  SharedLayout_UserFragment,
  useHomePageQuery,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import bad from "@app/server/public/bad_puppy.png";
import badChecked from "@app/server/public/bad_puppy_checked.png";
import bathroom from "@app/server/public/bathroom.png";
import c from "@app/server/public/c.png";
import cBathroomSelected from "@app/server/public/c_bathroom_selected.png";
import cDietSelected from "@app/server/public/c_diet_selected.png";
import cHealthSelected from "@app/server/public/c_health_selected.png";
import cPlaySelected from "@app/server/public/c_play_selected.png";
import cSleepSelected from "@app/server/public/c_sleep_selected.png";
import cWalkingSelected from "@app/server/public/c_walking_selected.png";
import cake from "@app/server/public/cake.png";
import check from "@app/server/public/checkbox.png";
import closeIcon from "@app/server/public/close_icon.png";
import diet from "@app/server/public/diet.png";
import femaleIcon from "@app/server/public/female_icon.png";
import good from "@app/server/public/good_puppy.png";
import goodChecked from "@app/server/public/good_puppy_checked.png";
import hamburgerWhite from "@app/server/public/hamburger_white.png";
import health from "@app/server/public/health.png";
import maleIcon from "@app/server/public/male_icon.png";
import petDefault from "@app/server/public/pet_default.png";
import play from "@app/server/public/play.png";
import caret from "@app/server/public/pup_notes_caret_icon.png";
import sleep from "@app/server/public/sleep.png";
import walking from "@app/server/public/walking.png";
import clsx from "clsx";
import { format } from "date-fns";
import { Field, Formik } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import {
  Avatar,
  Button,
  Dialog,
  RadioGroup,
  Select,
  Sheet,
  Tabs,
} from "tamagui";

enum Tab {
  SLEEP = "sleep",
  DIET = "diet",
  WALKING = "walking",
  PLAY = "play",
  BATHROOM = "bathroom",
  HEALTH = "health",
}

interface HomeScreenInnerProps {
  currentUser: SharedLayout_UserFragment;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
  selectedTab: Tab | undefined;
  setSelectedTab: React.Dispatch<React.SetStateAction<Tab | undefined>>;
}

const HomeScreenInner: FC<HomeScreenInnerProps> = ({
  currentUser,
  privateRecord,
  sharedRecord,
  day,
  refetch,
  pet,
  selectedTab,
  setSelectedTab,
}) => {
  const currentUserFirstPet = currentUser.pets.nodes[0];
  const [val, setVal] = useState(currentUserFirstPet.name);

  return (
    <View className="bg-pupcleBlue flex h-full items-center px-10">
      <View className="flex h-[15%] w-full flex-row items-end justify-between">
        <View>
          <StyledComponent
            component={SolitoImage}
            className="h-[46px] w-[44px]"
            src={hamburgerWhite}
            alt=""
            // fill
          />
        </View>
        <View>
          {currentUserFirstPet.avatarUrl ? (
            <Avatar circular size={46}>
              <Avatar.Image src={currentUserFirstPet.avatarUrl} />
            </Avatar>
          ) : (
            <StyledComponent
              component={SolitoImage}
              className="h-[46px] w-[46px]"
              src={petDefault}
              alt=""
              // fill
            />
          )}
        </View>
      </View>
      <View className="mt-[30px] h-[540px] w-full items-center justify-between rounded-[30px] bg-white px-5 py-[50px]">
        <View className="w-full items-center justify-center">
          <Select value={val} onValueChange={setVal}>
            <View className="relative flex w-full flex-row items-center justify-center">
              <View className="relative flex w-[117px] flex-row justify-center">
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="font-poppins max-w-[80px] text-[24px] font-semibold text-black"
                >
                  {currentUserFirstPet.name}
                </Text>
                <Text className="font-poppins text-[24px] font-semibold text-black">
                  {" "}
                  ·{" "}
                </Text>
                <StyledComponent
                  component={SolitoImage}
                  className="h-7 w-5"
                  src={
                    currentUserFirstPet.gender === PetGender.M
                      ? maleIcon
                      : femaleIcon
                  }
                  alt=""
                  // fill
                />
              </View>
            </View>
            <View className="absolute right-7 top-[10px]">
              <Select.Trigger unstyled asChild>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[9px] w-[13px]"
                  src={caret}
                  alt=""
                  // fill
                />
              </Select.Trigger>
            </View>
            <Select.Content></Select.Content>
          </Select>
          <View className="mt-[6px] flex h-[21px] flex-row items-center">
            <StyledComponent
              component={SolitoImage}
              className="h-[21px] w-[21px]"
              src={cake}
              alt=""
              // fill
            />
            <Text className="font-poppins mt-[6px] ml-[7px] text-[12px] text-black">
              {currentUserFirstPet.dob}
            </Text>
          </View>
          <View className="mt-[30px]">
            <Text className="text-center text-[16px] leading-5">
              {currentUserFirstPet.name}의 오늘은 어땠나요?
              {"\n"}
              아래 버튼을 눌러 기록해 보세요.
            </Text>
          </View>
        </View>
        <HomePageInner
          currentUser={currentUser}
          privateRecord={privateRecord}
          sharedRecord={sharedRecord}
          day={day}
          refetch={refetch}
          pet={pet}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      </View>
    </View>
  );
};

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(format(new Date(), "yyyy-MM-dd")), []);
  return day;
};

export function HomeScreen() {
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
      title="home"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && today && pet ? (
        <HomeScreenInner
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

interface HomePageInnerProps {
  currentUser: SharedLayout_UserFragment;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
  selectedTab: Tab | undefined;
  setSelectedTab: React.Dispatch<React.SetStateAction<Tab | undefined>>;
}

const HomePageInner: FC<HomePageInnerProps> = ({
  currentUser,
  privateRecord,
  sharedRecord,
  day,
  refetch,
  pet,
  selectedTab,
  setSelectedTab,
}) => {
  const completeStatusCount = sharedRecord?.completeStatusCount || 0;
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // const [open, setOpen] = useState(false);
  return (
    <View className="flex w-full items-center justify-center">
      <View className="relative h-[270px] w-[257.86px]">
        <StyledComponent
          style={{
            shadowColor: "black",
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 1,
          }}
          component={SolitoImage}
          className="h-[270px] w-[257.86px]"
          src={
            completeStatusCount > 5
              ? cHealthSelected
              : completeStatusCount > 4
              ? cBathroomSelected
              : completeStatusCount > 3
              ? cPlaySelected
              : completeStatusCount > 2
              ? cWalkingSelected
              : completeStatusCount > 1
              ? cDietSelected
              : completeStatusCount > 0
              ? cSleepSelected
              : c
          }
          alt=""
          // fill
        />
        {/* <Dialog
        modal
        onOpenChange={(open) => {
          setOpen(open);
        }}
        > */}
        {/* <Tabs
            flex={1}
            className="absolute h-[270px] w-[257.86px]"
            value={selectedTab}
            onValueChange={(value) => setSelectedTab(value as Tab)}
          > */}
        {/* <Tabs.List> */}

        {/* <Tabs.Tab value={Tab.SLEEP} key={Tab.SLEEP} asChild unstyled> */}
        {/* <Dialog.Trigger key={Tab.SLEEP} asChild> */}
        <Button
          key={Tab.SLEEP}
          className={clsx({ complete: completeStatusCount >= 1 })}
          unstyled
          asChild
          onClick={() => setModalOpen(true)}
        >
          <StyledComponent
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 2, height: 2 },
              shadowRadius: 1,
            }}
            component={SolitoImage}
            className="absolute bottom-[50%] left-[168px] h-[90px] w-[90px]"
            src={sleep}
            // src={petDefault}
            alt=""
            // fill
          />
        </Button>
        {/* </Dialog.Trigger> */}
        {/* <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content
              key={Tab.SLEEP}
              className="h-[300px] w-[200px] bg-white"
            >
              abc
            </Dialog.Content>
          </Dialog.Portal> */}
        {/* </Tabs.Tab> */}

        {/* <Tabs.Tab value={Tab.DIET} key={Tab.DIET} asChild unstyled> */}
        <Button
          key={Tab.DIET}
          className={clsx({ complete: completeStatusCount >= 2 })}
          disabled={completeStatusCount < 1}
          unstyled
          asChild
        >
          <StyledComponent
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 2, height: 2 },
              shadowRadius: 1,
            }}
            component={SolitoImage}
            className="absolute left-[90px] h-[90px] w-[90px]"
            src={diet}
            alt=""
            // fill
          />
        </Button>
        {/* </Tabs.Tab> */}
        {/* <Tabs.Tab value={Tab.WALKING} key={Tab.WALKING} asChild unstyled> */}
        <Button
          key={Tab.WALKING}
          className={clsx({ complete: completeStatusCount >= 3 })}
          disabled={completeStatusCount < 2}
          unstyled
          asChild
        >
          <StyledComponent
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 2, height: 2 },
              shadowRadius: 1,
            }}
            component={SolitoImage}
            className="absolute bottom-[50%] left-[12px] h-[90px] w-[90px]"
            src={walking}
            alt=""
            // fill
          />
        </Button>
        {/* </Tabs.Tab> */}
        {/* <Tabs.Tab value={Tab.PLAY} key={Tab.PLAY} asChild unstyled> */}
        <Button
          key={Tab.PLAY}
          className={clsx({ complete: completeStatusCount >= 4 })}
          disabled={completeStatusCount < 3}
          unstyled
          asChild
        >
          <StyledComponent
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 2, height: 2 },
              shadowRadius: 1,
            }}
            component={SolitoImage}
            className="absolute top-[50%] left-[12px] h-[90px] w-[90px]"
            src={play}
            alt=""
            // fill
          />
        </Button>
        {/* </Tabs.Tab> */}
        {/* <Tabs.Tab
                value={Tab.BATHROOM}
                key={Tab.BATHROOM}
                asChild
                unstyled
              > */}
        <Button
          key={Tab.BATHROOM}
          className={clsx({ complete: completeStatusCount >= 5 })}
          disabled={completeStatusCount < 4}
          unstyled
          asChild
        >
          <StyledComponent
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 2, height: 2 },
              shadowRadius: 1,
            }}
            component={SolitoImage}
            className="absolute bottom-0 left-[90px] h-[90px] w-[90px]"
            src={bathroom}
            alt=""
            // fill
          />
        </Button>
        {/* </Tabs.Tab> */}
        {/* <Tabs.Tab value={Tab.HEALTH} key={Tab.HEALTH} asChild unstyled> */}
        <Button
          key={Tab.HEALTH}
          className={clsx({ complete: completeStatusCount >= 6 })}
          disabled={completeStatusCount < 5}
          unstyled
          asChild
        >
          <StyledComponent
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 2, height: 2 },
              shadowRadius: 1,
            }}
            component={SolitoImage}
            className="absolute top-[50%] left-[168px] h-[90px] w-[90px]"
            src={health}
            alt=""
            // fill
          />
        </Button>
        {/* </Tabs.Tab> */}
        {/* </Tabs.List> */}
        {/* </Tabs> */}
        {/* </Dialog> */}
      </View>

      {/* modal */}
      {/* <View className="absolute -bottom-[50px] z-20 mx-[40px] flex h-[540px] w-full flex-col justify-between rounded-[30px] bg-white px-5 pb-5 pt-[50px]">
        <StyledComponent
          component={SolitoImage}
          className="absolute top-[29px] right-[27px] h-[14px] w-[14px]"
          src={closeIcon}
          alt=""
          // fill
        />
        <View>
          <Text className="font-poppins text-center text-[24px] font-semibold">
            {selectedTab === Tab.SLEEP
              ? "잠을 잘 잤나요?"
              : selectedTab === Tab.DIET
              ? "밥을 잘 먹었나요?"
              : selectedTab === Tab.WALKING
              ? "오늘 산책을 했나요?"
              : selectedTab === Tab.PLAY
              ? "오늘 잘 놀았나요?"
              : selectedTab === Tab.BATHROOM
              ? "화장실을 잘 갔나요?"
              : "오늘의 건강은 어떤가요?"}
          </Text>
          <Text className="font-poppins mt-3 text-center text-[12px] text-black">
            기록한 모든 내용은{"\n"}
            캘린더에서 확인할 수 있어요.
          </Text>
          <Text className="font-poppins my-6 text-center text-[16px] font-bold">
            상태를 선택해주세요.
          </Text>
          <View className="flex w-full flex-row justify-center">
            <RadioGroup className="flex h-[50px] w-[220px] flex-row justify-between">
              <RadioGroup.Item value={DailyRecordStatus.Good} unstyled>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[50px] w-[95.86px]"
                  src={good}
                  alt=""
                  // fill
                />
                <RadioGroup.Indicator className="absolute" unstyled>
                  <StyledComponent
                    component={SolitoImage}
                    className="h-[50px] w-[95.86px]"
                    src={goodChecked}
                    alt=""
                    // fill
                  />
                </RadioGroup.Indicator>
              </RadioGroup.Item>
              <RadioGroup.Item value={DailyRecordStatus.Bad} unstyled>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[50px] w-[95.86px]"
                  src={bad}
                  alt=""
                  // fill
                />
                <RadioGroup.Indicator className="absolute" unstyled>
                  <StyledComponent
                    component={SolitoImage}
                    className="h-[50px] w-[95.86px]"
                    src={badChecked}
                    alt=""
                    // fill
                  />
                </RadioGroup.Indicator>
              </RadioGroup.Item>
            </RadioGroup>
          </View>
          <Text className="font-poppins mt-10 text-center text-[16px] font-bold">
            자세한 설명을 적어보세요.
          </Text>
          <View className="mt-5 h-[140px] w-full rounded-[20px] bg-[#F5F5F5] px-4 py-5"></View>
        </View>

        <View className="flex w-full flex-row justify-end">
          <Button
            unstyled
            className="bg-pupcleBlue flex h-12 w-[100px] items-center justify-center rounded-full"
          >
            <Text className="font-poppins text-[16px] font-bold text-white">
              저장하기
            </Text>
          </Button>
        </View>
      </View> */}
    </View>
  );
};
