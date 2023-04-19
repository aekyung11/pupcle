import { ApolloError, FetchResult } from "@apollo/client";
import { LoginInput, LoginMutation, useLoginMutation } from "@app/graphql";
import { getCodeFromError } from "@app/lib";
import { FormikConfig } from "formik";
import { GraphQLError } from "graphql";
import { useCallback, useState } from "react";
import * as yup from "yup";

const usernameFieldPlaceholder = "";
const passwordFieldPlaceholder = "";
const submitLabel = "Sign in";

const validationSchema = yup.object({
  username: yup.string().required("Please enter your email address"),
  password: yup.string().required("Please enter your password"),
  useAccessToken: yup.boolean().required(),
});

export function useLoginForm(
  useAccessToken: boolean,
  postResult: (result: FetchResult<LoginMutation>) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [login] = useLoginMutation();
  const initialValues: LoginInput = {
    username: "",
    password: "",
    useAccessToken,
  };
  const handleSubmit: FormikConfig<LoginInput>["onSubmit"] = useCallback(
    async (values, { setErrors }) => {
      setError(null);
      try {
        const result = await login({
          variables: values,
        });

        const postResultReturn = postResult(result);
        if (postResultReturn instanceof Promise) {
          await postResultReturn;
        }
      } catch (e) {
        let code = undefined;
        if (
          e instanceof Error ||
          e instanceof ApolloError ||
          e instanceof GraphQLError
        ) {
          code = getCodeFromError(e);
        }
        if (code === "CREDS") {
          setErrors({ password: "Incorrect username or password" });
        } else if (e instanceof Error) {
          setError(e);
        }
      }
    },
    [login, postResult]
  );

  return {
    usernameFieldPlaceholder,
    passwordFieldPlaceholder,
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
