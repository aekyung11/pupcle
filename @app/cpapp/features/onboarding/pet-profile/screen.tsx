import { ApolloError } from "@apollo/client";
import { PetInfoFormInput, usePetInfoForm } from "@app/componentlib";
import CustomInput from "@app/cpapp/components/CustomInput";
import DateTimePicker from "@app/cpapp/components/DateTimePicker";
import { FramedAvatarUpload } from "@app/cpapp/components/FramedAvatarUpload";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  PetGender,
  SharedLayout_UserFragment,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import female from "@app/server/public/female.png";
import femaleClicked from "@app/server/public/female_clicked.png";
import male from "@app/server/public/male.png";
import maleClicked from "@app/server/public/male_clicked.png";
import neutered from "@app/server/public/neutered.png";
import neuteredClicked from "@app/server/public/neutered_clicked.png";
import notNeutered from "@app/server/public/not_neutered.png";
import notNeuteredClicked from "@app/server/public/not_neutered_clicked.png";
import defaultAvatar from "@app/server/public/profile_default_avatar.png";
import { Field, Formik, useFormikContext } from "formik";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { useRouter } from "solito/navigation";
import { Button, Circle, RadioGroup, Tooltip } from "tamagui";

type PetProfileScreenFormInnerProps = {
  error: Error | ApolloError | null;
  submitLabel: string;
};

const PetProfileScreenFormInner: FC<PetProfileScreenFormInnerProps> = ({
  error,
  submitLabel,
}) => {
  const { handleSubmit, values, setFieldValue } =
    useFormikContext<PetInfoFormInput>();

  const onUpload = useCallback(
    async (avatarUrl: string | null | undefined) =>
      setFieldValue("avatarUrl", avatarUrl),
    [setFieldValue]
  );

  const onDobChange = useCallback(
    async (dob: Date) => setFieldValue("dob", dob),
    [setFieldValue]
  );

  const code = getCodeFromError(error);

  return (
    <>
      <View className="mb-8 flex flex-col items-center">
        <FramedAvatarUpload
          size="xsmall"
          avatarUrl={values.avatarUrl}
          disabled={false}
          onUpload={onUpload}
        />
      </View>
      <View style={styles.inputRow} className="flex flex-row justify-between">
        <Text style={styles.normalText}>이름</Text>
        <Field
          style={styles.input}
          component={CustomInput}
          name="name"
          placeholder="ex) 뽀삐"
          data-cy="petprofilepage-input-name"
        />
      </View>
      <View style={styles.inputRow} className="flex flex-row justify-between">
        <Text style={styles.normalText}>생년월일</Text>
        {/* <Field
          style={styles.input}
          component={CustomInput}
          name="dob"
          placeholder="ex) 2020-01-01"
          data-cy="petprofilepage-input-dob"
        /> */}
        <DateTimePicker type="date" date={values.dob} onChange={onDobChange} />
      </View>
      <View style={styles.inputRow} className="flex flex-row justify-between">
        <Text style={styles.normalText}>몸무게</Text>
        <Field
          style={styles.input}
          component={CustomInput}
          name="weight"
          data-cy="petprofilepage-input-weight"
        />
      </View>
      <View style={styles.inputRow} className="flex flex-row justify-between">
        <Text style={styles.normalText}>성별</Text>
        <View>
          <RadioGroup
            style={styles.radioGroupContainer}
            value={values.sex}
            onValueChange={(sex) => setFieldValue("sex", sex)}
          >
            <RadioGroup.Item value={PetGender.M} unstyled>
              <StyledComponent
                component={SolitoImage}
                className="h-[48px] w-[48px]"
                src={male}
                alt=""
                // fill
              />
              <RadioGroup.Indicator className="absolute" unstyled>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[48px] w-[48px]"
                  src={maleClicked}
                  alt=""
                  // fill
                />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
            <RadioGroup.Item value={PetGender.F} unstyled>
              <StyledComponent
                component={SolitoImage}
                className="h-[48px] w-[48px]"
                src={female}
                alt=""
                // fill
              />
              <RadioGroup.Indicator className="absolute" unstyled>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[48px] w-[48px]"
                  src={femaleClicked}
                  alt=""
                  // fill
                />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
          </RadioGroup>
        </View>
      </View>
      <View style={styles.inputRow} className="flex flex-row justify-between">
        <Text style={styles.normalText}>중성화 여부</Text>
        <View>
          <RadioGroup
            style={styles.radioGroupContainer}
            value={
              values.neutered === true
                ? "true"
                : values.neutered === false
                ? "false"
                : undefined
            }
            onValueChange={(n) => setFieldValue("neutered", n === "true")}
          >
            <RadioGroup.Item value="true" unstyled>
              <StyledComponent
                component={SolitoImage}
                className="h-[48px] w-[48px]"
                src={neutered}
                alt=""
                // fill
              />
              <RadioGroup.Indicator className="absolute" unstyled>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[48px] w-[48px]"
                  src={neuteredClicked}
                  alt=""
                  // fill
                />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
            <RadioGroup.Item value="false" unstyled>
              <StyledComponent
                component={SolitoImage}
                className="h-[48px] w-[48px]"
                src={notNeutered}
                alt=""
                // fill
              />
              <RadioGroup.Indicator className="absolute" unstyled>
                <StyledComponent
                  component={SolitoImage}
                  className="h-[48px] w-[48px]"
                  src={notNeuteredClicked}
                  alt=""
                  // fill
                />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
          </RadioGroup>
        </View>
      </View>
      {error ? (
        <Text>
          {extractError(error)?.["message"]}
          {code ? (
            <Text>
              {" "}
              (Error code: <code>ERR_{code}</code>)
            </Text>
          ) : null}
        </Text>
      ) : null}

      <Button
        unstyled
        style={styles.submitButton}
        title={submitLabel}
        // @ts-ignore
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>다음</Text>
      </Button>
    </>
  );
};

