import { ApolloError, FetchResult } from "@apollo/client";
import {
  DailyRecordStatus,
  HomePage_PrivateDailyRecordFragment,
  UpsertPrivateDailyRecordMutation,
  useUpsertPrivateDailyRecordMutation,
} from "@app/graphql";
import { FormikConfig } from "formik";
import { useCallback, useState } from "react";
import * as yup from "yup";
import { InferType } from "yup";

const submitLabel = "저장하기";

export enum PrivateDailyRecordTab {
  SLEEP = "sleep",
  DIET = "diet",
  WALKING = "walking",
  PLAY = "play",
  BATHROOM = "bathroom",
  HEALTH = "health",
}

const validationSchema = yup.object({
  status: yup
    .mixed<DailyRecordStatus>()
    .oneOf(Object.values(DailyRecordStatus)),
  comment: yup.string().nullable(),
});

type PrivateDailyRecordForm = InferType<typeof validationSchema>;

export function usePrivateDailyRecordForm(
  userId: string,
  petId: string,
  day: string,
  tab: PrivateDailyRecordTab,
  privateRecord: HomePage_PrivateDailyRecordFragment | undefined,
  postResult: (
    result: FetchResult<UpsertPrivateDailyRecordMutation>
  ) => Promise<any> | void
) {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [upsertPrivateDailyRecord] = useUpsertPrivateDailyRecordMutation();

  let statusKey: keyof HomePage_PrivateDailyRecordFragment = "sleepStatus";
  let status = null;
  let commentKey: keyof HomePage_PrivateDailyRecordFragment = "sleepComment";
  let comment = null;

  if (tab === PrivateDailyRecordTab.SLEEP) {
    statusKey = "sleepStatus";
    commentKey = "sleepComment";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === PrivateDailyRecordTab.DIET) {
    statusKey = "dietStatus";
    commentKey = "dietComment";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === PrivateDailyRecordTab.WALKING) {
    statusKey = "walkingStatus";
    commentKey = "walkingComment";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === PrivateDailyRecordTab.PLAY) {
    statusKey = "playStatus";
    commentKey = "playComment";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === PrivateDailyRecordTab.BATHROOM) {
    statusKey = "bathroomStatus";
    commentKey = "bathroomComment";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === PrivateDailyRecordTab.HEALTH) {
    statusKey = "healthStatus";
    commentKey = "healthComment";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }

  const dailyRecordStatus =
    status === DailyRecordStatus.Good || status === DailyRecordStatus.Bad
      ? status
      : undefined;

  const initialValues: PrivateDailyRecordForm = {
    status: dailyRecordStatus ?? undefined,
    comment: comment || null,
  } as unknown as PrivateDailyRecordForm;

  const handleSubmit: FormikConfig<PrivateDailyRecordForm>["onSubmit"] =
    useCallback(
      async (values, { setErrors: _setErrors }) => {
        setError(null);
        try {
          const result = await upsertPrivateDailyRecord({
            variables: {
              input: {
                privateDailyRecord: {
                  userId,
                  petId,
                  day,
                  [commentKey]: values.comment,
                  [statusKey]: values.status,
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
      [
        upsertPrivateDailyRecord,
        userId,
        petId,
        day,
        commentKey,
        statusKey,
        postResult,
      ]
    );

  return {
    submitLabel,
    validationSchema,
    initialValues,
    handleSubmit,
    error,
  };
}
