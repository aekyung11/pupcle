import { AuthRestrict, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button } from "antd";
import { NextPage } from "next";
import * as React from "react";

const Mission: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout
      title="mission"
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
      query={query}
    >
      <div className="flex h-[calc(100vh-6rem)] w-full">
        <div className="flex h-full w-1/2 items-center justify-end">
          <div className="max-w-[720px] px-10">
            <img src="/mission_dog.png" className="h-full w-full" />
          </div>
        </div>
        <div className="flex h-[calc(100vh-6rem)] w-1/2 justify-start">
          <div className="h-full w-full max-w-[720px] px-10 py-[60px]">
            <Button className="bg-pupcleMiddleBlue flex h-[160px] w-full items-center rounded-[30px] border-none px-[60px] drop-shadow-xl">
              <div className="flex w-1/2 flex-col items-start">
                <span className="font-poppins text-[40px] font-semibold">
                  산책하기
                </span>
                <span className="font-poppins text-[20px]">
                  19899명이 참여중
                </span>
              </div>
              <div className="flex w-1/2 flex-col items-end">
                <div className="flex flex-row items-center">
                  <span className="font-poppins text-[32px] font-medium">
                    2&nbsp;
                  </span>
                  <img src="/pupcle_count.png" className="h-fit w-[29px]" />
                </div>
                <div className="flex w-[80px] flex-row justify-between">
                  <img src="/default_avatar.png" className="h-6 w-6" />
                  <img src="/default_avatar.png" className="h-6 w-6" />
                  <img src="/default_avatar.png" className="h-6 w-6" />
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Mission;
