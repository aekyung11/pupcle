import { useSocialInfoForm } from "@app/componentlib";
import CustomInput from "@app/cpapp/components/CustomInput";
import { FourOhFour } from "@app/cpapp/components/FourOhFour";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import { SharedLayout_UserFragment, useSharedQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
// import defaultAvatar from "@app/server/public/avatar_white_border.png";
import bathroom from "@app/server/public/bathroom.png";
import hamburger from "@app/server/public/hamburger_blue.png";
import right from "@app/server/public/pagination_right.png";
import defaultAvatar from "@app/server/public/profile_default_avatar.png";
import c from "@app/server/public/pupcle_count.png";
import { Field, Formik } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Avatar, Button, Circle, useTheme } from "tamagui";

interface DefaultInfoScreenInnerInnerProps {
  currentUser: SharedLayout_UserFragment;
  refetch: () => Promise<any>;
}

const DefaultInfoScreenInnerInner: FC<DefaultInfoScreenInnerInnerProps> = ({
  currentUser,
}) => {
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);

  const postResult = useCallback(async () => {
    setEditingBasicInfo(false);
  }, []);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useSocialInfoForm(
      currentUser.id,
      postResult,
      currentUser.nickname,
      currentUser.username,
      currentUser.avatarUrl
    );

  const code = getCodeFromError(error);

  return (
    <View className="h-full w-full px-5 py-[60px]">
      <Formik
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => (
          <View className="w-full flex-col items-center">
            <Circle size="$10">
              <SolitoImage src={defaultAvatar} alt="" fill />
              {/* <Avatar.Image src={defaultAvatar} resizeMode="contain" /> */}
            </Circle>
            {/* TODO: made framedavatarupload works */}
            <View className="mt-[72px] w-full">
              <View>
                <Text className="font-poppins ml-5 text-[16px]">닉네임</Text>
                <Field
                  disabled={!editingBasicInfo}
                  style={editingBasicInfo ? styles.inputEdit : styles.input}
                  // className="border-pupcleBlue h-12 w-full rounded-full"
                  component={CustomInput}
                  name="nickname"
                  placeholder="ex) 뽀삐언니"
                />
              </View>
              <View className="mt-5">
                <Text className="font-poppins ml-5 text-[16px]">
                  사용자 이름
                </Text>
                <Field
                  disabled={!editingBasicInfo}
                  style={editingBasicInfo ? styles.inputEdit : styles.input}
                  component={CustomInput}
                  name="username"
                  placeholder="ex) gildong_2"
                />
              </View>
            </View>
            <View className="mt-10 flex w-full flex-row justify-end">
              {editingBasicInfo ? (
                <Button
                  onClick={() => setEditingBasicInfo(true)}
                  unstyled
                  // title={submitLabel}
                  className="bg-pupcleBlue flex h-12 w-[120px] items-center justify-center rounded-full border-none"
                >
                  <Text className="font-poppins text-[16px] font-bold text-white">
                    저장하기
                  </Text>
                </Button>
              ) : (
                <Button
                  onClick={() => setEditingBasicInfo(true)}
                  unstyled
                  // title={submitLabel}
                  className="flex h-12 w-[120px] items-center justify-center rounded-full border-none bg-[#D9E8F8]"
                >
                  <Text className="font-poppins text-pupcleBlue text-[16px] font-bold">
                    수정하기
                  </Text>
                </Button>
              )}
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
};

interface DefaultInfoScreenInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
  refetch: () => Promise<any>;
}

const DefaultInfoScreenInner: FC<DefaultInfoScreenInnerProps> = ({
  currentUser,
  next,
  refetch,
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
            기본 정보
          </Text>
        </View>
      </View>
      <View className="h-[85%] w-full">
        <View className="mt-[30px] h-[540px] w-full rounded-[30px] bg-white">
          <DefaultInfoScreenInnerInner
            currentUser={currentUser}
            refetch={refetch}
          />
        </View>
      </View>
    </View>
  );
};

type DefaultInfoScreenParams = {
  next?: string;
};

export function DefaultInfoScreen() {
  const { useParam } = createParam<DefaultInfoScreenParams>();
  const [rawNext] = useParam("next");
  const query = useSharedQuery();
  const refetch = async () => query.refetch();
  const next: string = isSafe(rawNext) ? rawNext! : "/onboarding/pet-profile";

  const currentUser = query.data?.currentUser;
  const currentUserId = currentUser?.id as string | undefined;

  if (query.loading) {
    return <p>Loading...</p>;
  }
  if (!currentUser || !currentUserId) {
    return (
      <SharedLayout
        title="default info"
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
      title="default info"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <DefaultInfoScreenInner
          next={next}
          currentUser={query.data?.currentUser}
          refetch={refetch}
        />
      )}
    </SharedLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    height: 48,
    fontFamily: "'Poppins'",
    fontSize: 16,
    color: "#8F9092",
    marginTop: 2,
    borderStyle: "solid",
    borderColor: "#7FB3E8",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
  },
  inputEdit: {
    width: "100%",
    height: 48,
    fontFamily: "'Poppins'",
    fontSize: 16,
    color: "black",
    marginTop: 2,
    borderStyle: "solid",
    borderColor: "#7FB3E8",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
  },
});