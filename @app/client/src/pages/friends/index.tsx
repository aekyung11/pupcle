import { AuthRestrict, SharedLayout } from "@app/components";
import {
  Friends_UserEdgeFragment,
  SharedLayout_UserFragment,
  useAcceptFriendRequestMutation,
  useCreateFriendRequestMutation,
  useDeleteFriendRequestMutation,
  useFriendsPageQuery,
  useFriendsQuery,
  useReceivedFriendRequestsQuery,
  useSentFriendRequestsQuery,
  useSharedQuery,
  useUnfriendMutation,
  useUserSearchQuery,
} from "@app/graphql";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as Select from "@radix-ui/react-select";
import { Button, Input, Spin } from "antd";
import clsx from "clsx";
import { keyBy } from "lodash";
import { NextPage } from "next";
import * as React from "react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

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

interface FriendsPageInner {
  currentUser: SharedLayout_UserFragment;
  day: string;
}

const FriendsPageInner: React.FC<FriendsPageInner> = ({ currentUser }) => {
  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.FRIENDS);
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

  return (
    <Tabs.Root
      value={selectedTab}
      onValueChange={(newValue) => {
        setSelectedTab(newValue as Tab);
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
                    <Dialog.Root>
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
                          <div className="flex justify-center p-10">
                            <Select.Root defaultValue="">
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
                            </Select.Root>
                          </div>
                          <div className="mt-10 flex w-full items-center justify-evenly">
                            <Button className="bg-pupcleOrange flex h-[46px] w-full max-w-[200px] items-center justify-center rounded-full border-none">
                              <span className="font-poppins text-[20px] font-bold tracking-widest text-white">
                                초대 보내기
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
        <Tabs.Content key={Tab.MISSIONS} value={Tab.MISSIONS}></Tabs.Content>
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
      {currentUser && today ? (
        <FriendsPageInner currentUser={currentUser} day={today} />
      ) : (
        <p>loading...</p>
      )}
    </SharedLayout>
  );
};

export default Friends;
