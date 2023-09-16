import { ApolloError, FetchResult } from "@apollo/client";
import {
  PupNotesPage_BasicExamCategoryFragment,
  UpsertBasicExamCategoryMutation,
  useUpsertBasicExamCategoryMutation,
} from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "Save";

const validationSchema = yup.object({
  name: yup.string().required("**Please enter the category name**"),
});

type BasicExamCategoryForm = InferType<typeof validationSchema>;

export function useBasicExamCategoryForm(
  userId: string,
  category: PupNotesPage_BasicExamCategoryFragment | undefined,
  postResult: (
    result: FetchResult<UpsertBasicExamCategoryMutation>
  ) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [upsertBasicExamCategory] = useUpsertBasicExamCategoryMutation();
  const initialValues: BasicExamCategoryForm = {
    name: category?.name ?? "",
  } as unknown as BasicExamCategoryForm;
  const handleSubmit: FormikConfig<BasicExamCategoryForm>["onSubmit"] =
    useCallback(
      async (values, { setErrors: _setErrors }) => {
        setError(null);
        try {
          const result = await upsertBasicExamCategory({
            variables: {
              input: {
                basicExamCategory: {
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
      [upsertBasicExamCategory, category?.id, userId, postResult]
    );

  return {
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