interface PetProfileScreenInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
  refetch: () => Promise<any>;
}

const PetProfileScreenInner: FC<PetProfileScreenInnerProps> = ({
  currentUser,
  next,
  refetch,
}) => {
  const router = useRouter();
  const postResult = useCallback(async () => {
    await refetch();
    router.push(next);
  }, [next, refetch, router]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    usePetInfoForm(currentUser.id, undefined, postResult);

  return (
    <View className="h-full" style={styles.container}>
      <View className="flex h-[20%] flex-col items-center justify-end pb-3">
        <Text style={styles.titleText}>반려견 정보</Text>
        <Text style={styles.normalText}>반려견의 정보를 입력해주세요.</Text>
      </View>
      <View className="flex h-[80%] flex-col justify-center pb-10">
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          <PetProfileScreenFormInner submitLabel={submitLabel} error={error} />
        </Formik>
      </View>
    </View>
  );
};

type PetProfileScreenParams = {
  next?: string;
};

export function PetProfileScreen() {
  const { useParam } = createParam<PetProfileScreenParams>();
  const [rawNext] = useParam("next");
  const query = useSharedQuery();
  const refetch = async () => query.refetch();
  const next: string = isSafe(rawNext) ? rawNext! : "/";

  return (
    <SharedLayout
      title="pet-profile"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <PetProfileScreenInner
          refetch={refetch}
          next={next}
          currentUser={query.data?.currentUser}
        />
      )}
    </SharedLayout>
  );

  // return (
  //   <View style={styles.container}>
  //     <PetProfileScreenInner />
  //   </View>
  // );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // height: "100%",
    backgroundColor: "white",
    alignItems: "center",
    // paddingTop: "45%",
    // justifyContent: "center",
  },
  titleText: {
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 24,
  },
  normalText: {
    fontFamily: "Poppins",
    fontSize: 16,
  },
  normalBlueText: {
    fontFamily: "Poppins",
    fontSize: 16,
    color: "#7FB3E8",
  },
  inputRow: {
    width: 310,
    height: 48,
    marginTop: 20,
    display: "flex",
    alignItems: "center",
  },
  input: {
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderRadius: 24,
    borderColor: "#7FB3E8",
    borderWidth: 1,
    borderStyle: "solid",
    height: 48,
    width: 220,
    fontFamily: "'Poppins'",
    position: "relative",
    fontSize: 16,
    marginTop: 2,
  },
  radioGroupContainer: {
    width: 220,
    height: 48,
    marginTop: 20,
    paddingHorizontal: 36,
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  viewMarginTop12: {
    width: 310,
    marginTop: 12,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  viewMarginTop20: {
    width: 310,
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontFamily: "'Poppins'",
    color: "#8F9092",
    fontSize: 16,
  },
  boldBlueText: {
    fontFamily: "'Poppins'",
    color: "#7FB3E8",
    fontWeight: "700",
    fontSize: 16,
  },
  semiBoldBlueText: {
    fontFamily: "'Poppins'",
    color: "#7FB3E8",
    fontWeight: "600",
    fontSize: 16,
  },
  submitButton: {
    marginTop: 60,
    width: 310,
    height: 48,
    backgroundColor: "#7FB3E8",
    borderRadius: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Poppins",
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  pageTitle: {
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 24,
    marginBottom: 10,
  },
});
