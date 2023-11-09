import { ApolloError, FetchResult } from "@apollo/client";
import {
  SharedLayout_UserEntryFragment,
  UpdateUserEntryMutation,
  useUpdateUserEntryMutation,
} from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "next";

const validationSchema = yup.object({
  name: yup.string().required("Please enter your name"),
  phone: yup.string().optional(),
  address: yup
    .object({
      address1: yup.string().optional(),
      address2: yup.string().optional(),
      postalCode: yup.string().optional(),
    })
    .optional(),
});

export type PrivateInfoFormInput = InferType<typeof validationSchema>;

export function usePrivateInfoForm(
  userEntry: SharedLayout_UserEntryFragment,
  postResult: (
    result: FetchResult<UpdateUserEntryMutation>
  ) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [updateUserEntry] = useUpdateUserEntryMutation();
  const initialValues: PrivateInfoFormInput = {
    name: userEntry.name || "",
    phone: userEntry.phone || "",
    address: userEntry.address || {},
  };
  const handleSubmit: FormikConfig<PrivateInfoFormInput>["onSubmit"] =
    useCallback(
      async (values, { setErrors: _setErrors }) => {
        setError(null);
        try {
          const result = await updateUserEntry({
            variables: {
              userId: userEntry.userId,
              patch: values,
            },
          });

          const postResultReturn = postResult(result);
          if (postResultReturn instanceof Promise) {
            await postResultReturn;
          }
        } catch (e) {
          if (e instanceof Error) {
            setError(e);
          }
        }
      },
      [updateUserEntry, userEntry.userId, postResult]
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
