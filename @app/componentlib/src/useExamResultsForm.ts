import { ApolloError, FetchResult } from "@apollo/client";
import {
  PupNotesPage_ExamResultsFragment,
  UpsertExamResultsMutation,
  useDeleteExamResultsAssetMutation,
  UserAssetKind,
  useUpsertExamResultsAssetBatchMutation,
  useUpsertExamResultsMutation,
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
  assetId: yup.string().optional(),
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
  takenAt: yup.date().optional().nullable(),
  cost: yup.string().optional(),
  locationKakaoId: yup.string().optional().nullable(),
  nextReservation: yup.date().optional().nullable(),
  files: yup.array(formFileSchema).required(),
  memo: yup.string().optional(),
  examData: yup
    .object({
      points: yup.array(
        yup
          .object({
            bucket: yup.string().required(),
            type: yup.string().required(), // "number"
            value: yup.number().required(), // user needs to remove empty data points
          })
          .required()
      ),
    })
    .optional()
    .nullable(),
});

export type ExamResultsInput = InferType<typeof validationSchema>;

export function useExamResultsForm(
  userId: string,
  petId: string,
  examCategoryId: string,
  examCategoryHasData: boolean,
  examResults: PupNotesPage_ExamResultsFragment | undefined,
  postResult: (
    result: FetchResult<UpsertExamResultsMutation>
  ) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [upsertExamResults] = useUpsertExamResultsMutation();
  const [deleteExamResultsAsset] = useDeleteExamResultsAssetMutation();
  const [upsertExamResultsAssetBatch] =
    useUpsertExamResultsAssetBatchMutation();
  const initialValues: ExamResultsInput = {
    takenAt: examResults?.takenAt && new Date(examResults?.takenAt),
    cost: examResults?.cost?.amount,
    locationKakaoId: examResults?.kakaoId,
    nextReservation:
      examResults?.nextReservation && new Date(examResults?.nextReservation),
    files:
      examResults?.examResultAssets.nodes
        .filter((asset) => asset.assetUrl)
        .map((asset) => ({
          assetId: asset.id,
          kind: asset.kind,
          assetUrl: asset.assetUrl!,
          metadata: {
            name: "" + (asset.metadata["name"] || ""),
            size: Number(asset.metadata["size"] || 0),
            type: "" + (asset.metadata["type"] || ""),
          },
        })) ?? [],
    memo: examResults?.memo,
    examData: examCategoryHasData ? examResults?.examData : undefined,
  } as unknown as ExamResultsInput;
  const handleSubmit: FormikConfig<ExamResultsInput>["onSubmit"] = useCallback(
    async (values, { setErrors: _setErrors, resetForm }) => {
      setError(null);
      try {
        const result = await upsertExamResults({
          variables: {
            input: {
              examResult: {
                id: examResults?.id,
                examCategoryId,
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
                ...(examCategoryHasData &&
                  values.examData && {
                    examData: values.examData,
                  }),
              },
            },
          },
        });

        const newAssetIds = new Set(
          values.files.map((f) => f.assetId).filter((x) => !!x)
        );
        const removedAssetIds = initialValues.files
          .map((f) => f.assetId)
          .filter((id) => !!id && !newAssetIds.has(id));
        await Promise.all(
          removedAssetIds.map((id) =>
            deleteExamResultsAsset({
              variables: {
                input: {
                  id,
                },
              },
            })
          )
        );

        // TODO: order assets
        await upsertExamResultsAssetBatch({
          variables: {
            input: {
              examResultAssets: values.files.map((f) => ({
                id: f.assetId,
                examResultId: result.data?.upsertExamResult?.examResult
                  ?.id as unknown as string,
                userId,
                assetUrl: f.assetUrl,
                kind: UserAssetKind.Image, // TODO: hardcoded
                metadata: f.metadata,
              })),
            },
          },
        });

        // if creating a exam results, reset
        if (!examResults?.id) {
          resetForm();
        }

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
      upsertExamResults,
      examResults?.id,
      examCategoryId,
      petId,
      userId,
      examCategoryHasData,
      initialValues.files,
      upsertExamResultsAssetBatch,
      postResult,
      deleteExamResultsAsset,
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
