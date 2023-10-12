import { useApolloClient } from "@apollo/client";
import { useLoginForm } from "@app/componentlib";
import { View } from "@app/cpapp/design/view";
import { useSharedLazyQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import { StatusBar } from "expo-status-bar";
import { Field, Formik } from "formik";
import React, { useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import { Link, TextLink } from "solito/link";
import { Button, useTheme } from "tamagui";

import CustomInput from "../../components/CustomInput";
import { useAuth } from "../../utils/auth";

function LoginTest() {
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
    <>
      <View>
        <View>
          <Text style={styles.pageTitle}>로그인</Text>
        </View>
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, isValid, values }) => (
            <>
              <View className="w-[310px] px-10" style={styles.rowPadding}>
                <Text style={styles.textAboveInput}>Email</Text>
              </View>
              <Field
                style={styles.input}
                component={CustomInput}
                name="username"
                placeholder={usernameFieldPlaceholder}
              />
              <View className="w-[310px] px-10" style={styles.rowPadding}>
                <Text style={styles.textAboveInput}>Password</Text>
              </View>
              <Field
                style={styles.input}
                component={CustomInput}
                name="password"
                placeholder={passwordFieldPlaceholder}
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
              <View style={styles.viewMarginTop12}>
                <Text style={styles.text}>Forgot Password ?</Text>
                <Link href="/">
                  <Text style={styles.boldBlueText}> click</Text>
                </Link>
              </View>

              <Button
                unstyled
                style={styles.submitButton}
                title={submitLabel}
                // @ts-ignore
                onPress={handleSubmit}
                disabled={!isValid || values.username === ""}
              >
                <Text style={styles.buttonText}>Sign in</Text>
              </Button>
              <View style={styles.viewMarginTop20}>
                <Text style={styles.text}>계정이 없으십니까?</Text>
                <Link href="/">
                  <Text style={styles.semiBoldBlueText}> Sign up</Text>
                </Link>
              </View>
            </>
          )}
        </Formik>
      </View>
    </>
  );
}

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <LoginTest />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    height: "100%",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
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
  },
  textAboveInput: {
    fontFamily: "'Poppins'",
    color: "#8F9092",
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
    justifyContent: "center",
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
    marginTop: 96,
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
    fontSize: 28,
    marginBottom: 72,
  },
});
