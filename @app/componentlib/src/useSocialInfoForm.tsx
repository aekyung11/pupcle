import { ApolloError, FetchResult } from "@apollo/client";
import { UpdateUserMutation, useUpdateUserMutation } from "@app/graphql";
import { getCodeFromError, getExceptionFromError } from "@app/lib";
import { FormikConfig } from "formik";
import { GraphQLError } from "graphql";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "next";

const validationSchema = yup.object({
  nickname: yup.string().required("Please enter your nickname"),
  username: yup
    .string()
    .required("Please enter your ID")
    .min(2, "Must be 2 characters or more")
    .max(24, "Must be no more than 24 characters long")
    .matches(/^([a-zA-Z]|$)/, "Must start with a letter")
    .matches(
      /^([^_]|_[^_]|_$)*$/,
      "Must not contain two underscores next to each other"
    )
    .matches(
      /^[a-zA-Z0-9_]*$/,
      "Must contain only alphanumeric characters and underscores."
    ),
  // TODO: avatarUrl
});

type SocialInfoFormInput = InferType<typeof validationSchema>;

export function useSocialInfoForm(
  userId: string,
  postResult: (result: FetchResult<UpdateUserMutation>) => Promise<any> | void,
  initialNickname?: string | null,
  initialUsername?: string | null
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [updateUser] = useUpdateUserMutation();
  const initialValues: SocialInfoFormInput = {
    nickname: initialNickname || "",
    username: initialUsername || "",
  };
  const handleSubmit: FormikConfig<SocialInfoFormInput>["onSubmit"] =
    useCallback(
      async (values, { setErrors }) => {
        setError(null);
        try {
          const result = await updateUser({
            variables: {
              id: userId,
              patch: values,
            },
          });

          const postResultReturn = postResult(result);
          if (postResultReturn instanceof Promise) {
            await postResultReturn;
          }
        } catch (e) {
          let code = undefined;
          let exception = undefined;
          let fields = undefined;
          if (
            e instanceof Error ||
            e instanceof ApolloError ||
            e instanceof GraphQLError
          ) {
            code = getCodeFromError(e);
            exception = getExceptionFromError(e);
            fields = exception?.extensions?.fields ?? exception?.fields;
          }

          if (code === "NUNIQ" && fields && fields[0] === "username") {
            setErrors({
              username:
                "An account with this username has already been registered, please try a different username.",
            });
          } else if (code === "23514") {
            setErrors({
              username:
                "This username is not allowed; usernames must be between 2 and 24 characters long (inclusive), must start with a letter, and must contain only alphanumeric characters and underscores.",
            });
          } else if (e instanceof Error) {
            setError(e);
          }
        }
      },
      [updateUser, userId, postResult]
    );

  return {
    // usernameFieldPlaceholder,
    // passwordFieldPlaceholder,
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
