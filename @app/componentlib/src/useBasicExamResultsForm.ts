import { ApolloError, FetchResult } from "@apollo/client";
import {
  PupNotesPage_BasicExamResultsFragment,
  UpsertBasicExamResultsMutation,
  useDeleteBasicExamResultsAssetMutation,
  UserAssetKind,
  useUpsertBasicExamResultsAssetBatchMutation,
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
  const [deleteBasicExamResultsAsset] =
    useDeleteBasicExamResultsAssetMutation();
  const [upsertBasicExamResultsAssetBatch] =
    useUpsertBasicExamResultsAssetBatchMutation();
  const initialValues: BasicExamResultsInput = {
    takenAt: basicExamResults?.takenAt && new Date(basicExamResults?.takenAt),
    cost: basicExamResults?.cost?.amount,
    locationKakaoId: basicExamResults?.kakaoId,
    nextReservation:
      basicExamResults?.nextReservation &&
      new Date(basicExamResults?.nextReservation),
    files:
      basicExamResults?.basicExamResultAssets.nodes
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

          const newAssetIds = new Set(
            values.files.map((f) => f.assetId).filter((x) => !!x)
          );
          const removedAssetIds = initialValues.files
            .map((f) => f.assetId)
            .filter((id) => !!id && !newAssetIds.has(id));
          await Promise.all(
            removedAssetIds.map((id) =>
              deleteBasicExamResultsAsset({
                variables: {
                  input: {
                    id,
                  },
                },
              })
            )
          );

          // TODO: order assets
          await upsertBasicExamResultsAssetBatch({
            variables: {
              input: {
                basicExamResultAssets: values.files.map((f) => ({
                  id: f.assetId,
                  basicExamResultId: result.data?.upsertBasicExamResult
                    ?.basicExamResult?.id as unknown as string,
                  userId,
                  assetUrl: f.assetUrl,
                  kind: UserAssetKind.Image, // TODO: hardcoded
                  metadata: f.metadata,
                })),
              },
            },
          });

          // if creating a basic exam results, reset
          if (!basicExamResults?.id) {
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
        upsertBasicExamResults,
        basicExamResults?.id,
        basicExamCategoryId,
        petId,
        userId,
        initialValues.files,
        upsertBasicExamResultsAssetBatch,
        postResult,
        deleteBasicExamResultsAsset,
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
