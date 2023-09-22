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

// from the db
const assetMetadataSchema = yup.object({
  name: yup.string().required(),
  type: yup.string().required(),
  size: yup.number().required(),
});

const formFileSchema = yup.object({
  kind: yup.string().required(), // photo (?)
  assetUrl: yup.string().required(),
  metadata: assetMetadataSchema.required(),

  // used to track removal
  uppyFileId: yup.string().optional(),
  uppyPreview: yup.string().optional(),
});

export type FormFile = InferType<typeof formFileSchema>;

const submitLabel = "Save";

const validationSchema = yup.object({
  takenAt: yup.date().optional(),
  cost: yup.string().optional(),
  locationKakaoId: yup.string().optional(),
  nextReservation: yup.date().optional(),
  files: yup.array(formFileSchema).required(),
  memo: yup.string().optional(),
});

export type BasicExamResultsInput = InferType<typeof validationSchema>;

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
    files:
      basicExamResults?.basicExamResultAssets.nodes
        .filter((asset) => asset.assetUrl)
        .map((asset) => ({
          kind: asset.kind,
          assetUrl: asset.assetUrl!,
          metadata: {
            name: "" + (asset.metadata["name"] || ""),
            size: Number(asset.metadata["size"] || 0),
            type: "" + (asset.metadata["type"] || ""),
          },
        })) ?? [],
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
