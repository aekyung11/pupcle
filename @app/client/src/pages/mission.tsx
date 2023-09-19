import { AuthRestrict, FourOhFour, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { Button } from "antd";
import { NextPage } from "next";
import { useRouter } from "next/router";
import * as React from "react";
import { useState } from "react";

enum Tab {
  WALK = "taking a walk",
  WATER = "replacing water",
  TEETH = "brushing pet's teeth",
  PET = "pet a pet",
  BATH = "bathing",
}

export function usePetId() {
  const router = useRouter();
  const { petId } = router.query;
  return String(petId);
}

const Mission: NextPage = () => {
  const query = useSharedQuery();
  const refetch = async () => query.refetch();
  const [selectedTab, setSelectedTab] = useState<Tab>();

  const currentUser = query.data?.currentUser;
  const currentUserId = currentUser?.id as string | undefined;
  const petId = usePetId();
  const currentPet = query.data?.currentUser?.pets.nodes.find(
    (p) => p.id === petId
  );

  if (query.loading) {
    return <p>Loading...</p>;
  }
  // if (!currentPet || !currentUser || !currentUserId) {
  //   return (
  //     <SharedLayout
  //       title="pup-notes"
  //       query={query}
  //       useLightBlueFrame
  //       forbidWhen={AuthRestrict.LOGGED_OUT}
  //     >
  //       <FourOhFour currentUser={query.data?.currentUser} />
  //     </SharedLayout>
  //   );
  // }

  return (
    <SharedLayout
      title="mission"
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
      query={query}
    >
      <div className="flex h-[calc(100vh-6rem)] w-full py-[60px]">
        <Tabs.Root
          value={selectedTab}
          onValueChange={(newValue) => {
            setSelectedTab(newValue as Tab);
          }}
          className="flex h-full w-full"
        >
          <div className="flex h-full w-1/2 items-center justify-end">
            <div className="flex h-full w-full max-w-[720px] items-center px-10">
              {selectedTab === undefined ? (
                <img src="/mission_dog.png" className="h-fit w-full" />
              ) : (
                <div className="h-full w-full rounded-[30px] bg-white px-[60px] pt-[60px] pb-[30px]">
                  <Tabs.Content
                    key={Tab.WALK}
                    value={Tab.WALK}
                    className="z-10 flex h-full w-full flex-col"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-poppins text-[40px] font-semibold text-black">
                        산책하기
                      </span>
                      <div className="flex flex-row items-center">
                        <span className="font-poppins text-[32px] font-medium text-black">
                          2&nbsp;
                        </span>
                        <img
                          src="/pupcle_count.png"
                          className="h-fit w-[29px]"
                        />
                      </div>
                    </div>
                    <span className="font-poppins text-pupcleGray text-[20px]">
                      19899명이 참여중
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
                          반려견에게 산책은 필수!
                          <br />내 소중한 반려견과 산책을 하고, 사진을 찍어
                          인증해주세요!
                          <br />
                          인증 완료시 2펍클 지급!
                        </span>
                      </div>
                      <span className="font-poppins text-pupcleBlue text-[25px] font-semibold">
                        키워드
                      </span>
                      <span className="font-poppins text-[20px]">
                        목줄, 야외
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
                          <Button className="bg-pupcleBlue flex h-[92px] w-full items-center justify-center rounded-full border-none">
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
                                  <Button className="bg-pupcleBlue flex h-[92px] w-full items-center justify-center rounded-full border-none">
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
                  </Tabs.Content>
                </div>
              )}
            </div>
          </div>
          <div className="z-0 flex h-[calc(100vh-6rem-60px)] w-1/2 justify-start">
            <Tabs.List className="w-full">
              <div className="scrollbar-show h-[calc(100%-60px)] w-full max-w-[720px] space-y-[30px] overflow-scroll px-10 pb-[20px]">
                <Tabs.Trigger key={Tab.WALK} value={Tab.WALK} asChild>
                  <Button className="mission-tab bg-pupcleMiddleBlue flex h-[160px] w-full items-center rounded-[30px] border-none px-[60px] drop-shadow-xl hover:contrast-[.8]">
                    <div className="flex w-1/2 flex-col items-start">
                      <span className="font-poppins text-[40px] font-semibold text-black">
                        산책하기
                      </span>
                      <span className="font-poppins text-[20px] text-black">
                        19899명이 참여중
                      </span>
                    </div>
                    <div className="flex w-1/2 flex-col items-end">
                      <div className="flex flex-row items-center">
                        <span className="font-poppins text-[32px] font-medium text-black">
                          2&nbsp;
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
                <Tabs.Trigger key={Tab.WATER} value={Tab.WATER} asChild>
                  <Button className="mission-tab bg-pupcleMiddleBlue flex h-[160px] w-full items-center rounded-[30px] border-none px-[60px] drop-shadow-xl hover:contrast-[.8]">
                    <div className="flex w-1/2 flex-col items-start">
                      <span className="font-poppins text-[40px] font-semibold text-black">
                        물 갈아주기
                      </span>
                      <span className="font-poppins text-[20px] text-black">
                        19899명이 참여중
                      </span>
                    </div>
                    <div className="flex w-1/2 flex-col items-end">
                      <div className="flex flex-row items-center">
                        <span className="font-poppins text-[32px] font-medium text-black">
                          2&nbsp;
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
                <Tabs.Trigger key={Tab.PET} value={Tab.PET} asChild>
                  <Button className="mission-tab bg-pupcleMiddleBlue flex h-[160px] w-full items-center rounded-[30px] border-none px-[60px] drop-shadow-xl hover:contrast-[.8]">
                    <div className="flex w-1/2 flex-col items-start">
                      <span className="font-poppins text-[40px] font-semibold text-black">
                        쓰다듬기
                      </span>
                      <span className="font-poppins text-[20px] text-black">
                        19899명이 참여중
                      </span>
                    </div>
                    <div className="flex w-1/2 flex-col items-end">
                      <div className="flex flex-row items-center">
                        <span className="font-poppins text-[32px] font-medium text-black">
                          2&nbsp;
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
                <Tabs.Trigger key={Tab.TEETH} value={Tab.TEETH} asChild>
                  <Button className="mission-tab bg-pupcleMiddleBlue flex h-[160px] w-full items-center rounded-[30px] border-none px-[60px] drop-shadow-xl hover:contrast-[.8]">
                    <div className="flex w-1/2 flex-col items-start">
                      <span className="font-poppins text-[40px] font-semibold text-black">
                        양치하기
                      </span>
                      <span className="font-poppins text-[20px] text-black">
                        19899명이 참여중
                      </span>
                    </div>
                    <div className="flex w-1/2 flex-col items-end">
                      <div className="flex flex-row items-center">
                        <span className="font-poppins text-[32px] font-medium text-black">
                          2&nbsp;
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
                <Tabs.Trigger key={Tab.BATH} value={Tab.BATH} asChild>
                  <Button className="mission-tab bg-pupcleMiddleBlue flex h-[160px] w-full items-center rounded-[30px] border-none px-[60px] drop-shadow-xl hover:contrast-[.8]">
                    <div className="flex w-1/2 flex-col items-start">
                      <span className="font-poppins text-[40px] font-semibold text-black">
                        목욕하기
                      </span>
                      <span className="font-poppins text-[20px] text-black">
                        19899명이 참여중
                      </span>
                    </div>
                    <div className="flex w-1/2 flex-col items-end">
                      <div className="flex flex-row items-center">
                        <span className="font-poppins text-[32px] font-medium text-black">
                          2&nbsp;
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
              </div>
            </Tabs.List>
          </div>
        </Tabs.Root>
      </div>
    </SharedLayout>
  );
};

export default Mission;
