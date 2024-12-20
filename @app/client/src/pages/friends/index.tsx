import { AuthRestrict, FourOhFour, Link, SharedLayout } from "@app/components";
import {
  FriendsPage_MissionFragment,
  Friends_UserEdgeFragment,
  Received_MissionInviteFragment,
  Sent_MissionInviteFragment,
  SharedLayout_UserFragment,
  useAcceptFriendRequestMutation,
  useCreateFriendRequestMutation,
  useDeleteFriendRequestMutation,
  useFriendsPageQuery,
  useFriendsQuery,
  useReceivedFriendRequestsQuery,
  useSentFriendRequestsQuery,
  useUnfriendMutation,
  useUserSearchQuery,
} from "@app/graphql";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import { Alert, Button, Input, Spin } from "antd";
import clsx from "clsx";
import { format } from "date-fns";
import { keyBy } from "lodash";
import { NextPage } from "next";
import * as React from "react";
import { FC, useEffect, useState } from "react";
import { Formik } from "formik";
import { Form, SubmitButton } from "formik-antd";
import { extractError, getCodeFromError } from "@app/lib";
import { useMissionInviteForm } from "@app/componentlib";
import { useRouter } from "next/router";

enum Tab {
  FRIENDS = "friends",
  MISSIONS = "missions",
}

type UserSearchBoxProps = {
  currentUserId: string | undefined;
  onShowResultChange: (showResult: boolean) => void;
  friends: Friends_UserEdgeFragment[] | undefined;
};

