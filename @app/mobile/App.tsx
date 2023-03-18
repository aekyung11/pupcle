import { useApolloClient } from "@apollo/client";
import { useLoginForm } from "@app/componentlib";
import { useSharedLazyQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import { StatusBar } from "expo-status-bar";
import { Field, Formik } from "formik";
import React, { useCallback } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

import CustomInput from "./components/CustomInput";
import { AuthProvider, useAuth } from "./utils/auth";
import { FederationProvider } from "./utils/FederationProvider";

function LoginTest() {
  const { signIn, userToken } = useAuth();
  const [shared, { data: sharedData }] = useSharedLazyQuery();
  const client = useApolloClient();

  const postResult = useCallback(
    async (result) => {
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

  return (
    <>
      <Text>Log In</Text>

      <View>
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, isValid, values }) => (
            <>
              <Field
                component={CustomInput}
                name="username"
                placeholder={usernameFieldPlaceholder}
              />
              <Field
                component={CustomInput}
                name="password"
                placeholder={passwordFieldPlaceholder}
                secureTextEntry
              />
              {error ? (
                <Text>
                  {extractError(error).message}
                  {code ? (
                    <Text>
                      {" "}
                      (Error code: <code>ERR_{code}</code>)
                    </Text>
                  ) : null}
                </Text>
              ) : null}
              <Button
                title={submitLabel}
                // @ts-ignore
                onPress={handleSubmit}
                disabled={!isValid || values.username === ""}
              />
            </>
          )}
        </Formik>
      </View>

      <View>
        <Button
          title="Get my name"
          onPress={() => shared()}
          disabled={!userToken}
        />
        <Text>My name: {sharedData?.currentUser?.name}</Text>
      </View>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FederationProvider>
        <View style={styles.container}>
          <LoginTest />
          <StatusBar style="auto" />
        </View>
      </FederationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
