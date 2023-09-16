import { ApolloError, FetchResult } from "@apollo/client";
import {
  CreatePetMutation,
  PetGender,
  PetKind,
  SharedLayout_PetFragment,
  UpdatePetMutation,
  useCreatePetMutation,
  useUpdatePetMutation,
  WeightUnit,
} from "@app/graphql";
import { format, parseISO } from "date-fns";
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
  pet: SharedLayout_PetFragment | undefined,
  postResult: (
    result: FetchResult<CreatePetMutation> | FetchResult<UpdatePetMutation>
  ) => Promise<any> | void
) {
  console.log({ pet });
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [createPet] = useCreatePetMutation();
  const [updatePet] = useUpdatePetMutation();
  const initialValues: PetInfoFormInput = {
    name: pet?.name ?? "",
    dob: pet?.dob ? parseISO(pet?.dob) : undefined,
    weight: pet?.weight?.value,
    sex: pet?.gender,
    neutered: pet?.neutered,
  } as unknown as PetInfoFormInput;
  const handleSubmit: FormikConfig<PetInfoFormInput>["onSubmit"] = useCallback(
    async (values, { setErrors: _setErrors }) => {
      setError(null);
      try {
        const currentPetId = pet?.id;
        const result = currentPetId
          ? await updatePet({
              variables: {
                input: {
                  id: currentPetId,
                  patch: {
                    avatarUrl: values.avatarUrl,
                    dob: format(values.dob, "yyyy-MM-dd"),
                    gender: values.sex,
                    name: values.name,
                    neutered: values.neutered,
                    weight: {
                      unit: WeightUnit.Kg,
                      value: Number(values.weight),
                    },
                  },
                },
              },
            })
          : await createPet({
              variables: {
                input: {
                  pet: {
                    userId,
                    avatarUrl: values.avatarUrl,
                    dob: format(values.dob, "yyyy-MM-dd"),
                    gender: values.sex,
                    kind: PetKind.Dog,
                    name: values.name,
                    neutered: values.neutered,
                    weight: {
                      unit: WeightUnit.Kg,
                      value: Number(values.weight),
                    },
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
    [createPet, updatePet, postResult, pet, userId]
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
