import { ApolloError, FetchResult } from "@apollo/client";
import {
  PoiSummaries_PoiReviewFragment,
  UpsertPoiReviewMutation,
  useUpsertPoiReviewMutation,
} from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "게시";

const validationSchema = yup.object({
  rating: yup.number().required(),
  comment: yup.string(),
});

type PoiReviewForm = InferType<typeof validationSchema>;

export function usePoiReviewForm(
  userId: string,
  poiReview: PoiSummaries_PoiReviewFragment,
  postResult: (
    result: FetchResult<UpsertPoiReviewMutation>
  ) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [upsertPoiReview] = useUpsertPoiReviewMutation();
  const initialValues: PoiReviewForm = {
    rating: poiReview.rating,
    comment: poiReview.comment ?? "",
  } as unknown as PoiReviewForm;
  const handleSubmit: FormikConfig<PoiReviewForm>["onSubmit"] = useCallback(
    async (values, { setErrors: _setErrors }) => {
      setError(null);
      try {
        const result = await upsertPoiReview({
          variables: {
            input: {
              poiReview: {
                poiId: "00000000-0000-0000-0000-000000000000",
                kakaoId: poiReview.kakaoId,
                userId,
                rating: values.rating,
                comment: values.comment || null,
              },
            },
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
    [upsertPoiReview, poiReview.kakaoId, userId, postResult]
  );

  return {
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