function UserSearchBox({
  currentUserId,
  onShowResultChange,
  friends,
}: UserSearchBoxProps) {
  const [term, setTerm] = useState("");
  const { refetch: friendsRefetch } = useFriendsQuery();
  const { data: sentFriendRequestsData, refetch: sentFriendRequestsRefetch } =
    useSentFriendRequestsQuery();
  const sentFriendRequestsByToUserId = keyBy(
    sentFriendRequestsData?.currentUser?.friendRequestsByFromUserId.nodes,
    "toUserId"
  );
  const friendByToUserId = keyBy(friends, "toUser.id");
  const [createFriendRequest] = useCreateFriendRequestMutation();
  const [deleteFriendRequest] = useDeleteFriendRequestMutation();
  const [unfriend] = useUnfriendMutation();

  const { loading, data } = useUserSearchQuery({
    variables: {
      term,
    },
  });

  const dataUsers = (data?.userByUsername ? [data.userByUsername] : []).filter(
    (u) => u.id !== currentUserId
  );
  const showResults = !!(loading || dataUsers.length > 0);

  useEffect(() => {
    onShowResultChange(showResults);
  }, [onShowResultChange, showResults]);

  return (
    <div>
      <Input
        className={clsx("friend-search rounded-[30px]", {
          "rounded-b-none": showResults,
        })}
        placeholder="아이디로 친구를 찾아보세요."
        prefix={
          <img
            src="/friend_search_icon.png"
            style={{
              width: "min(25px, 14px + 0.5vw)",
              marginRight: "8px",
            }}
            alt="search icon"
          />
        }
        onChange={(e) => setTerm(e.target.value)}
      />
      {showResults && (
        <div className="friend-search-results">
          {loading ? (
            <Spin />
          ) : (
            <>
              {dataUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "20px 0px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                      className="h-[38px] w-[38px] rounded-full border-none object-cover object-top"
                      src={user.avatarUrl || "/default_avatar.png"}
                    />
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(16px, 12px + 0.2vw)",
                        fontWeight: 600,
                        margin: "0px 10px",
                      }}
                    >
                      {user.nickname}
                    </span>
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(16px, 12px + 0.2vw)",
                        fontWeight: 500,
                      }}
                    >
                      @{user.username}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {friendByToUserId[user.id] ? (
                      <>
                        <Button
                          className="friend-button"
                          style={{
                            marginRight: "10px",
                            borderColor: "#7FB3E8",
                            color: "#7FB3E8",
                            width: "50px",
                          }}
                        >
                          미션
                        </Button>
                        <Button
                          className="friend-button"
                          style={{
                            borderColor: "#FF9C06",
                            color: "#FF9C06",
                            width: "50px",
                          }}
                          onClick={async () => {
                            await unfriend({
                              variables: {
                                fromUserId: currentUserId,
                                toUserId: user.id,
                              },
                            });
                            await friendsRefetch();
                          }}
                        >
                          삭제
                        </Button>
                      </>
                    ) : (
                      <>
                        {!sentFriendRequestsByToUserId[user.id] && (
                          <Button
                            className="friend-button"
                            style={{
                              borderColor: "#7FB3E8",
                              color: "#7FB3E8",
                              width: "110px",
                            }}
                            onClick={async () => {
                              await createFriendRequest({
                                variables: {
                                  fromUserId: currentUserId,
                                  toUserId: user.id,
                                },
                              });
                              await sentFriendRequestsRefetch();
                            }}
                          >
                            친구 신청
                          </Button>
                        )}
                        {sentFriendRequestsByToUserId[user.id] && (
                          <Button
                            className="friend-button"
                            style={{
                              borderColor: "#FF9C06",
                              color: "#FF9C06",
                              width: "110px",
                            }}
                            onClick={async () => {
                              await deleteFriendRequest({
                                variables: {
                                  fromUserId: currentUserId,
                                  toUserId: user.id,
                                },
                              });
                              await sentFriendRequestsRefetch();
                            }}
                          >
                            신청 취소
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

type MissionInviteFormProps = {
  currentUserId: string;
  toUserId: string;
  missions: FriendsPage_MissionFragment[];
  sentInvites: Sent_MissionInviteFragment[];
  onComplete: () => Promise<void> | void;
};

const MissionInviteForm: FC<MissionInviteFormProps> = ({
  currentUserId,
  toUserId,
  missions,
  sentInvites,
  onComplete,
}) => {
  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useMissionInviteForm(currentUserId, toUserId, undefined, onComplete);

  const code = getCodeFromError(error);

  const alreadyInvitedMissionIds = new Set(
    sentInvites
      .filter((mi) => mi.toUserId === toUserId)
      .map((mi) => mi.missionId as string)
  );
  const availableMissions = missions.filter(
    (m) => !alreadyInvitedMissionIds.has(m.id)
  );

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <div className="flex justify-center p-10">
            <Form.Item name="missionId" className="mb-0 w-full">
              <Select.Root
                defaultValue={values.missionId}
                onValueChange={(value) => {
                  setFieldValue("missionId", value);
                }}
              >
                <Select.Trigger
                  asChild
                  aria-label="Category"
                  className="w-full"
                >
                  <Button
                    className={clsx(
                      "font-poppins text-pupcleGray border-pupcleLightGray relative flex h-12 w-full max-w-[400px] items-center justify-center rounded-none border-x-0 border-t-0 border-b-[3px] text-[24px] font-semibold"
                    )}
                  >
                    <Select.Value placeholder="미션을 선택해주세요." />
                    <Select.Icon className="absolute right-8">
                      <img
                        src="/pup_notes_caret_icon.png"
                        className="h-[13px] w-5"
                      />
                    </Select.Icon>
                  </Button>
                </Select.Trigger>
                <Select.Portal className="relative flex w-full">
                  <Select.Content
                    position="popper"
                    sideOffset={2}
                    className="z-20 w-[400px]"
                  >
                    <Select.ScrollUpButton className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      {/* should be chevron up? <ChevronUpIcon /> */}
                      <img
                        src="/pup_notes_caret_icon.png"
                        className="h-[13px] w-5"
                      />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="flex justify-center rounded-b-[15px] bg-white shadow-lg">
                      <Select.Group>
                        {availableMissions.map(({ id, name }) => (
                          <Select.Item
                            key={id}
                            value={id}
                            className={clsx(
                              "relative flex h-[50px] w-[400px] items-center justify-center rounded-[5px] px-[75px] py-[10px] text-center text-[20px]",
                              "radix-disabled:opacity-50",
                              "hover:bg-pupcleLightLightGray select-none focus:outline-none"
                            )}
                          >
                            <Select.ItemIndicator className="absolute left-[25px] inline-flex items-center">
                              {/* <CheckIcon /> */}
                              <img
                                src="/checkbox.png"
                                className="h-[25px] w-[25px]"
                              />
                            </Select.ItemIndicator>
                            <Select.ItemText className="">
                              <span className="font-poppins font-medium">
                                {name}
                              </span>
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <img
                        src="/pup_notes_caret_icon.png"
                        className="h-[13px] w-5"
                      />
                    </Select.ScrollDownButton>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </Form.Item>

            {error ? (
              <Form.Item name="_error">
                <Alert
                  type="error"
                  message={`**Sending mission invite failed**`}
                  description={
                    <span>
                      {extractError(error).message}
                      {code ? (
                        <span>
                          {" "}
                          (Error code: <code>ERR_{code}</code>)
                        </span>
                      ) : null}
                    </span>
                  }
                />
              </Form.Item>
            ) : null}
          </div>
          <div className="mt-10 flex w-full items-center justify-evenly">
            <SubmitButton
              className="bg-pupcleOrange hover:!bg-pupcleOrange flex h-[46px] w-full max-w-[200px] items-center justify-center rounded-full border-none hover:opacity-70"
              htmlType="submit"
            >
              <span className="font-poppins text-[20px] font-bold tracking-widest text-white">
                {submitLabel}
              </span>
            </SubmitButton>
            <Dialog.Close asChild>
              <Button className="border-pupcleGray flex h-[46px] w-full max-w-[200px] items-center justify-center rounded-full border-[1px] bg-transparent">
                <span className="font-poppins text-pupcleGray text-[20px] font-bold tracking-widest">
                  취소
                </span>
              </Button>
            </Dialog.Close>
          </div>
        </Form>
      )}
    </Formik>
  );
};

interface FriendsPageMissionsInner {
  today: string;
  receivedInvites: Received_MissionInviteFragment[];
}

const FriendsPageMissionsInner: React.FC<FriendsPageMissionsInner> = ({
  today,
  receivedInvites,
}) => {
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);

  const selectedInvite = receivedInvites.find(
    (invite) =>
      invite.fromUser?.id + ":" + invite.mission?.id === selectedInviteId
  );

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const timeRemaining = midnight.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(
    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
  );
  const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return (
    <>
      {selectedInviteId && (
        <div className={clsx("flex h-full w-full flex-col items-center")}>
          <div className="border-pupcleLightGray flex h-[85px] w-full flex-row items-center justify-start border-b-[1px] px-11">
            <Button
              className="mr-[30px] h-5 w-[13px] border-none p-0"
              onClick={() => setSelectedInviteId(null)}
            >
              <img src="/caret_icon_gray.png" className="h-fit w-[13px]" />
            </Button>
            <img
              className="mr-4 h-[38px] w-[38px] rounded-full border-none object-cover object-top"
              src={selectedInvite?.fromUser?.avatarUrl || "/default_avatar.png"}
            />
            <span className="font-poppins mt-[2px] text-[20px] font-semibold">
              {selectedInvite?.fromUser?.nickname}
            </span>
          </div>
          {selectedInvite ? (
            <div className="relative flex h-[calc(100%-85px)] w-full flex-col p-[85px]">
              <div className="absolute top-6 right-11">
                <span className="font-poppins text-pupcleGray text-[16px] font-medium">
                  {format(new Date(selectedInvite.createdAt), "MM.dd")}
                </span>
                <span className="font-poppins text-pupcleGray ml-3 text-[16px] font-medium">
                  {format(new Date(selectedInvite.createdAt), "hh:mm:ss")}
                </span>
              </div>
              <p className="font-poppins flex flex-col">
                <span className="text-[16px] font-bold text-black">
                  [미션 신청]
                </span>
                <br />
                <span className="text-[16px] font-medium text-black">
                  {selectedInvite?.fromUser?.nickname} 님이 보내신 미션 참여
                  알림입니다. 클릭해서 {selectedInvite?.fromUser?.nickname} 님과
                  함께 참여해보세요!
                </span>
              </p>
              <br />
              {selectedInvite.mission?.day &&
              today > selectedInvite.mission?.day ? (
                <span className="font-poppins text-pupcleGray text-[15px] font-medium">
                  기간이 만료되었습니다.
                </span>
              ) : (
                <span className="font-poppins text-pupcleGray text-[15px] font-medium">
                  완료까지 0일 {hoursRemaining}시간 {minutesRemaining}분{" "}
                  {secondsRemaining}초
                </span>
              )}
              {selectedInvite.mission?.day &&
              today > selectedInvite.mission?.day ? (
                <span className="font-poppins text-pupcleGray text-[20px] font-semibold">
                  {selectedInvite.mission?.name} 미션하러가기
                </span>
              ) : (
                <span className="font-poppins text-pupcleBlue text-[20px] font-semibold">
                  {selectedInvite.mission?.id && (
                    <Link
                      href={`/mission?mission=${selectedInvite.mission.id}`}
                    >
                      {selectedInvite.mission?.name} 미션하러가기
                    </Link>
                  )}
                </span>
              )}
              <br />
              <div className="flex items-center">
                <span className="font-poppins text-pupcleGray text-[15px] font-medium">
                  보상 펍클: {selectedInvite.mission?.reward}
                </span>
                <img
                  src="/pupcle_count.png"
                  className="ml-1 mb-[1px] h-[13px] w-3"
                />
              </div>
              {selectedInvite.mission?.day &&
              today > selectedInvite.mission?.day ? (
                <Button
                  disabled
                  className="bg-pupcleLightGray hover:!bg-pupcleLightGray mt-[100px] flex h-[50px] w-[285px] items-center justify-center rounded-full border-none hover:contrast-[.8]"
                >
                  <span className="font-poppins text-pupcleGray text-[20px] font-bold tracking-widest">
                    기간이 만료되었습니다
                  </span>
                </Button>
              ) : (
                <Button
                  href={`/mission?mission=${selectedInvite.mission?.id}`}
                  className="bg-pupcleBlue hover:!bg-pupcleBlue mt-[100px] flex h-[50px] w-[285px] items-center justify-center rounded-full border-none hover:contrast-[.8]"
                >
                  <span className="font-poppins text-[20px] font-bold tracking-widest text-white">
                    미션으로 이동하기
                  </span>
                </Button>
              )}
            </div>
          ) : (
            <FourOhFour />
          )}
        </div>
      )}

      <div
        className={clsx("flex w-full flex-col items-center", {
          hidden: selectedInviteId,
        })}
      >
        <div className="flex h-[85px] w-full items-center justify-end border-none px-14">
          <Button className="h-6 w-4 border-none p-0">
            <img src="/pagination_left.png" className="h-6 w-4" />
          </Button>
          <span className="font-poppins text-pupcleGray mx-8 text-[20px] font-semibold">
            1/1
          </span>
          <Button className="h-6 w-4 border-none p-0">
            <img src="/pagination_right.png" className="h-6 w-4" />
          </Button>
        </div>
        {receivedInvites.map((invite) => {
          const inviteId = invite.fromUser?.id + ":" + invite.mission?.id;
          return (
            <Button
              onClick={() => setSelectedInviteId(inviteId)}
              className={clsx(
                "border-pupcleLightGray hover:bg-pupcleLightLightGray hover:!border-pupcleLightGray flex h-16 w-full items-center rounded-none border-x-0 border-b-[1px] border-t-0 px-11"
              )}
              key={inviteId}
            >
              <div className="flex w-full items-center">
                <img
                  className="mr-[30px] h-[38px] w-[38px] rounded-full border-none object-cover object-top"
                  src={invite.fromUser?.avatarUrl || "/default_avatar.png"}
                />
                <span className="font-poppins w-[80px] overflow-hidden text-ellipsis text-start text-[16px] font-semibold text-black">
                  {invite.fromUser?.nickname}
                </span>
                <span className="font-poppin text-pupcleGray w-[calc(100%-68px-80px-70px)] overflow-hidden text-ellipsis pl-4 text-start text-[16px] font-medium">
                  [미션 신청] {invite.fromUser?.nickname} 님이 보내신 미션 참여
                  알림입니다. 클릭해서 {invite.fromUser?.nickname} 님과 함께
                  참여해보세요!
                </span>
                <span className="font-poppins text-pupcleGray ml-[30px] w-[40px] text-[16px] font-medium">
                  {format(new Date(invite.createdAt), "MM.dd")}
                </span>
              </div>

              {/* <div className="bg-pupcleLightLightGray h-[106px] w-[106px] rounded-[20px]"></div> */}
            </Button>
          );
        })}
      </div>
    </>
  );
};

interface FriendsPageInner {
  currentUser: SharedLayout_UserFragment;
  missions: FriendsPage_MissionFragment[];
  sentInvites: Sent_MissionInviteFragment[];
  receivedInvites: Received_MissionInviteFragment[];
  day: string;
}

const FriendsPageInner: React.FC<FriendsPageInner> = ({
  day,
  currentUser,
  missions,
  sentInvites,
  receivedInvites,
}) => {
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.FRIENDS);
  const handleTabChange = (value: string) => {
    setSelectedTab(value as unknown as Tab);
    router.push({ query: { tab: value } });
  };

  useEffect(() => {
    setSelectedTab(
      router.query.tab === undefined
        ? Tab.FRIENDS
        : (router.query.tab as unknown as Tab)
    );
  }, [router.query.tab]);

  const { data: friendsData, refetch: friendsRefetch } = useFriendsQuery();
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false);
  const [userSearchResultsOpen, setUserSearchResultsOpen] = useState(false);
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();
  const [deleteFriendRequest] = useDeleteFriendRequestMutation();
  const [unfriend] = useUnfriendMutation();

  const {
    data: receivedFriendRequestsData,
    refetch: receivedFriendRequestsRefetch,
  } = useReceivedFriendRequestsQuery();

  const currentUserId = currentUser.id as string | undefined;
  const friends: Friends_UserEdgeFragment[] | undefined =
    friendsData?.currentUser?.userEdgesByFromUserId.nodes;
  const receivedFriendRequestsList =
    receivedFriendRequestsData?.currentUser?.friendRequestsByToUserId.nodes;

  const [missionInviteDialogOpen, setMissionInviteDialogOpen] = useState(false);

  return (
    <Tabs.Root
      value={selectedTab}
      onValueChange={(newValue) => {
        handleTabChange(newValue);
      }}
      style={{ display: "flex", height: "85%" }}
    >
      <Tabs.List>
        <div
          style={{
            width: "220px",
            display: "flex",
            flexDirection: "column",
            marginTop: "10px",
          }}
        >
          <Tabs.Trigger key={Tab.FRIENDS} value={Tab.FRIENDS} asChild>
            <Button
              className="friends-tab"
              style={{
                width: "100%",
                height: "50px",
                borderRadius: "0 25px 25px 0",
              }}
            >
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "min(20px, 14px + 0.2vw)",
                  fontWeight: 600,
                }}
              >
                친구
              </span>
            </Button>
          </Tabs.Trigger>
          <Tabs.Trigger key={Tab.MISSIONS} value={Tab.MISSIONS} asChild>
            <Button
              className="friends-tab"
              style={{
                width: "100%",
                height: "50px",
                borderRadius: "0 25px 25px 0",
              }}
            >
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "min(20px, 14px + 0.2vw)",
                  fontWeight: 600,
                }}
              >
                미션초대
              </span>
            </Button>
          </Tabs.Trigger>
        </div>
      </Tabs.List>
      <div
        style={{
          backgroundColor: "white",
          width: "calc(100vw - 280px)",
          margin: "0px 0px 20px 40px",
          borderRadius: "30px",
          display: "flex",
        }}
      >
        <Tabs.Content
          key={Tab.FRIENDS}
          value={Tab.FRIENDS}
          style={{ display: "flex", width: "100%" }}
        >
          <div style={{ width: "calc(100% - 300px)", padding: "40px" }}>
            <UserSearchBox
              currentUserId={currentUserId}
              onShowResultChange={setUserSearchResultsOpen}
              friends={friends}
            />
            <div
              style={{
                marginTop: userSearchResultsOpen ? "0px" : "50px",
                padding: "20px 0px",
              }}
            >
              {friends?.map((friend) => (
                <div
                  key={friend.toUser?.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0px 30px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                      className="h-[38px] w-[38px] rounded-full border-none object-cover object-top"
                      src={friend.toUser?.avatarUrl || "/default_avatar.png"}
                    />
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(16px, 12px + 0.2vw)",
                        fontWeight: 600,
                        margin: "0px 10px",
                      }}
                    >
                      {friend.toUser?.nickname}
                    </span>
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(16px, 12px + 0.2vw)",
                        fontWeight: 500,
                      }}
                    >
                      @{friend.toUser?.username}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Dialog.Root
                      open={missionInviteDialogOpen}
                      onOpenChange={setMissionInviteDialogOpen}
                    >
                      <Dialog.Trigger asChild>
                        <Button
                          className="friend-button"
                          style={{
                            marginRight: "10px",
                            borderColor: "#7FB3E8",
                            color: "#7FB3E8",
                            width: "50px",
                          }}
                        >
                          미션
                        </Button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                        <Dialog.Content
                          className={clsx(
                            "fixed z-20",
                            "w-[90vw] rounded-[15px] bg-white px-8 py-10 lg:w-[40%]",
                            "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 lg:left-[50%] xl:left-[55%] 2xl:left-[57%]"
                          )}
                        >
                          <Dialog.Title className="flex w-full flex-row items-center justify-center">
                            <span className="font-poppins text-[18px] font-semibold">
                              {friend.toUser?.nickname} 님에게 초대를 보낼
                              미션을 아래에서 선택해주세요.
                            </span>
                          </Dialog.Title>
                          <div className="bg-pupcleLightLightGray my-8 h-[9px] w-full"></div>
                          {friend.toUser && currentUserId && (
                            <MissionInviteForm
                              currentUserId={currentUserId}
                              toUserId={friend.toUser?.id}
                              missions={missions}
                              sentInvites={sentInvites}
                              onComplete={() => {
                                setMissionInviteDialogOpen(false);
                              }}
                            />
                          )}
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>

                    <Dialog.Root>
                      <Dialog.Trigger asChild>
                        <Button
                          className="friend-button"
                          style={{
                            borderColor: "#FF9C06",
                            color: "#FF9C06",
                            width: "50px",
                          }}
                        >
                          삭제
                        </Button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                        <Dialog.Content
                          className={clsx(
                            "fixed z-20",
                            "w-[90vw] rounded-[15px] bg-white px-8 py-10 lg:w-[40%]",
                            "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 lg:left-[50%] xl:left-[55%] 2xl:left-[57%]"
                          )}
                        >
                          <Dialog.Title className="flex w-full flex-row items-center justify-center">
                            <span className="font-poppins text-[18px] font-semibold">
                              {friend.toUser?.nickname} 님을 친구에서
                              삭제할까요?
                            </span>
                          </Dialog.Title>
                          <div className="bg-pupcleLightLightGray my-8 h-[9px] w-full"></div>

                          <div className="flex flex-col justify-center">
                            <span className="font-poppins text-pupcleGray text-center text-[15px]">
                              {friend.toUser?.nickname} 님이 친구 목록에서
                              제외됩니다.
                              <br />
                              아이디 검색을 통해 다시 친구 신청을 할 수
                              있습니다.
                            </span>

                            <div className="mt-10 flex w-full items-center justify-evenly">
                              <Button
                                className="bg-pupcleOrange flex h-[46px] w-full max-w-[200px] items-center justify-center rounded-full border-none"
                                onClick={async () => {
                                  await unfriend({
                                    variables: {
                                      fromUserId: currentUserId,
                                      toUserId: friend.toUser?.id,
                                    },
                                  });
                                  await friendsRefetch();
                                }}
                              >
                                <span className="font-poppins text-[20px] font-bold tracking-widest text-white">
                                  삭제
                                </span>
                              </Button>
                              <Dialog.Close asChild>
                                <Button className="border-pupcleGray flex h-[46px] w-full max-w-[200px] items-center justify-center rounded-full border-[1px] bg-transparent">
                                  <span className="font-poppins text-pupcleGray text-[20px] font-bold tracking-widest">
                                    취소
                                  </span>
                                </Button>
                              </Dialog.Close>
                            </div>
                          </div>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                    {/* <Button
                        className="friend-button"
                        style={{
                          borderColor: "#FF9C06",
                          color: "#FF9C06",
                          width: "50px",
                        }}
                        onClick={async () => {
                          await unfriend({
                            variables: {
                              fromUserId: currentUserId,
                              toUserId: friend.toUser?.id,
                            },
                          });
                          await friendsRefetch();
                        }}
                      >
                        삭제
                      </Button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "40px" }}>
            <Collapsible.Root
              className="CollapsibleRoot"
              style={{ height: "100%" }}
              open={requestsPanelOpen}
              onOpenChange={setRequestsPanelOpen}
            >
              <div
                style={{
                  width: "220px",
                  height: "60px",
                  borderRadius: requestsPanelOpen
                    ? "30px 30px 0px 0px"
                    : "30px",
                  backgroundColor: "rgba(242, 247, 253, 1)",
                  padding: "0px 30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                {(receivedFriendRequestsList?.length || 0) > 0 && (
                  <div
                    className={clsx(
                      "bg-pupcleOrange absolute -top-2 right-4 h-4 w-4 rounded-full"
                    )}
                  ></div>
                )}

                <img src="/friend_request.png" width="37px" height="37px" />
                <span
                  style={{
                    color: "#7FB3E8",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "min(20px, 14px + 0.2vw)",
                    fontWeight: 600,
                  }}
                >
                  친구 신청
                </span>
                <Collapsible.Trigger asChild>
                  <button className="IconButton">
                    {requestsPanelOpen ? (
                      <img src="friend_caret_icon_up.png" width="10px" />
                    ) : (
                      <img
                        className="friend-caret"
                        src="friend_caret_icon_down.png"
                        width="10px"
                      />
                    )}
                  </button>
                </Collapsible.Trigger>
              </div>
              <Collapsible.Content
                className={clsx(
                  "bg-friends-requests-bg relative flex h-[calc(100%-60px)] justify-center rounded-b-[30px] pt-[50px]"
                )}
              >
                <div
                  className={clsx(
                    "absolute top-0 h-[5px] w-[80%] rounded-full bg-white "
                  )}
                ></div>
                {receivedFriendRequestsList?.map((friendRequest) => (
                  <div
                    key={friendRequest.fromUserId}
                    style={{
                      width: "220px",
                      padding: "20px 30px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "220px",
                      }}
                    >
                      <img
                        className="h-9 w-9 rounded-full border-none object-cover object-top"
                        src={
                          friendRequest.fromUser?.avatarUrl ||
                          "/default_avatar.png"
                        }
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          paddingLeft: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "min(16px, 12px + 0.2vw)",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {friendRequest.fromUser?.nickname}
                        </span>
                        <span
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "min(16px, 12px + 0.2vw)",
                            fontWeight: 500,
                            overflow: "hidden",
                            width: "calc(220px - 30px - 36px - 8px - 30px)",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          @{friendRequest.fromUser?.username}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Button
                          className="friend-button"
                          style={{
                            marginRight: "10px",
                            borderColor: "#7FB3E8",
                            color: "#7FB3E8",
                            width: "50px",
                          }}
                          onClick={async () => {
                            await acceptFriendRequest({
                              variables: {
                                fromUserId: friendRequest.fromUser?.id,
                              },
                            });
                            await receivedFriendRequestsRefetch();
                            await friendsRefetch();
                          }}
                        >
                          수락
                        </Button>
                        <Button
                          className="friend-button"
                          style={{
                            borderColor: "#FF9C06",
                            color: "#FF9C06",
                            width: "50px",
                          }}
                          onClick={async () => {
                            await deleteFriendRequest({
                              variables: {
                                fromUserId: friendRequest.fromUser?.id,
                                toUserId: friendRequest.toUserId,
                              },
                            });
                            await receivedFriendRequestsRefetch();
                          }}
                        >
                          거절
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        </Tabs.Content>
        <Tabs.Content
          key={Tab.MISSIONS}
          value={Tab.MISSIONS}
          className="w-full"
        >
          <FriendsPageMissionsInner
            today={day}
            receivedInvites={receivedInvites}
          />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
};

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(format(new Date(), "yyyy-MM-dd")), []);
  return day;
};

const Friends: NextPage = () => {
  const today = useToday();
  const query = useFriendsPageQuery({ variables: { day: today } });

  const currentUser = query.data?.currentUser;
  const missions = query.data?.missions?.nodes;
  const sentInvites = query.data?.currentUser?.missionInvitesByFromUserId.nodes;
  const receivedInvites =
    query.data?.currentUser?.missionInvitesByToUserId.nodes;

  return (
    <SharedLayout
      title="friends"
      query={query}
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <div
        style={{
          padding: "40px 0px",
          display: "flex",
          justifyContent: "center",
          width: "220px",
          height: "15%",
        }}
      >
        <span
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "min(30px, 2.4vw)",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Friends
        </span>
      </div>
      {currentUser && today && missions && sentInvites && receivedInvites ? (
        <FriendsPageInner
          currentUser={currentUser}
          day={today}
          missions={missions}
          sentInvites={sentInvites}
          receivedInvites={receivedInvites}
        />
      ) : (
        <p>loading...</p>
      )}
    </SharedLayout>
  );
};

export default Friends;
