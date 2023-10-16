import { AuthRestrict, FourOhFour, SharedLayout } from "@app/components";
import {
  NotificationsPage_NotificationFragment,
  useNotificationsPageQuery,
  useSharedQuery,
} from "@app/graphql";
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

type NotificationsPageUserInnerProps = {
  notifications: NotificationsPage_NotificationFragment[];
};

const NotificationsPageUserInner: React.FC<NotificationsPageUserInnerProps> = ({
  notifications,
}) => {
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);

  const selectedNotification = notifications.find(
    (n) => n.id === selectedNotificationId
  );

  return (
    <>
      {selectedNotificationId && (
        <div className={clsx("flex h-full w-full flex-col items-center")}>
          <div className="border-pupcleLightGray flex h-[85px] w-full flex-row items-center justify-start border-b-[1px] px-11">
            <Button
              className="mr-[30px] h-5 w-[13px] border-none p-0"
              onClick={() => setSelectedNotificationId(null)}
            >
              <img src="/caret_icon_gray.png" className="h-fit w-[13px]" />
            </Button>
            <span className="font-poppins text-pupcleGray mt-[2px] text-[20px] font-semibold">
              [{selectedNotification?.category}]
            </span>
          </div>
          {selectedNotification ? (
            <div className="relative flex h-[calc(100%-85px)] w-full flex-col p-[85px]">
              <div className="absolute top-6 right-11">
                <span className="font-poppins text-pupcleGray text-[16px] font-medium">
                  {format(new Date(selectedNotification.createdAt), "MM.dd")}
                </span>
                <span className="font-poppins text-pupcleGray ml-3 text-[16px] font-medium">
                  {format(new Date(selectedNotification.createdAt), "hh:mm:ss")}
                </span>
              </div>
              <p className="font-poppins flex flex-col">
                <span className="text-[20px] font-bold text-black">
                  {selectedNotification.message.split(". ")[0]}
                </span>
                <br />
                <span className="text-[16px] font-medium text-black">
                  {selectedNotification.category === "펍클 적립 안내" ? (
                    <>
                      {selectedNotification.message.split(". ")[1]} <br />
                    </>
                  ) : null}
                  {selectedNotification.category === "펍클 적립 안내" ? (
                    <>
                      아래 버튼을 눌러 오늘 참여 가능한 다른 미션도
                      확인해보세요!
                      <br />
                      <br />
                      <span className="!text-pupcleOrange">
                        모든 미션은 자정에 새로고침 됩니다. 늦지 않게
                        서둘러주세요.
                      </span>
                    </>
                  ) : selectedNotification.category === "친구 신청 안내" ? (
                    <>
                      아래 아래 사용자로부터 친구 신청이 도착했어요.
                      <br />
                      <br />
                      <div></div>
                      <br />
                      <br />
                      아래 버튼을 눌러 친구 신청을 수락 또는 거절해주세요.
                      <span className="!text-pupcleOrange">
                        내가 수락/거절해도 친구에게는 알림이 가지 않습니다.
                      </span>
                    </>
                  ) : selectedNotification.category === "미션 초대 안내" ? (
                    <>
                      아래 버튼을 눌러 나에게 온 모든 미션 초대를 한번에
                      확인해보세요!
                      <br />
                      <br />
                      <span className="!text-pupcleOrange">
                        모든 일일미션은 자정에 새로고침 됩니다. 늦지 않게
                        서둘러주세요.
                      </span>
                    </>
                  ) : null}
                </span>
              </p>
              <Button
                disabled={selectedNotification.actionUrl === null}
                href={selectedNotification.actionUrl || "/"}
                className="bg-pupcleBlue hover:!bg-pupcleBlue mt-[100px] flex h-[50px] w-[285px] items-center justify-center rounded-full border-none hover:contrast-[.8]"
              >
                <span className="font-poppins text-[20px] font-bold tracking-widest text-white">
                  {selectedNotification.category === "펍클 적립 안내"
                    ? "미션 페이지 바로가기"
                    : selectedNotification.category === "친구 신청 안내"
                    ? "받은 친구신청 확인하기"
                    : selectedNotification.category === "미션 초대 안내"
                    ? "받은 미션 초대 확인하기"
                    : null}
                </span>
              </Button>
            </div>
          ) : (
            <FourOhFour />
          )}
        </div>
      )}
      <div className={clsx({ hidden: selectedNotificationId })}>
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
        {notifications.map((notification) => (
          <Button
            className="border-pupcleLightGray hover:bg-pupcleLightLightGray hover:!border-pupcleLightGray flex h-16 w-full items-center rounded-none border-x-0 border-b-[1px] border-t-0 px-11"
            key={notification.id}
            onClick={() => setSelectedNotificationId(notification.id)}
          >
            <div className="flex w-full items-center">
              <div className="border-pupcleLightGray mr-[30px] flex h-[38px] w-[38px] items-center justify-center rounded-full border-[1px] bg-transparent">
                <img
                  className="h-fit w-fit object-contain p-1"
                  // src={invite.fromUser?.avatarUrl || "/default_avatar.png"}
                  src={
                    notification.category === "펍클 적립 안내"
                      ? "/pupcle_count.png"
                      : notification.category === "친구 신청 안내"
                      ? "/add_friend.png"
                      : notification.category === "미션 초대 안내"
                      ? "/paw_blue.png"
                      : undefined
                  }
                />
              </div>

              <div className="flex w-[calc(100%-68px-70px)] items-center overflow-hidden text-ellipsis">
                <span className="font-poppins text-start text-[16px] font-semibold text-black">
                  [{notification.category}]&nbsp;
                </span>
                <span className="font-poppin text-pupcleGray text-start text-[16px] font-medium">
                  {notification.message}
                </span>
              </div>
              <span className="font-poppins text-pupcleGray ml-[30px] w-[40px] text-[16px] font-medium">
                {format(new Date(notification.createdAt), "MM.dd")}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </>
  );
};

const Notification: NextPage = () => {
  const query = useNotificationsPageQuery();
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

  const notifications = query.data?.currentUser?.notifications.nodes;

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
            {notifications && (
              <NotificationsPageUserInner notifications={notifications} />
            )}
          </Tabs.Content>
          <Tabs.Content
            key={Tab.ALL}
            value={Tab.ALL}
            className="relative flex h-full w-full"
          ></Tabs.Content>
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
