import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "Next";

const validationSchema = yup.object({
  categoryId: yup.string().required("**Please choose a category**"),
});

type NewExamResultsCategoryForm = InferType<typeof validationSchema>;

export function useNewExamResultsCategoryForm(
  categoryId: string | undefined,
  postResult: (result: string) => Promise<any> | void
) {
  const [error, setError] = useState<Error | null>(null);
  const initialValues: NewExamResultsCategoryForm = {
    categoryId: categoryId || undefined,
  } as unknown as NewExamResultsCategoryForm;
  const handleSubmit: FormikConfig<NewExamResultsCategoryForm>["onSubmit"] =
    useCallback(
      async (values, { setErrors: _setErrors }) => {
        setError(null);
        try {
          const postResultReturn = postResult(values.categoryId);
          if (postResultReturn instanceof Promise) {
            await postResultReturn;
          }
        } catch (e) {
          if (e instanceof Error) {
            setError(e);
          }
        }
      },
      [postResult]
    );

  return {
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
