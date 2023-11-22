import { ApolloError, QueryResult, useApolloClient } from "@apollo/client";
import { useSocialInfoForm } from "@app/componentlib";
import CustomInput from "@app/cpapp/components/CustomInput";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { useAuth } from "@app/cpapp/utils/auth";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  SharedLayout_UserFragment,
  useLogoutMutation,
  useSharedQuery,
} from "@app/graphql";
import {
  extractError,
  getCodeFromError,
  resetWebsocketConnection,
} from "@app/lib";
import defaultAvatar from "@app/server/public/avatar_white_border.png";
import bathroom from "@app/server/public/bathroom.png";
import hamburger from "@app/server/public/hamburger_blue.png";
import right from "@app/server/public/pagination_right.png";
import c from "@app/server/public/pupcle_count.png";
import { Field, Formik } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Avatar, Button, Circle, useTheme } from "tamagui";

interface AccountScreenInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
}

const AccountScreenInner: FC<AccountScreenInnerProps> = ({
  currentUser,
  next,
}) => {
  const router = useRouter();
  const { signOut } = useAuth();

  const postResult = useCallback(async () => {
    router.push(next);
  }, [next, router]);

  const client = useApolloClient();
  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useSocialInfoForm(
      currentUser.id,
      postResult,
      currentUser.nickname,
      currentUser.username,
      currentUser.avatarUrl
    );

  const handleLogout = useCallback(async () => {
    console.log("LOGOUT 1");
    await signOut();
    console.log("LOGOUT 2");
    resetWebsocketConnection();
    console.log("LOGOUT 3");
    await client.resetStore();
    console.log("LOGOUT 4");
    // const reset = async () => {
    //   Router.events.off("routeChangeComplete", reset);
    //   try {
    //     await logout();
    //     client.resetStore();
    //   } catch (e: any) {
    //     console.error(e);
    //     // Something went wrong; redirect to /logout to force logout.
    //     window.location.href = "/logout";
    //   }
    // };
    // Router.events.on("routeChangeComplete", reset);
    // Router.push("/");
  }, [client, signOut]);
  const code = getCodeFromError(error);
  const _theme = useTheme();

  return (
    <View className="h-full w-full bg-[#F2F7FD] px-5">
      <View className="flex h-[14%] w-full flex-row items-end">
        <View className="absolute left-5">
          <StyledComponent
            component={SolitoImage}
            className="h-[46px] w-[44px]"
            src={hamburger}
            alt=""
            // fill
          />
        </View>
        <View className="relative flex h-[46px] w-full flex-row items-center justify-center">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="font-poppins text-[24px] font-semibold text-black"
          >
            내 계정
          </Text>
        </View>
      </View>
      <View className="h-[86%] w-full pt-[50px]">
        <Link href="/account/default-info">
          <View
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 2,
            }}
            className="bg-pupcleBlue flex h-[150px] flex-row items-center rounded-[30px] border-none p-6"
          >
            <View>
              {currentUser.avatarUrl ? (
                <Avatar circular size={100}>
                  <Avatar.Image src={currentUser.avatarUrl} />
                </Avatar>
              ) : (
                <StyledComponent
                  component={SolitoImage}
                  className="h-[100px] w-[100px]"
                  src={defaultAvatar}
                  alt=""
                  // fill
                />
              )}
            </View>
            <View className="ml-6 flex w-[140px] flex-col">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="font-poppins text-[24px] font-semibold text-white"
              >
                {currentUser.nickname}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="font-poppins text-[16px] text-white"
              >
                @{currentUser.username}
              </Text>
            </View>
          </View>
        </Link>

        <View
          style={{
            shadowColor: "black",
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 2,
          }}
          className="mt-5 flex h-[70px] flex-row items-center justify-between rounded-[10px] border-none bg-white p-6"
        >
          <Text className="font-poppins text-[16px]">현재 보유 펍클</Text>
          <View className="flex flex-row items-center">
            <Text className="font-poppins text-[16px]">
              {currentUser.userEntry?.pupcleBalance}
            </Text>
            <View className="ml-1 h-[23px] w-[22px]">
              <StyledComponent
                component={SolitoImage}
                className="h-[23px] w-[22px]"
                src={c}
                alt=""
                // fill
              />
            </View>
          </View>
        </View>
        <View
          style={{
            shadowColor: "black",
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 2,
          }}
          className="mt-5 flex h-[96px] flex-col rounded-[10px] border-none bg-white"
        >
          <Link href="/account/default-info">
            <View className="flex h-12 w-full flex-row items-center justify-between border-b-[1px] border-none border-[#D9D9D9] px-6">
              <Text className="font-poppins text-[16px]">
                기본 정보 수정하기
              </Text>
              <View>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[17px] w-[11.5px]"
                  src={right}
                  alt=""
                  // fill
                />
              </View>
            </View>
          </Link>
          <Link href="/account/detailed-info">
            <View className="flex h-12 w-full flex-row items-center justify-between px-6">
              <Text className="font-poppins text-[16px]">
                세부 정보 수정하기
              </Text>
              <View>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[17px] w-[11.5px]"
                  src={right}
                  alt=""
                  // fill
                />
              </View>
            </View>
          </Link>
        </View>
        <Button unstyled onPress={handleLogout}>
          <View
            style={{
              shadowColor: "black",
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 2,
            }}
            className="mt-5 flex h-[48px] flex-row items-center justify-between rounded-[10px] border-none bg-white px-6"
          >
            <Text className="font-poppins text-[16px] text-[#FF9C06]">
              {/* 내가 쓴 리뷰 모아보기 */}
              로그아웃하기
            </Text>
            {/* <View>
            <StyledComponent
              component={SolitoImage}
              className="h-[17px] w-[11.5px]"
              src={right}
              alt=""
              // fill
            />
          </View> */}
          </View>
        </Button>
      </View>
    </View>
  );
};

type AccountScreenParams = {
  next?: string;
};

export function AccountScreen() {
  const { useParam } = createParam<AccountScreenParams>();
  const [rawNext] = useParam("next");
  const query = useSharedQuery();
  const next: string = isSafe(rawNext) ? rawNext! : "/onboarding/pet-profile";

  return (
    <SharedLayout
      title="account"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <AccountScreenInner next={next} currentUser={query.data?.currentUser} />
      )}
    </SharedLayout>
  );
}
