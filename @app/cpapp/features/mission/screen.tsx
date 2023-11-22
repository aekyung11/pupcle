import { FourOhFour } from "@app/cpapp/components/FourOhFour";
import { Row } from "@app/cpapp/design/layout";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import {
  MissionsPage_MissionFragment,
  SharedLayout_UserFragment,
  useMissionsPageQuery,
  useSharedQuery,
} from "@app/graphql";
import defaultAvatar from "@app/server/public/default_avatar.png";
import hamburger from "@app/server/public/hamburger_blue.png";
import paw from "@app/server/public/paw_white.png";
import back from "@app/server/public/pup_notes_caret_icon.png";
import c from "@app/server/public/pupcle_count.png";
import stamp from "@app/server/public/stamp.png";
import { format } from "date-fns";
import { useFonts } from "expo-font";
import { ScrollView } from "moti";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useEffect, useState } from "react";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Button, Tabs, useTheme } from "tamagui";

type MissionTabContentProps = {
  mission: MissionsPage_MissionFragment;
  currentUser: SharedLayout_UserFragment;
};

const MissionTabContent: FC<MissionTabContentProps> = ({
  mission,
  currentUser,
}) => {
  const missionComplete = !!mission.missionParticipants.nodes.find(
    (mp) => mp.user?.id === currentUser.id
  );
  const otherParticipants = mission.missionParticipants.nodes.filter(
    (mp) => mp.user?.id !== currentUser.id
  );
  return (
    <Tabs.Content key={mission.id} value={mission.id}>
      {missionComplete && (
        <>
          <View className="absolute top-0 right-0 z-30 flex h-full w-full items-center justify-center">
            <StyledComponent
              component={SolitoImage}
              className="h-[200px] w-[200px]"
              src={stamp}
              alt=""
              // fill
            />
            <img src="/stamp.png" className="h-fit w-[90%]" />
          </View>
          <View className="absolute top-0 right-0 z-20 h-full w-full rounded-[30px] bg-black opacity-10"></View>
        </>
      )}
    </Tabs.Content>
  );
};

interface MissionScreenInnerProps {
  currentUser: SharedLayout_UserFragment;
  missions: MissionsPage_MissionFragment[];
  day: string;
}

