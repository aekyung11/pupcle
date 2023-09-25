import { AuthRestrict, SharedLayout } from "@app/components";
import {
  Friends_UserEdgeFragment,
  useAcceptFriendRequestMutation,
  useCreateFriendRequestMutation,
  useDeleteFriendRequestMutation,
  useFriendsQuery,
  useReceivedFriendRequestsQuery,
  useSentFriendRequestsQuery,
  useSharedQuery,
  useUnfriendMutation,
  useUserSearchQuery,
} from "@app/graphql";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Tabs from "@radix-ui/react-tabs";
import { Button, Input, Spin } from "antd";
import clsx from "clsx";
import { keyBy } from "lodash";
import { NextPage } from "next";
import * as React from "react";
import { useEffect, useState } from "react";

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

const Friends: NextPage = () => {
  const query = useSharedQuery();
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

  const currentUserId = query.data?.currentUser?.id as string | undefined;
  const friends: Friends_UserEdgeFragment[] | undefined =
    friendsData?.currentUser?.userEdgesByFromUserId.nodes;
  const receivedFriendRequestsList =
    receivedFriendRequestsData?.currentUser?.friendRequestsByToUserId.nodes;

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
                              toUserId: friend.toUser?.id,
                            },
                          });
                          await friendsRefetch();
                        }}
                      >
                        삭제
                      </Button>
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
    </SharedLayout>
  );
};

export default Friends;
