import { ApolloError, FetchResult } from "@apollo/client";
import {
  PupNotesPage_BasicExamResultsFragment,
  UpsertBasicExamResultsMutation,
  useUpsertBasicExamResultsMutation,
} from "@app/graphql";
import { formatISO } from "date-fns";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "Save";

const validationSchema = yup.object({
  takenAt: yup.date(),
  cost: yup.string(),
  locationKakaoId: yup.string(),
  nextReservation: yup.date(),
  // assets
  memo: yup.string(),
});

type BasicExamResultsInput = InferType<typeof validationSchema>;

export function useBasicExamResultsForm(
  userId: string,
  petId: string,
  basicExamCategoryId: string,
  basicExamResults: PupNotesPage_BasicExamResultsFragment | undefined,
  postResult: (
    result: FetchResult<UpsertBasicExamResultsMutation>
  ) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [upsertBasicExamResults] = useUpsertBasicExamResultsMutation();
  const initialValues: BasicExamResultsInput = {
    name: basicExamResults?.takenAt ?? "",
    cost: basicExamResults?.cost?.amount,
    locationKakaoId: basicExamResults?.kakaoId,
    nextReservation: basicExamResults?.nextReservation,
    // assets
    memo: basicExamResults?.memo,
  } as unknown as BasicExamResultsInput;
  const handleSubmit: FormikConfig<BasicExamResultsInput>["onSubmit"] =
    useCallback(
      async (values, { setErrors: _setErrors, resetForm }) => {
        setError(null);
        try {
          const result = await upsertBasicExamResults({
            variables: {
              input: {
                basicExamResult: {
                  id: basicExamResults?.id,
                  basicExamCategoryId,
                  petId,
                  userId,
                  ...(values.cost != null && {
                    cost: {
                      amount: values.cost,
                      currency: "KRW",
                    },
                  }),
                  kakaoId: values.locationKakaoId,
                  poiId: "00000000-0000-0000-0000-000000000000",
                  memo: values.memo,
                  nextReservation:
                    values.nextReservation && formatISO(values.nextReservation),
                  takenAt: values.takenAt && formatISO(values.takenAt),
                },
              },
            },
          });
          resetForm();
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
      [
        basicExamResults?.id,
        upsertBasicExamResults,
        basicExamCategoryId,
        petId,
        userId,
        postResult,
      ]
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