const MissionScreenInner: FC<MissionScreenInnerProps> = ({
  currentUser,
  missions,
  day,
}) => {
  const router = useRouter();

  const [selectedMissionId, setSelectedMissionId] = useState<
    string | undefined
  >(undefined);

  const _handleTabChange = (value: string) => {
    setSelectedMissionId(value);
    // TODO: make mission id url work in mobile
    router.push(value);
  };

  // useEffect(() => {
  //   setSelectedMissionId(
  //     router.query.mission === undefined ? undefined : "" + router.query.mission
  //   );
  // }, [router.query.mission]);

  const selectedMission = missions.find((m) => m.id === selectedMissionId);
  const selectedMissionComplete =
    !!selectedMission?.missionParticipants.nodes.find(
      (mp) => mp.user?.id === currentUser.id
    );
  const selectedMissionOtherParticipants =
    selectedMission?.missionParticipants.nodes.filter(
      (mp) => mp.user?.id !== currentUser.id
    );

  return (
    <View className="flex h-full items-center bg-[#F2F7FD] px-5">
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
          <Text className="font-poppins text-[24px] font-semibold text-black">
            미션
          </Text>
        </View>
      </View>
      <View className="h-[86%] w-full">
        <StyledComponent
          component={Tabs}
          value={selectedMissionId}
          onValueChange={(value) => setSelectedMissionId(value)}
        >
          <View className="mt-[30px] h-[540px] w-full bg-transparent">
            <Tabs.List
              unstyled
              className="flex h-[540px] w-full flex-col justify-between"
            >
              <ScrollView className="h-full w-full">
                {selectedMissionId ? (
                  <>
                    <View className="h-[540px] w-full rounded-[20px] bg-[#D9E8F8] py-[25px] px-[30px]">
                      <ScrollView>
                        <View className="flex h-full w-full flex-col">
                          <View className="flex w-full flex-row items-center justify-between">
                            <View className="flex flex-row">
                              <Button
                                className="h-[14px] w-[14px] border-none bg-none p-0"
                                unstyled
                              >
                                <StyledComponent
                                  component={SolitoImage}
                                  // className="absolute top-[29px] right-[27px] h-[14px] w-[14px]"
                                  className="h-[14px] w-[14px] rotate-90"
                                  src={back}
                                  alt=""
                                  // fill
                                />
                              </Button>
                              <Text className="font-poppins text-[24px] font-semibold">
                                {selectedMission?.name}
                              </Text>
                            </View>

                            <View className="flex flex-row items-center">
                              <Text className="font-poppins text-[20px] font-medium">
                                {selectedMission?.reward}&nbsp;
                              </Text>
                              <StyledComponent
                                component={SolitoImage}
                                className="h-[20px] w-[20px]"
                                src={c}
                                alt=""
                                // fill
                              />
                            </View>
                          </View>
                          <Text className="font-poppins mt-2 text-[14px] text-[#8F9092]">
                            {selectedMission?.participantCount}명이 참여 중
                          </Text>
                          {selectedMissionOtherParticipants &&
                            selectedMissionOtherParticipants.length > 0 && (
                              <Text className="font-poppins text-[14px] text-[#8F9092]">
                                참여중인 펍친:&nbsp;
                                <View className="flex h-5 w-[68px] flex-row items-center justify-between">
                                  {selectedMissionOtherParticipants
                                    .slice(0, 3)
                                    .map((mp) => (
                                      <StyledComponent
                                        component={SolitoImage}
                                        key={mp.id}
                                        className="h-[20px] w-[20px]"
                                        src={
                                          mp.user?.avatarUrl ?? defaultAvatar
                                        }
                                        alt=""
                                        // fill
                                      />
                                    ))}
                                </View>
                                {selectedMissionOtherParticipants.length > 3 &&
                                  `&nbsp;외 ${
                                    selectedMissionOtherParticipants.length - 3
                                  }명`}
                              </Text>
                            )}
                          <View className="border-pupcleBlue my-5 h-fit w-full rounded-[20px] border-[3px] p-4">
                            <Text className="font-poppins whitespace-pre-line text-[14px]">
                              {selectedMission?.description}
                            </Text>
                          </View>
                          <Text className="font-poppins text-pupcleBlue mb-1 text-[16px] font-semibold">
                            키워드
                          </Text>
                          <Text className="font-poppins mb-5 text-[14px]">
                            {selectedMission?.keywords?.join(", ")}
                          </Text>
                          <Text className="font-poppins text-pupcleBlue mb-2 text-[16px] font-semibold">
                            인증방법
                          </Text>
                          <View className="mb-2 flex flex-row items-center">
                            <View className="flex h-[18px] w-[18px] flex-row items-center justify-center rounded-full border-[1px] border-black">
                              <Text className="font-poppinstext-[14px]">1</Text>
                            </View>
                            <Text className="font-poppins text-[14px]">
                              &nbsp;하단의 인증하기 버튼을 눌러주세요.
                            </Text>
                          </View>
                          <View className="mb-2 flex flex-row items-center">
                            <View className="flex h-[18px] w-[18px] flex-row items-center justify-center rounded-full border-[1px] border-black">
                              <Text className="font-poppinstext-[14px]">2</Text>
                            </View>
                            <Text className="font-poppins text-[14px]">
                              &nbsp;키워드가 포함된 인증 사진을 찍어주세요.
                            </Text>
                          </View>
                          <View className="mb-5 flex flex-row items-center">
                            <View className="flex h-[18px] w-[18px] flex-row items-center justify-center rounded-full border-[1px] border-black">
                              <Text className="font-poppinstext-[14px]">3</Text>
                            </View>
                            <Text className="font-poppins text-[14px]">
                              &nbsp;제출하기를 눌러 인증 완료를 해주세요.
                            </Text>
                          </View>
                          <Text className="font-poppins text-[12px] text-[#FF9C06]">
                            *리워드 지급은 최대 일주일정도 소요될 수 있습니다.
                          </Text>
                          <Button
                            className="bg-pupcleBlue mt-6 flex h-[60px] w-full flex-row items-center justify-center rounded-full border-none"
                            unstyled
                          >
                            <StyledComponent
                              component={SolitoImage}
                              className="h-[36px] w-[36px]"
                              src={paw}
                              alt=""
                              // fill
                            />
                            <Text className="font-poppins text-[24px] font-bold text-white">
                              &nbsp;&nbsp;인 증 하 기&nbsp;&nbsp;
                            </Text>
                            <StyledComponent
                              component={SolitoImage}
                              className="h-[36px] w-[36px]"
                              src={paw}
                              alt=""
                              // fill
                            />
                          </Button>
                        </View>
                      </ScrollView>
                    </View>
                  </>
                ) : (
                  <>
                    {missions.map((mission) => (
                      <Tabs.Tab
                        // paddingHorizontal={30}
                        padding={0}
                        // paddingVertical={20}
                        height={100}
                        // borderRadius={20}
                        marginBottom={10}
                        unstyled
                        // asChild
                        key={mission.id}
                        value={mission.id}
                      >
                        <View className="flex h-[100px] w-full flex-row items-center justify-between rounded-[20px] border-none bg-[#D9E8F8] px-[30px] py-5">
                          <View className="flex h-full w-[50%] flex-col items-start justify-around">
                            <Text className="font-poppins text-[24px] font-semibold text-black">
                              {mission.name}
                            </Text>
                            <Text className="font-poppins text-[12px] text-black">
                              {mission.participantCount}명이 참여중
                            </Text>
                          </View>
                          <View className="flex h-full w-[50%] flex-col items-end justify-around">
                            <View className="flex flex-row">
                              <Text className="font-poppins text-[20px] font-semibold text-black">
                                {mission.reward}&nbsp;
                              </Text>
                              <StyledComponent
                                component={SolitoImage}
                                className="h-[23px] w-[22px]"
                                src={c}
                                alt=""
                                // fill
                              />
                            </View>
                            <View className="flex h-5 w-[68px] flex-row items-center justify-between">
                              <StyledComponent
                                component={SolitoImage}
                                className="h-[20px] w-[20px]"
                                src={defaultAvatar}
                                alt=""
                                // fill
                              />
                              <StyledComponent
                                component={SolitoImage}
                                className="h-[20px] w-[20px]"
                                src={defaultAvatar}
                                alt=""
                                // fill
                              />
                              <StyledComponent
                                component={SolitoImage}
                                className="h-[20px] w-[20px]"
                                src={defaultAvatar}
                                alt=""
                                // fill
                              />
                            </View>
                          </View>
                        </View>
                      </Tabs.Tab>
                    ))}
                  </>
                )}
              </ScrollView>
            </Tabs.List>
            {missions.map((mission) => (
              <MissionTabContent
                key={mission.id}
                mission={mission}
                currentUser={currentUser}
              />
            ))}
          </View>
        </StyledComponent>
      </View>
    </View>
  );
};

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(format(new Date(), "yyyy-MM-dd")), []);
  return day;
};

export function MissionScreen() {
  const today = useToday();
  const query = useMissionsPageQuery({
    variables: { day: today || "2023-01-01" },
  });
  const currentUser = query.data?.currentUser;
  const missions = query.data?.missions?.nodes;

  if (query.loading) {
    return <Text>Loading...</Text>;
  }
  if (!currentUser || !missions || !today) {
    return (
      <SharedLayout
        title="mission"
        query={query}
        useLightBlueFrame
        forbidWhen={AuthRestrict.LOGGED_OUT}
      >
        <FourOhFour currentUser={query.data?.currentUser} />
      </SharedLayout>
    );
  }

  return (
    <SharedLayout
      title="mission"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <MissionScreenInner
          currentUser={currentUser}
          missions={missions}
          day={today}
        />
      )}
    </SharedLayout>
  );
}
