import {
  PrivateDailyRecordTab as Tab,
  usePrivateDailyRecordForm,
} from "@app/componentlib";
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
import React, { FC, useCallback, useEffect, useState } from "react";
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

type StatusTabProps = {
  tab: Tab;
  setSelectedTab: React.Dispatch<React.SetStateAction<Tab | "">>;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  userId: string;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
};

function StatusTab({
  tab,
  setSelectedTab,
  privateRecord,
  userId,
  day,
  refetch,
  pet,
}: StatusTabProps) {
  const postResult = useCallback(async () => {
    await refetch();
    setSelectedTab("");
  }, [refetch, setSelectedTab]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    usePrivateDailyRecordForm(
      userId,
      pet.id,
      day,
      tab,
      privateRecord,
      postResult
    );

  return (
    <View className="relative">
      <Button
        onPress={() => setSelectedTab("")}
        unstyled
        className="absolute -top-[20px] right-2"
      >
        <StyledComponent
          component={SolitoImage}
          // className="absolute top-[29px] right-[27px] h-[14px] w-[14px]"
          className="h-[14px] w-[14px]"
          src={closeIcon}
          alt=""
          // fill
        />
      </Button>
      <Formik
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, values, setFieldValue }) => (
          <>
            <View>
              <Text className="font-poppins text-center text-[24px] font-semibold">
                {tab === Tab.SLEEP
                  ? "잠을 잘 잤나요?"
                  : tab === Tab.DIET
                  ? "밥을 잘 먹었나요?"
                  : tab === Tab.WALKING
                  ? "오늘 산책을 했나요?"
                  : tab === Tab.PLAY
                  ? "오늘 잘 놀았나요?"
                  : tab === Tab.BATHROOM
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
                <RadioGroup
                  className="flex h-[50px] w-[220px] flex-row justify-between"
                  value={values.status}
                  onValueChange={(status) => setFieldValue("status", status)}
                >
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
              <Field
                inputClassName="mt-5 h-[140px] w-fit rounded-[20px] bg-[#F5F5F5] px-4 py-5"
                component={CustomInput}
                multiline={true}
                numberOfLines={6}
                name="comment"
                placeholder="내용을 입력하세요.&#13;&#10;입력하지 않아도 결과는 저장됩니다."
              />
            </View>

            <View className="mt-4 flex w-full flex-row justify-end">
              <Button
                unstyled
                className="bg-pupcleBlue flex h-12 w-[100px] items-center justify-center rounded-full"
                // @ts-ignore
                onPress={handleSubmit}
              >
                <Text className="font-poppins text-[16px] font-bold text-white">
                  저장하기
                </Text>
              </Button>
            </View>
          </>
        )}
      </Formik>
    </View>
  );
}

