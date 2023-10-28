import { useSocialInfoForm } from "@app/componentlib";
import CustomInput from "@app/cpapp/components/CustomInput";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import { SharedLayout_UserFragment, useSharedQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
// import DetailedAvatar from "@app/server/public/avatar_white_border.png";
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

interface DetailedInfoScreenInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
}

const DetailedInfoScreenInner: FC<DetailedInfoScreenInnerProps> = ({
  currentUser,
  next,
}) => {
  const router = useRouter();

  const postResult = useCallback(async () => {
    router.push(next);
  }, [next, router]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useSocialInfoForm(
      currentUser.id,
      postResult,
      currentUser.nickname,
      currentUser.username,
      currentUser.avatarUrl
    );

  const code = getCodeFromError(error);
  const _theme = useTheme();

  return (
    <View className="h-full w-full bg-[#F2F7FD] px-10">
      <View className="flex h-[15%] w-full flex-row items-end">
        <View className="absolute left-0">
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
            세부 정보
          </Text>
        </View>
      </View>
      <View className="h-[85%] w-full">
        <View className="mt-[30px] h-[540px] w-full items-center justify-between rounded-[30px] bg-white px-5 py-[50px]"></View>
      </View>
    </View>
  );
};

type DetailedInfoScreenParams = {
  next?: string;
};

export function DetailedInfoScreen() {
  const { useParam } = createParam<DetailedInfoScreenParams>();
  const [rawNext] = useParam("next");
  const query = useSharedQuery();
  const next: string = isSafe(rawNext) ? rawNext! : "/onboarding/pet-profile";

  return (
    <SharedLayout
      title="detailed info"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <DetailedInfoScreenInner
          next={next}
          currentUser={query.data?.currentUser}
        />
      )}
    </SharedLayout>
  );
}
