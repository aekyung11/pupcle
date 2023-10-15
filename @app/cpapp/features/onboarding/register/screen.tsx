import { useApolloClient } from "@apollo/client";
import { useLoginForm } from "@app/componentlib";
import { View } from "@app/cpapp/design/view";
import { useSharedLazyQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import checkboxChecked from "@app/server/public/checkbox.png";
import checkboxUnchecked from "@app/server/public/checkbox_unchecked.png";
import paw from "@app/server/public/paw.png";
import pupcleIcon from "@app/server/public/pupcle_count.png";
import { StatusBar } from "expo-status-bar";
import { Field, Formik } from "formik";
import { StyledComponent } from "nativewind";
import React, { useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import { SolitoImage } from "solito/image";
import { Link, TextLink } from "solito/link";
import { Button, Tooltip, useTheme } from "tamagui";

import CustomInput from "../../../components/CustomInput";
import { useAuth } from "../../../utils/auth";

function RegisterTest() {
  const { signIn, userToken } = useAuth();
  const [shared, { data: sharedData }] = useSharedLazyQuery();
  const client = useApolloClient();

  const postResult = useCallback(
    async (result: any) => {
      signIn(result.data?.login?.access_token);
      // Success: refetch
      await client.clearStore();
    },
    [signIn, client]
  );
  const {
    usernameFieldPlaceholder,
    passwordFieldPlaceholder,
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  } = useLoginForm(true, postResult);
  const code = getCodeFromError(error);
  const theme = useTheme();

  return (
    <View className="h-full">
      <View className="flex h-[15%] justify-end bg-white">
        <Link href="/">
          <StyledComponent
            component={SolitoImage}
            className="h-[46px] w-[44px]"
            src={pupcleIcon}
            alt=""
            // fill
          />
        </Link>
      </View>
      <View className="flex h-[85%] flex-col justify-center pb-10">
        <View className="flex flex-row">
          <Text style={styles.pageTitle}>회원가입</Text>
          <View className="-top-[2px] ml-1">
            <StyledComponent
              component={SolitoImage}
              className="h-[28px] w-[43px]"
              src={paw}
              alt=""
              fill
            />
          </View>
        </View>
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, isValid, values }) => (
            <>
              <View style={styles.rowPadding}>
                <Text style={styles.textAboveInput}>이름</Text>
                <Tooltip>
                  {/* <Button icon={<HelpCircle size={14} />}></Button> */}
                </Tooltip>
              </View>
              <Field
                style={styles.input}
                component={CustomInput}
                name="name"
                placeholder="ex) 홍길동"
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
              <View style={styles.rowPadding}>
                <Text style={styles.textAboveInput}>이메일</Text>
              </View>
              <Field
                style={styles.input}
                component={CustomInput}
                name="email"
                placeholder="ex) honggildong@pupcle.com"
              />
              <View style={styles.rowPadding}>
                <Text style={styles.textAboveInput}>휴대폰 번호 (선택)</Text>
              </View>
              <Field
                style={styles.input}
                component={CustomInput}
                name="cell number"
                // placeholder={}
              />
              <View style={styles.rowPadding}>
                <Text style={styles.textAboveInput}>비밀번호</Text>
              </View>
              <Field
                style={styles.input}
                component={CustomInput}
                name="password"
                placeholder="8자 이상, 대, 소문자, 특수문자, 숫자 포함"
                secureTextEntry
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
                <Text style={styles.buttonText}>회원가입</Text>
              </Button>
              <View style={styles.viewMarginTop20}>
                <Button unstyled className="ml-1 h-[19px]">
                  {/* if checked, use the component below */}
                  {/* <StyledComponent
                    component={SolitoImage}
                    className="h-[19px] w-[19px]"
                    src={checkboxChecked}
                    alt=""
                    // fill
                  /> */}
                  <StyledComponent
                    component={SolitoImage}
                    className="h-[19px] w-[19px]"
                    src={checkboxUnchecked}
                    alt=""
                    // fill
                  />
                </Button>
                <Link href="/">
                  <Text style={styles.semiBoldBlueText}> 서비스 이용약관</Text>
                </Link>
                <Text style={styles.text}>에 동의합니다.</Text>
              </View>
            </>
          )}
        </Formik>
      </View>
    </View>
  );
}

export function RegisterScreen() {
  return (
    <View style={styles.container}>
      <RegisterTest />
    </View>
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
    marginTop: 40,
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
