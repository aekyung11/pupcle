import { ApolloError, FetchResult } from "@apollo/client";
import {
  PupNotesPage_ExamCategoryFragment,
  UpsertExamCategoryMutation,
  useUpsertExamCategoryMutation,
} from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "Save";

const validationSchema = yup.object({
  name: yup.string().required("**Please enter the category name**"),
});

type ExamCategoryForm = InferType<typeof validationSchema>;

export function useExamCategoryForm(
  userId: string,
  // add a hasData, comes from the mode on the exams page
  category: PupNotesPage_ExamCategoryFragment | undefined,
  postResult: (
    result: FetchResult<UpsertExamCategoryMutation>
  ) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [upsertExamCategory] = useUpsertExamCategoryMutation();
  const initialValues: ExamCategoryForm = {
    name: category?.name ?? "",
  } as unknown as ExamCategoryForm;
  const handleSubmit: FormikConfig<ExamCategoryForm>["onSubmit"] = useCallback(
    async (values, { setErrors: _setErrors }) => {
      setError(null);
      try {
        const result = await upsertExamCategory({
          variables: {
            input: {
              examCategory: {
                id: category?.id,
                userId,
                name: values.name,
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
    [upsertExamCategory, category?.id, userId, postResult]
  );

  return {
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
