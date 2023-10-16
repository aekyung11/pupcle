import { ApolloError, FetchResult } from "@apollo/client";
import {
  CompleteMissionMutation,
  useCompleteMissionMutation,
} from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "제 출 하 기";

const validationSchema = yup.object({
  proofImageUrl: yup
    .string()
    .required()
    .test({
      name: "is-valid",
      test(value, ctx) {
        const { verifiedImage } = ctx.parent;
        if (verifiedImage === null) {
          return ctx.createError({
            message: "Please wait for image verification",
          });
        }
        if (verifiedImage === false) {
          return ctx.createError({ message: "Please take a more clear image" });
        }
        return true;
      },
    }),
  verifiedImage: yup
    .bool()
    .nullable()
    .oneOf([true], "Please take a clearer picture"),
});

export type CompleteMissionFormInput = InferType<typeof validationSchema>;

export function useCompleteMissionForm(
  userId: string,
  missionId: string,
  postResult: (
    result: FetchResult<CompleteMissionMutation>
  ) => Promise<any> | void,
  initialProofImageUrl?: string | null
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [completeMission] = useCompleteMissionMutation();
  const initialValues: CompleteMissionFormInput = {
    proofImageUrl: initialProofImageUrl || "",
    verifiedImage: null,
  };
  const handleSubmit: FormikConfig<CompleteMissionFormInput>["onSubmit"] =
    useCallback(
      async (values) => {
        setError(null);
        try {
          const result = await completeMission({
            variables: {
              missionId,
              proofImageUrl: values.proofImageUrl,
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
      [completeMission, missionId, postResult]
    );

  return {
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
