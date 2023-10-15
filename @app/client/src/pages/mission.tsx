import { AuthRestrict, SharedLayout } from "@app/components";
import {
  MissionsPage_MissionFragment,
  SharedLayout_UserFragment,
  useMissionsPageQuery,
  useSharedQuery,
} from "@app/graphql";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { Button } from "antd";
import { format } from "date-fns";
import { NextPage } from "next";
import { useRouter } from "next/router";
import * as React from "react";
import { FC, useEffect, useState } from "react";

// export function usePetId() {
//   const router = useRouter();
//   const { petId } = router.query;
//   return String(petId);
// }

interface MissionsPageInnerProps {
  currentUser: SharedLayout_UserFragment;
  missions: MissionsPage_MissionFragment[];
  day: string;
}

const MissionsPageInner: FC<MissionsPageInnerProps> = ({
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
    router.push({ query: { mission: value } });
  };

  useEffect(() => {
    setSelectedMissionId(
      router.query.mission === undefined ? undefined : "" + router.query.mission
    );
  }, [router.query.mission]);

  console.log({ selectedMissionId });

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full py-[60px]">
      <Tabs.Root
        value={selectedMissionId}
        onValueChange={handleTabChange}
        className="flex h-full w-full"
      >
        <div className="flex h-full w-1/2 items-center justify-end">
          <div className="flex h-full w-full max-w-[720px] items-center px-10">
            {selectedMissionId === undefined ? (
              <img src="/mission_dog.png" className="h-fit w-full" />
            ) : (
              <>
                {missions.map((mission) => (
                  <Tabs.Content
                    key={mission.id}
                    value={mission.id}
                    className="h-full w-full rounded-[30px] bg-white px-[60px] pt-[60px] pb-[30px]"
                  >
                    <div className="z-10 flex h-full w-full flex-col">
                      <div className="flex w-full items-center justify-between">
                        <span className="font-poppins text-[40px] font-semibold text-black">
                          {mission.name}
                        </span>
                        <div className="flex flex-row items-center">
                          <span className="font-poppins text-[32px] font-medium text-black">
                            {mission.reward}&nbsp;
                          </span>
                          <img
                            src="/pupcle_count.png"
                            className="h-fit w-[29px]"
                          />
                        </div>
                      </div>
                      <span className="font-poppins text-pupcleGray text-[20px]">
                        {mission.participantCount}명이 참여중
                      </span>
                      <span className="font-poppins text-pupcleGray mb-[40px] flex items-center text-[20px]">
                        참여중인 펍친:&nbsp;
                        <div className="flex w-[80px] flex-row justify-between">
                          <img src="/default_avatar.png" className="h-6 w-6" />
                          <img src="/default_avatar.png" className="h-6 w-6" />
                          <img src="/default_avatar.png" className="h-6 w-6" />
                        </div>
                        &nbsp;외 12명
                      </span>
                      <div className="flex h-[calc(100%-282px)] flex-col overflow-y-scroll">
                        <div className="border-pupcleBlue mb-[30px] h-fit w-full rounded-[30px] border-[3px] p-5">
                          <span className="font-poppins text-[20px]">
                            {mission.description}
                          </span>
                        </div>
                        <span className="font-poppins text-pupcleBlue text-[25px] font-semibold">
                          키워드
                        </span>
                        <span className="font-poppins text-[20px]">
                          {mission.keywords?.join(", ")}
                        </span>
                        <span className="font-poppins text-pupcleBlue mt-4 text-[25px] font-semibold">
                          인증방법
                        </span>
                        <span className="font-poppins flex items-center text-[20px]">
                          <div className="font-poppins flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1px] border-black text-[15px]">
                            1
                          </div>
                          &nbsp;하단의 인증하기 버튼을 눌러주세요.
                        </span>
                        <span className="font-poppins flex items-center text-[20px]">
                          <div className="font-poppins flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1px] border-black text-[15px]">
                            2
                          </div>
                          &nbsp;키워드가 포함된 인증 사진을 찍어주세요.
                        </span>
                        <span className="font-poppins flex items-center text-[20px]">
                          <div className="font-poppins flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1px] border-black text-[15px]">
                            3
                          </div>
                          &nbsp;제출하기를 눌러 인증 완료를 해주세요.
                        </span>
                        <span className="font-poppins text-pupcleOrange mt-4 font-[15px]">
                          *리워드 지급은 최대 일주일정도 소요될 수 있습니다.
                        </span>
                      </div>
                      <div className="mt-[30px] w-full">
                        <Dialog.Root>
                          <Dialog.Trigger asChild>
                            <Button className="mission-button bg-pupcleBlue flex h-[92px] w-full items-center justify-center rounded-full border-none">
                              <img
                                src="/paw_white.png"
                                className="h-fit w-[58px]"
                                alt=""
                              />
                              <span className="font-poppins text-[40px] font-semibold text-white">
                                &nbsp;&nbsp;인 증 하 기&nbsp;&nbsp;
                              </span>
                              <img
                                src="/paw_white.png"
                                className="h-fit w-[58px]"
                                alt=""
                              />
                            </Button>
                          </Dialog.Trigger>
                          <Dialog.Portal>
                            <Dialog.Overlay className="bg-pupcleLightBlue fixed inset-0 z-[-1]" />
                            <Dialog.Content asChild>
                              <div className="bg-pupcleMiddleBlue fixed top-[calc(6rem+60px)] left-[50%] z-0 ml-10 h-[calc(100vh-6rem-120px)] w-[calc(50vw-80px)] w-1/2 max-w-[640px] rounded-[30px] px-[60px] pt-[60px] pb-[30px]">
                                <div className="flex h-full w-full flex-col">
                                  <div className="flex h-[50%] w-full items-end justify-center">
                                    <Button className="flex h-[166px] w-[166px] items-center justify-center rounded-[30px] border-none bg-white">
                                      <img
                                        src="/camera_icon.png"
                                        className="h-[76px] w-fit"
                                      />
                                    </Button>
                                  </div>
                                  <div className="flex h-[50%] w-full flex-col justify-between">
                                    <div className="flex flex-col items-center">
                                      <Button className="bg-pupcleBlue mt-6 h-11 w-[166px] rounded-full border-none">
                                        <span className="font-poppins text-[20px] font-semibold text-white">
                                          재촬영하기
                                        </span>
                                      </Button>
                                      <span className="font-poppins text-pupcleOrange mt-4 font-[15px]">
                                        *제출한 사진은 수정이 불가능합니다.
                                      </span>
                                    </div>
                                    <Button className="mission-button bg-pupcleBlue flex h-[92px] w-full items-center justify-center rounded-full border-none">
                                      <img
                                        src="/paw_white.png"
                                        className="h-fit w-[58px]"
                                        alt=""
                                      />
                                      <span className="font-poppins text-[40px] font-semibold text-white">
                                        &nbsp;&nbsp;제 출 하 기&nbsp;&nbsp;
                                      </span>
                                      <img
                                        src="/paw_white.png"
                                        className="h-fit w-[58px]"
                                        alt=""
                                      />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Dialog.Content>
                          </Dialog.Portal>
                        </Dialog.Root>
                      </div>
                    </div>
                  </Tabs.Content>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="z-0 flex h-[calc(100vh-6rem-60px)] w-1/2 justify-start">
          <Tabs.List className="w-full">
            <div className="scrollbar-show h-[calc(100%-60px)] w-full max-w-[720px] space-y-[30px] overflow-scroll px-10 pb-[20px]">
              {missions.map((mission) => (
                <Tabs.Trigger key={mission.id} value={mission.id} asChild>
                  <Button className="mission-tab bg-pupcleMiddleBlue flex h-[160px] w-full items-center rounded-[30px] border-none px-[60px] drop-shadow-xl hover:contrast-[.8]">
                    <div className="flex w-1/2 flex-col items-start">
                      <span className="font-poppins text-[40px] font-semibold text-black">
                        {mission.name}
                      </span>
                      <span className="font-poppins text-[20px] text-black">
                        {mission.participantCount}명이 참여중
                      </span>
                    </div>
                    <div className="flex w-1/2 flex-col items-end">
                      <div className="flex flex-row items-center">
                        <span className="font-poppins text-[32px] font-medium text-black">
                          {mission.reward}&nbsp;
                        </span>
                        <img
                          src="/pupcle_count.png"
                          className="h-fit w-[29px]"
                        />
                      </div>
                      <div className="flex w-[80px] flex-row justify-between">
                        <img src="/default_avatar.png" className="h-6 w-6" />
                        <img src="/default_avatar.png" className="h-6 w-6" />
                        <img src="/default_avatar.png" className="h-6 w-6" />
                      </div>
                    </div>
                  </Button>
                </Tabs.Trigger>
              ))}
            </div>
          </Tabs.List>
        </div>
      </Tabs.Root>
    </div>
  );
};

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(format(new Date(), "yyyy-MM-dd")), []);
  return day;
};

const MissionsPage: NextPage = () => {
  const today = useToday();
  const query = useMissionsPageQuery({
    variables: { day: today || "2023-01-01" },
  });
  const currentUser = query.data?.currentUser;
  const missions = query.data?.missions?.nodes;

  return (
    <SharedLayout
      title="mission"
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
      query={query}
    >
      {currentUser && missions && today ? (
        <MissionsPageInner
          currentUser={currentUser}
          missions={missions}
          day={today}
        />
      ) : (
        <p>loading...</p>
      )}
    </SharedLayout>
  );
};

export default MissionsPage;
