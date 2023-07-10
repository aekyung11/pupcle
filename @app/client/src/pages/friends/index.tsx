import { SharedLayout } from "@app/components";
import { useSharedQuery, useUserSearchQuery } from "@app/graphql";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Button, Input, Spin } from "antd";
import clsx from "clsx";
import { NextPage } from "next";
import * as React from "react";
import { useState } from "react";

type UserSearchBoxProps = {
  currentUserId: string | undefined;
};

function UserSearchBox({ currentUserId }: UserSearchBoxProps) {
  const [term, setTerm] = useState("");
  const { loading, data } = useUserSearchQuery({
    variables: {
      term,
    },
  });

  const showResults = loading || data;
  const dataUsers = (data?.userByUsername ? [data.userByUsername] : []).filter(
    (u) => u.id !== currentUserId
  );

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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "20px 0px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src="/default_avatar.png" width="38px" height="38px" />
                  <span
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "min(16px, 12px + 0.2vw)",
                      fontWeight: 600,
                      margin: "0px 10px",
                    }}
                  >
                    퐁당이
                  </span>
                  <span
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "min(16px, 12px + 0.2vw)",
                      fontWeight: 500,
                    }}
                  >
                    pongdang1004
                  </span>
                </div>
                <div>
                  <Button>미션</Button>
                  <Button>삭제</Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const Friends: NextPage = () => {
  const query = useSharedQuery();
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false);
  const [userSearchResultsOpen, setUserSearchResultsOpen] = useState(false);
  const currentUserId = query.data?.currentUser?.id as string | undefined;
  return (
    <SharedLayout title="friends" query={query} useFriendsBg>
      <div style={{ padding: "40px 50px" }}>
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
      <div style={{ display: "flex" }}>
        <div
          style={{
            width: "220px",
            display: "flex",
            flexDirection: "column",
            marginTop: "10px",
          }}
        >
          <Button
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
          <Button
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
        </div>
        <div
          style={{
            backgroundColor: "white",
            width: "calc(100vw - 280px)",
            marginLeft: "40px",
            borderRadius: "30px",
            display: "flex",
          }}
        >
          <div style={{ width: "calc(100% - 300px)", padding: "40px" }}>
            <UserSearchBox currentUserId={currentUserId} />
            <div style={{ marginTop: "70px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0px 30px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src="/default_avatar.png" width="38px" height="38px" />
                  <span
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "min(16px, 12px + 0.2vw)",
                      fontWeight: 600,
                      margin: "0px 10px",
                    }}
                  >
                    퐁당이
                  </span>
                  <span
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "min(16px, 12px + 0.2vw)",
                      fontWeight: 500,
                    }}
                  >
                    pongdang1004
                  </span>
                </div>
                <div>
                  <Button>미션</Button>
                  <Button>삭제</Button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "40px" }}>
            <Collapsible.Root
              className="CollapsibleRoot"
              open={requestsPanelOpen}
              onOpenChange={setRequestsPanelOpen}
            >
              <div
                style={{
                  width: "220px",
                  height: "60px",
                  borderRadius: "30px",
                  backgroundColor: "rgba(242, 247, 253, 1)",
                  padding: "0px 30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
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
                      <img src="friend_caret_icon_down.png" width="10px" />
                    )}
                  </button>
                </Collapsible.Trigger>
              </div>
              <Collapsible.Content className={clsx("pt-[70px]")}>
                <div style={{ padding: "0px 30px", width: "220px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "220px",
                    }}
                  >
                    <img src="/default_avatar.png" width="36px" height="36px" />
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
                        퐁당이
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
                        pongdang1004asdadads
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button>수락</Button>
                    <Button>거절</Button>
                  </div>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Friends;