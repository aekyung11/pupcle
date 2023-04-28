import { ApolloError, FetchResult } from "@apollo/client";
import {
  RegisterInput,
  RegisterMutation,
  useRegisterMutation,
  useUpdateUserEntryMutation,
} from "@app/graphql";
import { getCodeFromError, getExceptionFromError } from "@app/lib";
import { FormikConfig } from "formik";
import { GraphQLError } from "graphql";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

// const usernameFieldPlaceholder = "";
// const passwordFieldPlaceholder = "";
const submitLabel = "Create an account";

const validationSchema = yup.object({
  name: yup.string().required("Please enter your name"),
  username: yup
    .string()
    .required("Please enter your username")
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
  email: yup.string().email().required("Please enter your email"),
  password: yup
    .string()
    .required("Please enter your password")
    .min(8, "Must be 8 characters or more")
    .matches(/[a-z]+/, "One lowercase character")
    .matches(/[A-Z]+/, "One uppercase character")
    .matches(/[@$!%*#?&]+/, "One special character")
    .matches(/\d+/, "One number"),
  agreedToTerms: yup
    .boolean()
    .required("Please agree to the terms")
    .oneOf([true], "Please agree to the terms"),
});

type RegisterFormInput = InferType<typeof validationSchema>;

export function useRegisterForm(
  postResult: (result: FetchResult<RegisterMutation>) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [register] = useRegisterMutation();
  const [updateUserEntry] = useUpdateUserEntryMutation();
  const initialValues: RegisterFormInput = {
    name: "",
    username: "",
    email: "",
    password: "",
    agreedToTerms: false,
  };
  const handleSubmit: FormikConfig<RegisterFormInput>["onSubmit"] = useCallback(
    async (values, { setErrors }) => {
      setError(null);
      try {
        const { name, ...rest } = values;
        const result = await register({
          variables: rest,
        });
        const userId = result.data?.register?.user.id;
        if (userId) {
          await updateUserEntry({
            variables: {
              userId,
              patch: {
                name,
              },
            },
          });
        }

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
        if (code === "WEAKP") {
          setErrors({
            password:
              "The server believes this password is too weak, please make it stronger",
          });
        } else if (code === "EMTKN") {
          setErrors({
            email:
              "An account with this email address has already been registered, consider using the 'Forgot passphrase' function.",
          });
        } else if (code === "NUNIQ" && fields && fields[0] === "username") {
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
    [register, postResult, updateUserEntry]
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
