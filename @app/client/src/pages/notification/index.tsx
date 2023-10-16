import { AuthRestrict, FourOhFour, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import * as Tabs from "@radix-ui/react-tabs";
import { Button, Input, Spin } from "antd";
import clsx from "clsx";
import { format } from "date-fns";
import { NextPage } from "next";
import * as React from "react";
import { useEffect, useState } from "react";

enum Tab {
  USER = "notifications for currentuser",
  ALL = "notifications for all users",
  CIRCLE = "notifications about circle",
}

const Notification: NextPage = () => {
  const query = useSharedQuery();
  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.USER);
  const currentUser = query.data?.currentUser;
  const currentUserId = query.data?.currentUser?.id as string | undefined;

  if (query.loading) {
    return <p>Loading...</p>;
  }
  if (!currentUser || !currentUserId) {
    return (
      <SharedLayout
        title="pup-notes"
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
      title="notification"
      query={query}
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <div className="ml-[10px] flex h-[125px] w-[220px] items-center justify-center py-10">
        <span className="font-poppins text-pupcle-30px font-semibold">
          Notifications
        </span>
      </div>
      <Tabs.Root
        value={selectedTab}
        onValueChange={(newValue) => {
          setSelectedTab(newValue as Tab);
        }}
        style={{ display: "flex", height: "calc(100vh - 96px - 125px)" }}
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
            <Tabs.Trigger key={Tab.USER} value={Tab.USER} asChild>
              <Button
                className="friends-tab"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "0 25px 25px 0",
                }}
              >
                <span className="font-poppins text-pupcle-20px font-semibold">
                  개인 알림
                </span>
              </Button>
            </Tabs.Trigger>
            <Tabs.Trigger key={Tab.ALL} value={Tab.ALL} asChild>
              <Button
                className="friends-tab"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "0 25px 25px 0",
                }}
              >
                <span className="font-poppins text-pupcle-20px font-semibold">
                  전체 알림
                </span>
              </Button>
            </Tabs.Trigger>
            <Tabs.Trigger key={Tab.CIRCLE} value={Tab.CIRCLE} asChild>
              <Button
                className="friends-tab"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "0 25px 25px 0",
                }}
              >
                <span className="font-poppins text-pupcle-20px font-semibold">
                  써클 알림
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
            // display: "flex",
          }}
        >
          <Tabs.Content
            key={Tab.USER}
            value={Tab.USER}
            className="relative flex h-full w-full flex-col"
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
            <Button className="border-pupcleLightGray hover:bg-pupcleLightLightGray hover:!border-pupcleLightGray flex h-16 w-full items-center rounded-none border-x-0 border-b-[1px] border-t-0 px-11">
              <div className="flex w-full items-center">
                <img
                  className="mr-[30px] h-[38px] w-[38px] rounded-full border-none object-cover object-top"
                  // src={invite.fromUser?.avatarUrl || "/default_avatar.png"}
                  src="/default_avatar.png"
                />
                <div className="flex w-[calc(100%-68px-70px)] items-center overflow-hidden text-ellipsis">
                  <span className="font-poppins text-start text-[16px] font-semibold text-black">
                    [{/* notification.category */}notification.category]&nbsp;
                  </span>
                  <span className="font-poppin text-pupcleGray text-start text-[16px] font-medium">
                    notification.message{/* notification.message */}
                  </span>
                </div>
                <span className="font-poppins text-pupcleGray ml-[30px] w-[40px] text-[16px] font-medium">
                  {/* {format(new Date(notification.createdAt), "MM.dd")} */}
                  10.16
                </span>
              </div>
            </Button>
          </Tabs.Content>
          <Tabs.Content
            key={Tab.ALL}
            value={Tab.ALL}
            className="relative flex h-full w-full"
          >
            <div className={clsx("flex h-full w-full flex-col items-center")}>
              <div className="border-pupcleLightGray flex h-[85px] w-full flex-row items-center justify-start border-b-[1px] px-11">
                <Button
                  className="mr-[30px] h-5 w-[13px] border-none p-0"
                  // onClick={() => setSelectedInviteId(null)}
                >
                  <img src="/caret_icon_gray.png" className="h-fit w-[13px]" />
                </Button>
                <span className="font-poppins mt-[2px] text-[20px] font-semibold">
                  [{/* notification.category */}notification.category]
                </span>
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content
            key={Tab.CIRCLE}
            value={Tab.CIRCLE}
            className="relative flex h-full w-full"
          ></Tabs.Content>
        </div>
      </Tabs.Root>
    </SharedLayout>
  );
};

export default Notification;
