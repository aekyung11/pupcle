import { useCreateMissionInviteMutation } from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "초대 보내기";

const validationSchema = yup.object({
  missionId: yup.string().required("**Please choose a mission**"),
});

type MissionInviteForm = InferType<typeof validationSchema>;

export function useMissionInviteForm(
  currentUserId: string,
  toUserId: string,
  missionId: string | undefined,
  postResult: (result: string) => Promise<any> | void
) {
  const [error, setError] = useState<Error | null>(null);
  const [createMissionInvite] = useCreateMissionInviteMutation();

  const initialValues: MissionInviteForm = {
    missionId: missionId || undefined,
  } as unknown as MissionInviteForm;
  const handleSubmit: FormikConfig<MissionInviteForm>["onSubmit"] = useCallback(
    async (values, { setErrors: _setErrors }) => {
      setError(null);
      try {
        await createMissionInvite({
          variables: {
            input: {
              missionInvite: {
                fromUserId: currentUserId,
                toUserId,
                missionId: values.missionId,
              },
            },
          },
        });
        const postResultReturn = postResult(values.missionId);
        if (postResultReturn instanceof Promise) {
          await postResultReturn;
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e);
        }
      }
    },
    [createMissionInvite, currentUserId, postResult, toUserId]
  );

  return {
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
