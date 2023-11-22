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

  const handleTabChange = (value: string) => {
    setSelectedMissionId(value);
    router.push(value);
  };

  // useEffect(() => {
  //   setSelectedMissionId(
  //     router.query.mission === undefined ? undefined : "" + router.query.mission
  //   );
  // }, [router.query.mission]);

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
        <Tabs>
          <View className="mt-[30px] h-[540px] w-full bg-transparent">
            <Tabs.List
              unstyled
              className="flex h-[540px] w-full flex-col justify-between"
            >
              <ScrollView>
                {missions.map((mission) => (
                  <Tabs.Tab
                    paddingHorizontal={30}
                    paddingVertical={20}
                    height={100}
                    borderRadius={20}
                    marginBottom={10}
                    unstyled
                    key={mission.id}
                    value={mission.id}
                    asChild
                  >
                    <Button
                      unstyled
                      className="flex h-full w-full flex-row items-center justify-between border-none bg-[#D9E8F8]"
                    >
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
                    </Button>
                  </Tabs.Tab>
                ))}
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
        </Tabs>
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