interface HomeScreenInnerProps {
  currentUser: SharedLayout_UserFragment;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
  selectedTab: Tab | "";
  setSelectedTab: React.Dispatch<React.SetStateAction<Tab | "">>;
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
      <StyledComponent
        component={Tabs}
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as Tab)}
        className="mt-[30px] flex h-[540px] w-full flex-col items-center justify-between rounded-[30px] bg-white px-5 py-[50px]"
      >
        {selectedTab ? (
          <>
            {Object.values(Tab).map((tab) => (
              <Tabs.Content value={tab} key={tab}>
                <StatusTab
                  tab={tab}
                  setSelectedTab={setSelectedTab}
                  privateRecord={privateRecord}
                  sharedRecord={sharedRecord}
                  userId={currentUser.id}
                  day={day}
                  refetch={refetch}
                  pet={pet}
                />
              </Tabs.Content>
            ))}
          </>
        ) : (
          <>
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
          </>
        )}
      </StyledComponent>
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
  const [selectedTab, setSelectedTab] = useState<Tab | "">("");

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
  selectedTab: Tab | "";
  setSelectedTab: React.Dispatch<React.SetStateAction<Tab | "">>;
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
        <Tabs.List unstyled>
          <Tabs.Tab
            style={{
              position: "absolute",
              left: 168,
              height: 90,
              width: 90,
              top: -135 - 90,
            }}
            value={Tab.SLEEP}
            key={Tab.SLEEP}
            unstyled
          >
            <StyledComponent
              style={{
                shadowColor: "black",
                shadowOpacity: 0.25,
                shadowOffset: { width: 2, height: 2 },
                shadowRadius: 1,
              }}
              component={SolitoImage}
              className={clsx({
                "hidden filter-none": completeStatusCount >= 1,
              })}
              src={sleep}
              // src={petDefault}
              alt=""
              fill
            />
          </Tabs.Tab>

          <Tabs.Tab
            style={{
              position: "absolute",
              left: 90,
              width: 90,
              height: 90,
              top: -270,
            }}
            value={Tab.DIET}
            key={Tab.DIET}
            unstyled
            disabled={completeStatusCount < 1}
          >
            <StyledComponent
              style={{
                shadowColor: "black",
                shadowOpacity: 0.25,
                shadowOffset: { width: 2, height: 2 },
                shadowRadius: 1,
              }}
              component={SolitoImage}
              className={clsx({
                "hidden filter-none": completeStatusCount >= 2,
              })}
              src={diet}
              alt=""
              fill
            />
          </Tabs.Tab>
          <Tabs.Tab
            style={{
              position: "absolute",
              left: 12,
              height: 90,
              width: 90,
              top: -135 - 90,
            }}
            value={Tab.WALKING}
            key={Tab.WALKING}
            unstyled
            disabled={completeStatusCount < 2}
          >
            <StyledComponent
              style={{
                shadowColor: "black",
                shadowOpacity: 0.25,
                shadowOffset: { width: 2, height: 2 },
                shadowRadius: 1,
              }}
              component={SolitoImage}
              className={clsx({
                "hidden filter-none": completeStatusCount >= 3,
              })}
              src={walking}
              alt=""
              fill
            />
          </Tabs.Tab>
          <Tabs.Tab
            style={{
              position: "absolute",
              left: 12,
              height: 90,
              width: 90,
              top: -135,
            }}
            value={Tab.PLAY}
            key={Tab.PLAY}
            unstyled
            disabled={completeStatusCount < 3}
          >
            <StyledComponent
              style={{
                shadowColor: "black",
                shadowOpacity: 0.25,
                shadowOffset: { width: 2, height: 2 },
                shadowRadius: 1,
              }}
              component={SolitoImage}
              className={clsx({
                "hidden filter-none": completeStatusCount >= 4,
              })}
              src={play}
              alt=""
              fill
            />
          </Tabs.Tab>
          <Tabs.Tab
            style={{
              position: "absolute",
              left: 90,
              height: 90,
              width: 90,
              top: -90,
            }}
            value={Tab.BATHROOM}
            key={Tab.BATHROOM}
            unstyled
            disabled={completeStatusCount < 4}
          >
            <StyledComponent
              style={{
                shadowColor: "black",
                shadowOpacity: 0.25,
                shadowOffset: { width: 2, height: 2 },
                shadowRadius: 1,
              }}
              component={SolitoImage}
              className={clsx({
                "hidden filter-none": completeStatusCount >= 5,
              })}
              src={bathroom}
              alt=""
              fill
            />
          </Tabs.Tab>
          <Tabs.Tab
            style={{
              position: "absolute",
              left: 168,
              height: 90,
              width: 90,
              top: -135,
            }}
            value={Tab.HEALTH}
            key={Tab.HEALTH}
            unstyled
            disabled={completeStatusCount < 5}
          >
            <StyledComponent
              style={{
                shadowColor: "black",
                shadowOpacity: 0.25,
                shadowOffset: { width: 2, height: 2 },
                shadowRadius: 1,
              }}
              component={SolitoImage}
              className={clsx({
                "hidden filter-none": completeStatusCount >= 6,
              })}
              src={health}
              alt=""
              fill
            />
          </Tabs.Tab>
        </Tabs.List>
      </View>
    </View>
  );
};
