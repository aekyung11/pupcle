import { useSocialInfoForm } from "@app/componentlib";
import {
  AuthRestrict,
  FourOhFour,
  FramedAvatarUpload,
  SharedLayout,
} from "@app/components";
import { SharedLayout_UserFragment, useSharedQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import * as Tabs from "@radix-ui/react-tabs";
import { Alert, Button, InputRef } from "antd";
import clsx from "clsx";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import * as React from "react";
import { FC, useCallback, useEffect, useRef, useState } from "react";

const Account: NextPage = () => {
  const query = useSharedQuery();
  const refetch = async () => query.refetch();
  // const [selectedTab, setSelectedTab] = useState<Tab>(Tab.BASIC);

  const currentUser = query.data?.currentUser;
  const currentUserId = currentUser?.id as string | undefined;

  if (query.loading) {
    return <p>Loading...</p>;
  }
  if (!currentUser || !currentUserId) {
    return (
      <SharedLayout
        title="account"
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
      title="account"
      query={query}
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex h-[125px] w-[220px] items-center justify-center">
          <span className="font-poppins text-[30px] font-semibold">
            Account
          </span>
        </div>
        <div className="flex h-full w-full justify-center">
          <div className="h-[calc(100vh-6rem-125px)] w-[calc(100vw-280px)] rounded-[30px] bg-white">
            <div className="border-pupcleLightLightGray relative flex h-[325px] w-full flex-row items-center justify-center border-b-[9px]">
              <div className="absolute right-[60px] top-10 flex flex-row items-center">
                <span className="font-poppins text-[20px]">
                  보유 펍클 : 273
                </span>
                <img src="/pupcle_count.png" className="ml-1 h-[25px] w-6" />
              </div>
              <div className="flex flex-col items-center">
                <img
                  src={currentUser.avatarUrl || "/profile_default_avatar.png"}
                  className="h-[138px] w-[138px]"
                />
                <span className="font-poppins mt-4 text-[24px] font-semibold">
                  {currentUser.nickname}
                </span>
                <span className="font-poppins text-pupcleGray text-[16px]">
                  @{currentUser.username}
                </span>
              </div>
            </div>
            <div className="flex h-[calc(100%-325px-9px)] min-h-[242px] w-full flex-col items-center justify-center pt-5 pb-10">
              <div className="bg-pupcleLightLightGray h-[117px] w-[474px] rounded-[24px] border-none">
                <Button
                  href="/account/default-info"
                  className="flex h-[58px] w-full flex-row items-center justify-between rounded-t-[24px] rounded-b-none border-none bg-transparent px-[22px]"
                >
                  <span className="font-poppins mt-[2px] text-[20px] text-black">
                    기본 정보 수정하기
                  </span>
                  <img
                    src="/caret_icon_light_gray.png"
                    className="h-5 w-[13px]"
                  />
                </Button>
                <div className="bg-pupcleLightGray h-[1px] w-full border-none p-0"></div>
                <Button className="!hover:border-pupcleLightGray rounded-t-0 flex h-[58px] w-full flex-row items-center justify-between rounded-b-[24px] border-none bg-transparent px-[22px]">
                  <span className="font-poppins mt-[2px] text-[20px] text-black">
                    세부 정보 수정하기
                  </span>
                  <img
                    src="/caret_icon_light_gray.png"
                    className="h-5 w-[13px]"
                  />
                </Button>
              </div>
              <Button className="bg-pupcleLightLightGray mt-7 flex h-[58px] w-[474px] flex-row items-center justify-between rounded-[20px] border-none px-[22px]">
                <span className="font-poppins mt-[2px] text-[20px] text-black">
                  내가 쓴 리뷰 모아보기
                </span>
                <img
                  src="/caret_icon_light_gray.png"
                  className="h-5 w-[13px]"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Account;
