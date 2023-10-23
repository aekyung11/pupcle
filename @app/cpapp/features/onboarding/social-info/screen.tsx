import { ApolloError } from "@apollo/client";
import { SocialInfoFormInput, useSocialInfoForm } from "@app/componentlib";
import CustomInput from "@app/cpapp/components/CustomInput";
import { FramedAvatarUpload } from "@app/cpapp/components/FramedAvatarUpload";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import { SharedLayout_UserFragment, useSharedQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import pupcleIcon from "@app/server/public/pupcle_count.png";
import { Field, Formik, useFormikContext } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Button, Circle, Tooltip, useTheme } from "tamagui";

type SocialInfoScreenFormInnerProps = {
  error: Error | ApolloError | null;
  submitLabel: string;
};

const SocialInfoScreenFormInner: FC<SocialInfoScreenFormInnerProps> = ({
  error,
  submitLabel,
}) => {
  const { handleSubmit, isValid, values, setFieldValue } =
    useFormikContext<SocialInfoFormInput>();

  const onUpload = useCallback(
    async (avatarUrl: string | null | undefined) =>
      setFieldValue("avatarUrl", avatarUrl),
    [setFieldValue]
  );

  const code = getCodeFromError(error);

  return (
    <>
      <View className="flex flex-col items-center">
        <FramedAvatarUpload
          avatarUrl={values.avatarUrl}
          disabled={false}
          onUpload={onUpload}
        />
      </View>
      <View style={styles.rowPadding}>
        <Text style={styles.textAboveInput}>이름</Text>
      </View>
      <Field
        style={styles.input}
        component={CustomInput}
        name="nickname"
        placeholder="ex) 뽀삐언니"
      />
      <View style={styles.rowPadding}>
        <Text style={styles.textAboveInput}>사용자 이름</Text>
      </View>
      <Field
        style={styles.input}
        component={CustomInput}
        name="username"
        placeholder="ex) gildong_2"
      />
      {error ? (
        <Text>
          {extractError(error)?.["message"]}
          {code ? (
            <Text>
              {" "}
              (Error code: <code>ERR_{code}</code>)
            </Text>
          ) : null}
        </Text>
      ) : null}

      <Button
        unstyled
        style={styles.submitButton}
        title={submitLabel}
        // @ts-ignore
        onPress={handleSubmit}
        disabled={!isValid || values.username === ""}
      >
        <Text style={styles.buttonText}>다음</Text>
      </Button>
    </>
  );
};

interface SocialInfoScreenInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
}

const SocialInfoScreenInner: FC<SocialInfoScreenInnerProps> = ({
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

  const _theme = useTheme();

  return (
    <View className="h-full" style={styles.container}>
      <View className="flex h-[20%] flex-col items-center justify-end pb-3">
        <Text style={styles.titleText}>회원 정보</Text>
        <Text style={styles.normalText}>회원님의 정보를 입력해주세요.</Text>
      </View>
      <View className="flex h-[80%] flex-col justify-center pb-10">
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          <SocialInfoScreenFormInner error={error} submitLabel={submitLabel} />
        </Formik>
      </View>
    </View>
  );
};

type SocialInfoScreenParams = {
  next?: string;
};

export function SocialInfoScreen() {
  const { useParam } = createParam<SocialInfoScreenParams>();
  const [rawNext] = useParam("next");
  const query = useSharedQuery();
  const next: string = isSafe(rawNext) ? rawNext! : "/onboarding/pet-profile";

  return (
    <SharedLayout
      title="Social Info"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <SocialInfoScreenInner
          next={next}
          currentUser={query.data?.currentUser}
        />
      )}
    </SharedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // height: "100%",
    backgroundColor: "white",
    alignItems: "center",
    // paddingTop: "45%",
    // justifyContent: "center",
  },
  titleText: {
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 24,
  },
  normalText: {
    fontFamily: "Poppins",
    fontSize: 14,
  },
  normalBlueText: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#7FB3E8",
  },
  rowPadding: {
    paddingLeft: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    height: 48,
    width: 310,
    fontFamily: "'Poppins'",
    fontSize: 14,
    marginTop: 2,
  },
  textAboveInput: {
    fontFamily: "'Poppins'",
    color: "black",
    fontSize: 14,
    marginTop: 20,
  },
  viewMarginTop12: {
    width: 310,
    marginTop: 12,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  viewMarginTop20: {
    width: 310,
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontFamily: "'Poppins'",
    color: "#8F9092",
    fontSize: 14,
  },
  boldBlueText: {
    fontFamily: "'Poppins'",
    color: "#7FB3E8",
    fontWeight: "700",
    fontSize: 14,
  },
  semiBoldBlueText: {
    fontFamily: "'Poppins'",
    color: "#7FB3E8",
    fontWeight: "600",
    fontSize: 14,
  },
  submitButton: {
    marginTop: 60,
    width: 310,
    height: 48,
    backgroundColor: "#7FB3E8",
    borderRadius: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Poppins",
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  pageTitle: {
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 24,
    marginBottom: 10,
  },
});
