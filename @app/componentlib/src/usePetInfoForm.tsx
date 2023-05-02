import { ApolloError, FetchResult } from "@apollo/client";
import {
  CreatePetMutation,
  PetGender,
  PetKind,
  useCreatePetMutation,
  WeightUnit,
} from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "Save";

const validationSchema = yup.object({
  name: yup.string().required("Please enter your pet's name"),
  dob: yup.date().required("Please enter your pet's birthday"),
  // TODO: allow unit choices
  weight: yup.number().required("Please enter your pet's weight"),
  sex: yup
    .mixed<PetGender>()
    .oneOf(Object.values(PetGender))
    .required("Please provide your pet's sex"),
  neutered: yup.boolean().required("Please provide your pet's neutered status"),
  avatarUrl: yup.string(),
});

type PetInfoFormInput = InferType<typeof validationSchema>;

export function usePetInfoForm(
  userId: string,
  postResult: (result: FetchResult<CreatePetMutation>) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [createPet] = useCreatePetMutation();
  const initialValues: PetInfoFormInput = {
    name: "",
    dob: undefined,
    weight: undefined,
    sex: undefined,
    neutered: undefined,
  } as unknown as PetInfoFormInput;
  const handleSubmit: FormikConfig<PetInfoFormInput>["onSubmit"] = useCallback(
    async (values, { setErrors: _setErrors }) => {
      setError(null);
      try {
        const result = await createPet({
          variables: {
            input: {
              pet: {
                avatarUrl: values.avatarUrl,
                dob: values.dob,
                gender: values.sex,
                kind: PetKind.Dog,
                name: values.name,
                neutered: values.neutered,
                weight: { unit: WeightUnit.Kg, value: values.weight },
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
    [createPet, postResult]
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
