import { usePetInfoForm } from "@app/componentlib";
import {
  AuthRestrict,
  DayPickerInput,
  FourOhFour,
  FramedAvatarUpload,
  SharedLayout,
} from "@app/components";
import {
  PetGender,
  PupNotesPage_PetFragment,
  PupNotesPage_UserFragment,
  SharedLayout_PetFragment,
  SharedLayout_UserFragment,
  usePupNotesPageQuery,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as Tabs from "@radix-ui/react-tabs";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Alert, Button, Col, InputRef, Row } from "antd";
import clsx from "clsx";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import Router, { useRouter } from "next/router";
import * as React from "react";
import { FC, useCallback, useEffect, useRef, useState } from "react";

interface PupNotesPageProps {
  next: string | null;
}

enum Tab {
  INFO = "info",
  BASIC = "basic",
  DETAILED = "detailed",
  CHART = "chart",
}

export function usePetId() {
  const router = useRouter();
  const { petId } = router.query;
  return String(petId);
}

const PupNotes: NextPage<PupNotesPageProps> = () => {
  const query = usePupNotesPageQuery();
  const refetch = async () => query.refetch();
  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.INFO);

  const currentUser = query.data?.currentUser;
  const currentUserId = currentUser?.id as string | undefined;
  const petId = usePetId();
  const currentPet = query.data?.currentUser?.pets.nodes.find(
    (p) => p.id === petId
  );
  if (query.loading) {
    return <p>Loading...</p>;
  }
  if (!currentPet || !currentUser || !currentUserId) {
    return (
      <SharedLayout
        title="pup-notes"
        query={query}
        useLightBlueFrame
        forbidWhen={AuthRestrict.LOGGED_OUT}
      >
        <FourOhFour currentUser={query.data?.currentUser} />
      </SharedLayout>
    );
  }

  return (
    <SharedLayout
      title="pup-notes"
      query={query}
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <div
        style={{
          padding: "40px 0px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: "10px",
          width: "220px",
          height: "125px",
        }}
      >
        <span className="font-poppins text-pupcle-30px font-semibold">
          My Pup’s Note
        </span>
      </div>
      <Tabs.Root
        value={selectedTab}
        onValueChange={(newValue) => {
          setSelectedTab(newValue as Tab);
        }}
        style={{ display: "flex", height: "calc(100vh - 96px - 125px)" }}
      >
        <Tabs.List>
          <div
            style={{
              width: "220px",
              display: "flex",
              flexDirection: "column",
              marginTop: "10px",
            }}
          >
            <Tabs.Trigger key={Tab.INFO} value={Tab.INFO} asChild>
              <Button
                className="friends-tab"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "0 25px 25px 0",
                }}
              >
                <span
                  className="font-poppins text-pupcle-20px font-semibold"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "min(20px, 14px + 0.2vw)",
                    fontWeight: 600, // if selected, 700
                  }}
                >
                  기본 정보
                </span>
              </Button>
            </Tabs.Trigger>
            <Tabs.Trigger key={Tab.BASIC} value={Tab.BASIC} asChild>
              <Button
                className="friends-tab"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "0 25px 25px 0",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "min(20px, 14px + 0.2vw)",
                    fontWeight: 600,
                  }}
                >
                  기본 검사
                </span>
              </Button>
            </Tabs.Trigger>
            <Tabs.Trigger key={Tab.DETAILED} value={Tab.DETAILED} asChild>
              <Button
                className="friends-tab"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "0 25px 25px 0",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "min(20px, 14px + 0.2vw)",
                    fontWeight: 600,
                  }}
                >
                  세부 검사
                </span>
              </Button>
            </Tabs.Trigger>
            <Tabs.Trigger key={Tab.CHART} value={Tab.CHART} asChild>
              <Button
                className="friends-tab"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "0 25px 25px 0",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "min(20px, 14px + 0.2vw)",
                    fontWeight: 600,
                  }}
                >
                  차트 비교
                </span>
              </Button>
            </Tabs.Trigger>
          </div>
        </Tabs.List>
        <div
          style={{
            backgroundColor: "white",
            width: "calc(100vw - 280px)",
            margin: "0px 0px 20px 40px",
            borderRadius: "30px",
            // display: "flex",
          }}
        >
          <Tabs.Content
            key={Tab.INFO}
            value={Tab.INFO}
            className="flex h-full w-full"
          >
            <div className="flex w-full items-center">
              <PupNotesPageInner
                refetch={refetch}
                currentUser={currentUser}
                currentPet={currentPet}
              />
            </div>

            {/* <div className="flex w-1/2 flex-col items-center justify-center border-r-2 border-[#D9D9D9] p-10"></div>
            <div className="w-1/2 p-10"></div> */}
          </Tabs.Content>
          <Tabs.Content
            key={Tab.BASIC}
            value={Tab.BASIC}
            className="relative h-full"
          >
            <Button className="z-90 fixed right-[60px] bottom-[56px] h-[100px] w-[100px] rounded-full border-none p-0 drop-shadow-lg duration-300 hover:animate-bounce hover:drop-shadow-2xl">
              <img
                src="/pup_notes_add_new_floating_button.png"
                className="h-[100px] w-[100px]"
              />
            </Button>
            <PupNotesPageBasicExamsInner
              currentUser={currentUser}
              currentPet={currentPet}
            />
          </Tabs.Content>
          <Tabs.Content key={Tab.DETAILED} value={Tab.DETAILED}>
            <div className="border-pupcleLightLightGray flex h-[91px] w-full flex-row items-center justify-start border-b-[9px] px-[65px]">
              <img
                src="/pup_notes_caret_icon.png"
                className="mr-3 h-[13px] w-5 rotate-90"
              />
              <span className="font-poppins text-pupcle-24px mt-[2px] font-semibold">
                치과 검진
              </span>
            </div>
            <div className="flex h-[calc(100vh-6rem-125px-91px-20px)] w-full justify-center py-16">
              <div className="h-full w-1/2 overflow-scroll">
                <div className="w-full">
                  <PupNotesPageBasicInner
                    currentUser={currentUser}
                    currentPet={currentPet}
                    refetch={refetch}
                  />
                </div>
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content key={Tab.CHART} value={Tab.CHART}></Tabs.Content>
        </div>
      </Tabs.Root>
    </SharedLayout>
  );
};

interface PupNotesPageInnerProps {
  currentUser: SharedLayout_UserFragment;
  currentPet: SharedLayout_PetFragment;
  refetch: () => Promise<any>;
}

const PupNotesPageInner: FC<PupNotesPageInnerProps> = ({
  currentUser,
  currentPet,
}) => {
  const [editingPetInfo, setEditingPetInfo] = useState(false);

  const postResult = useCallback(async () => {
    setEditingPetInfo(false);
  }, []);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    usePetInfoForm(currentUser.id, currentPet, postResult);

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  return (
    <>
      <div className="flex h-full w-full flex-row">
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="flex h-full w-full">
              <div
                className="flex h-full w-1/2 flex-col items-center justify-center p-10"
                // style={{
                //   display: "flex",
                //   justifyContent: "center",
                //   alignItems: "center",
                //   backgroundColor: "white",
                //   padding: "50px",
                // }}
              >
                <Form.Item
                  name="avatarUrl"
                  valuePropName="avatarUrl"
                  trigger="onUpload"
                  className="mb-0"
                >
                  <FramedAvatarUpload
                    size={"medium"}
                    disabled={!editingPetInfo}
                    avatarUrl={values.avatarUrl}
                    onUpload={async (avatarUrl) =>
                      setFieldValue("avatarUrl", avatarUrl)
                    }
                  />
                </Form.Item>
                <div className="flex items-center">
                  <span className="font-poppins mr-2 text-[24px] font-semibold">
                    {currentPet.name}
                  </span>
                  <img src="/paw.png" className="h-fit w-[43px]" alt="" />
                </div>
              </div>
              <div className="h-full w-1/2 border-l-2 p-10">
                <div className="mb-[100px] flex w-full justify-end">
                  <Button
                    className={clsx(
                      "bg-pupcleLightBlue h-[63px] w-[179px] rounded-[30px] border-none",
                      {
                        invisible: editingPetInfo,
                      }
                    )}
                    onClick={() => setEditingPetInfo(true)}
                  >
                    <span className="text-pupcleBlue font-poppins text-pupcle-20px font-semibold">
                      프로필 수정
                    </span>
                  </Button>
                </div>
                <div>
                  <Row style={{ marginBottom: "8px" }}>
                    <Col
                      span={4}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingBottom: "24.5px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          paddingLeft: "16px",
                        }}
                      >
                        Name
                      </span>
                    </Col>
                    <Col span={20} style={{ paddingLeft: "1rem" }}>
                      <Form.Item name="name">
                        <Input
                          name="name"
                          // size="large"
                          style={{
                            backgroundColor: "#f5f5f5",
                            height: "40px",
                            width: "100%",
                            borderRadius: "20px",
                            borderStyle: "none",
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "14px",
                            fontWeight: 400,
                            padding: "0 1.5rem",
                          }}
                          autoComplete="name"
                          ref={focusElement}
                          data-cy="petprofilepage-input-name"
                          suffix
                          disabled={!editingPetInfo}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row style={{ marginBottom: "8px" }}>
                    <Col
                      span={4}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingBottom: "24.5px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          paddingLeft: "16px",
                        }}
                      >
                        DOB
                      </span>
                    </Col>
                    <Col span={20} style={{ paddingLeft: "1rem" }}>
                      <Form.Item name="dob" style={{ height: "40px" }}>
                        <DayPickerInput
                          selected={values.dob}
                          setSelected={(d) => setFieldValue("dob", d)}
                          disabled={!editingPetInfo}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row style={{ marginBottom: "8px" }}>
                    <Col
                      span={4}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingBottom: "24.5px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          paddingLeft: "16px",
                        }}
                      >
                        Weight
                      </span>
                    </Col>
                    <Col span={20} style={{ paddingLeft: "1rem" }}>
                      <Form.Item name="weight">
                        <Input
                          name="weight"
                          // size="large"
                          style={{
                            backgroundColor: "#f5f5f5",
                            height: "40px",
                            width: "100%",
                            borderRadius: "20px",
                            borderStyle: "none",
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "14px",
                            fontWeight: 400,
                            padding: "0 1.5rem",
                          }}
                          autoComplete="weight"
                          data-cy="petprofilepage-input-weight"
                          suffix="kg"
                          disabled={!editingPetInfo}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row style={{ marginBottom: "8px" }}>
                    <Col
                      span={4}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingBottom: "24.5px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          paddingLeft: "16px",
                        }}
                      >
                        Sex
                      </span>
                    </Col>
                    <Col span={20} style={{ paddingLeft: "1rem" }}>
                      {/* <Form.Item name="sex">
                        <Input
                          name="sex"
                          // size="large"
                          style={{
                            backgroundColor: "#f5f5f5",
                            height: "40px",
                            width: "100%",
                            borderRadius: "20px",
                            borderStyle: "none",
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "14px",
                            fontWeight: 400,
                            padding: "0 1.5rem",
                          }}
                          autoComplete="sex"
                          ref={focusElement}
                          suffix
                        />
                      </Form.Item> */}
                      <Form.Item name="sex">
                        <RadioGroupPrimitive.Root
                          value={values.sex}
                          onValueChange={(sex) => setFieldValue("sex", sex)}
                          data-cy="petprofilepage-input-sex"
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            width: "100%",
                            maxWidth: 400,
                          }}
                          disabled={!editingPetInfo}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              justifyContent: "space-evenly",
                            }}
                          >
                            <RadioGroupPrimitive.Item
                              className={clsx("circular-radio-button", {
                                hidden:
                                  !editingPetInfo && values.sex !== PetGender.M,
                                flex: !(
                                  !editingPetInfo && values.sex !== PetGender.M
                                ),
                              })}
                              value={PetGender.M}
                            >
                              <img
                                src="/male.png"
                                width={40}
                                height={40}
                                alt="male"
                              />
                              <img
                                className="image-hover"
                                src="/male_clicked.png"
                                alt="male clicked"
                                width={40}
                                height={40}
                              />
                            </RadioGroupPrimitive.Item>
                            <RadioGroupPrimitive.Item
                              className={clsx("circular-radio-button", {
                                hidden:
                                  !editingPetInfo && values.sex !== PetGender.F,
                                flex: !(
                                  !editingPetInfo && values.sex !== PetGender.F
                                ),
                              })}
                              value={PetGender.F}
                            >
                              <img
                                src="/female.png"
                                alt="female"
                                width={40}
                                height={40}
                              />
                              <img
                                className="image-hover"
                                src="/female_clicked.png"
                                alt="female clicked"
                                width={40}
                                height={40}
                              />
                            </RadioGroupPrimitive.Item>
                          </div>
                        </RadioGroupPrimitive.Root>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row style={{ marginBottom: "8px" }}>
                    <Col
                      span={4}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingBottom: "24.5px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          paddingLeft: "16px",
                        }}
                      >
                        Neutered
                      </span>
                    </Col>
                    <Col span={20} style={{ paddingLeft: "1rem" }}>
                      <Form.Item name="neutered">
                        <RadioGroupPrimitive.Root
                          value={
                            values.neutered === true
                              ? "true"
                              : values.neutered === false
                              ? "false"
                              : undefined
                          }
                          onValueChange={(n) =>
                            setFieldValue("neutered", n === "true")
                          }
                          data-cy="petprofilepage-input-neutered"
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            width: "100%",
                            maxWidth: 400,
                          }}
                          disabled={!editingPetInfo}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              justifyContent: "space-evenly",
                            }}
                          >
                            <RadioGroupPrimitive.Item
                              className={clsx("circular-radio-button", {
                                hidden: !editingPetInfo && !values.neutered,
                                flex: !(!editingPetInfo && !values.neutered),
                              })}
                              value="true"
                            >
                              <img
                                src="/neutered.png"
                                alt="neutered"
                                width={40}
                                height={40}
                              />
                              <img
                                className="image-hover"
                                src="/neutered_clicked.png"
                                alt="neutered clicked"
                                width={40}
                                height={40}
                              />
                            </RadioGroupPrimitive.Item>
                            <RadioGroupPrimitive.Item
                              className={clsx("circular-radio-button", {
                                hidden: !editingPetInfo && values.neutered,
                                flex: !(!editingPetInfo && values.neutered),
                              })}
                              value="false"
                            >
                              <img
                                src="/not_neutered.png"
                                alt="not neutered"
                                width={40}
                                height={40}
                              />
                              <img
                                className="image-hover"
                                src="/not_neutered_clicked.png"
                                alt="not neutered clicked"
                                width={40}
                                height={40}
                              />
                            </RadioGroupPrimitive.Item>
                          </div>
                        </RadioGroupPrimitive.Root>
                      </Form.Item>
                    </Col>
                  </Row>

                  {error ? (
                    <Form.Item name="_error">
                      <Alert
                        type="error"
                        message={`Registration failed`}
                        description={
                          <span>
                            {extractError(error).message}
                            {code ? (
                              <span>
                                {" "}
                                (Error code: <code>ERR_{code}</code>)
                              </span>
                            ) : null}
                          </span>
                        }
                      />
                    </Form.Item>
                  ) : null}
                  {editingPetInfo && (
                    <Form.Item name="_submit" style={{ marginBottom: "12px" }}>
                      <SubmitButton
                        style={{
                          backgroundColor: "#7FB3E8",
                          height: "40px",
                          width: "100%",
                          borderRadius: "20px",
                          borderStyle: "none",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "white",
                          textAlign: "center",
                          marginTop: "2rem",
                        }}
                        htmlType="submit"
                        data-cy="registerpage-submit-button"
                      >
                        {submitLabel}
                      </SubmitButton>
                    </Form.Item>
                  )}
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

type PupNotesPageBasicExamsInnerProps = {
  currentUser: SharedLayout_UserFragment & PupNotesPage_UserFragment;
  currentPet: SharedLayout_PetFragment & PupNotesPage_PetFragment;
};

const PupNotesPageBasicExamsInner: FC<PupNotesPageBasicExamsInnerProps> = ({
  currentUser,
  currentPet,
}) => {
  const categories = currentUser.basicExamCategories.nodes;
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  console.log({ selectedCategoryId });
  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-[1095px] flex-col px-[65px] py-[34px]">
        <ToggleGroup.Root
          className="ToggleGroup"
          type="single"
          value={selectedCategoryId}
          onValueChange={(value) => setSelectedCategoryId(value)}
          aria-label="Text alignment"
        >
          <div className="grid w-full grid-cols-3 justify-items-center gap-y-5">
            {categories.map(({ id, name }) => (
              <ToggleGroup.Item key={id} value={id}>
                <Button className="border-pupcleLightGray flex h-[63px] w-[19vw] max-w-[287px] items-center justify-center rounded-full border-[3px]">
                  <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                    {name}
                  </span>
                </Button>
              </ToggleGroup.Item>
            ))}
            <Button className="border-pupcleLightGray flex h-[63px] w-[19vw] max-w-[287px] items-center justify-center rounded-full border-[3px]">
              <img
                src="/pup_notes_add_pics.png"
                className="mr-1 h-[34px] w-[34px]"
              />
              <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                추가 등록
              </span>
            </Button>
          </div>
        </ToggleGroup.Root>
      </div>
      <div className="bg-pupcleLightLightGray h-[9px] w-full"></div>
      <div className="flex h-[84px] w-full flex-row items-center justify-start px-[65px]">
        <span className="font-poppins text-pupcle-24px font-semibold">
          히스토리
        </span>
        <img src="/pup_notes_caret_icon.png" className="ml-3 h-[13px] w-5" />
      </div>
      {/* map() */}
      <div className="border-pupcleLightGray flex w-full items-center border-t-[1px] px-[65px] py-10">
        <div className="flex w-[70%] items-center justify-between">
          <div className="flex flex-row items-center">
            <div className="bg-pupcleLightLightGray h-[106px] w-[106px] rounded-[20px]"></div>
            <div className="mx-9 flex flex-col">
              <div className="bg-pupcleLightLightGray flex h-[25px] w-[114px] items-center justify-center rounded-full">
                <span className="font-poppins text-pupcleGray text-[15px] font-semibold">
                  치과 검진
                </span>
              </div>
              <span className="font-poppins text-pupcleBlue mt-1 text-[20px] font-bold">
                서울동물병원
              </span>
              <span className="font-poppins text-[15px]">추가 메모{") "}</span>
            </div>
          </div>
          <span className="font-poppins text-[15px]">2023.04.21</span>
        </div>

        <div className="w-[30%] px-5">
          <Button className="bg-pupcleBlue flex h-[49px] w-[95px] items-center justify-center rounded-full border-none">
            <span className="font-poppins text-[20px] font-semibold text-white">
              보기
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

interface PupNotesPageBasicInnerProps {
  currentUser: SharedLayout_UserFragment;
  currentPet: SharedLayout_PetFragment;
  refetch: () => Promise<any>;
}

const PupNotesPageBasicInner: FC<PupNotesPageBasicInnerProps> = ({
  currentUser,
  currentPet,
  refetch,
}) => {
  const postResult = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    usePetInfoForm(currentUser.id, currentPet, postResult);

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  return (
    <>
      <div className="flex h-full w-full flex-row">
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="flex h-full w-full">
              <div className="w-full">
                <div className="mb-12 flex">
                  <div className="flex w-20 items-center justify-end">
                    <span className="font-poppins text-pupcle-20px text-pupcleBlue font-medium">
                      날짜
                    </span>
                  </div>
                  <div className="flex w-[calc(100%-80px)] pl-9">
                    <Form.Item name="date" className="mb-0 w-full">
                      <DayPickerInput
                        selected={values.dob}
                        setSelected={(d) => setFieldValue("dob", d)}
                      />
                      {/* TODO: change values.dob */}
                    </Form.Item>
                  </div>
                </div>

                <div className="mb-12 flex">
                  <div className="flex w-20 items-center justify-end">
                    <span className="font-poppins text-pupcle-20px text-pupcleBlue font-medium">
                      비용
                    </span>
                  </div>
                  <div className="flex w-[calc(100%-80px)] pl-9">
                    <Form.Item name="expense" className="mb-0 w-full">
                      <Input
                        name="expense"
                        className="bg-pupcleLightLightGray font-poppins h-10 w-full rounded-full border-none px-6 text-[15px]"
                        // size="large"
                        autoComplete="expense"
                        ref={focusElement}
                        data-cy="pup-notes-basic-input-expense"
                        suffix
                      />
                    </Form.Item>
                  </div>
                </div>

                <div className="mb-12 flex">
                  <div className="flex w-20 items-center justify-end">
                    <span className="font-poppins text-pupcle-20px text-pupcleBlue font-medium">
                      병원
                    </span>
                  </div>
                  <div className="flex w-[calc(100%-80px)] pl-9">
                    <Form.Item name="vet" className="mb-0 w-full">
                      <Input
                        name="vet"
                        className="bg-pupcleLightLightGray font-poppins h-10 w-full rounded-full border-none px-6 text-[15px]"
                        // size="large"
                        autoComplete="vet"
                        ref={focusElement}
                        data-cy="pup-notes-basic-input-vet"
                        suffix
                      />
                    </Form.Item>
                  </div>
                </div>

                <div className="mb-12 flex">
                  <div className="flex w-20 items-center justify-end">
                    <span className="font-poppins text-pupcle-20px text-pupcleBlue font-medium">
                      다음 예약일
                    </span>
                  </div>
                  <div className="flex w-[calc(100%-80px)] pl-9">
                    <Form.Item name="appointment" className="mb-0 w-full">
                      <DayPickerInput
                        selected={values.dob}
                        setSelected={(d) => setFieldValue("appointment", d)}
                      />
                      {/* TODO: change values.dob */}
                    </Form.Item>
                  </div>
                </div>

                <div className="mb-12 flex">
                  <div className="flex w-20 items-center justify-end">
                    <span className="font-poppins text-pupcle-20px text-pupcleBlue font-medium">
                      사진
                    </span>
                  </div>
                  <div className="flex w-[calc(100%-80px)] pl-9">
                    <Form.Item name="photos" className="mb-0 w-full">
                      <div className="bg-pupcleLightLightGray relative h-[106px] w-[106px] rounded-[20px] border-none">
                        <img
                          className="absolute left-[34px] top-[34px] h-[34px] w-[34px]"
                          src="/pup_notes_add_pics.png"
                        />
                      </div>
                    </Form.Item>
                  </div>
                </div>

                <div className="mb-12 flex">
                  <div className="flex w-20 items-center justify-end">
                    <span className="font-poppins text-pupcle-20px text-pupcleBlue font-medium">
                      메모
                    </span>
                  </div>
                  <div className="flex w-[calc(100%-80px)] pl-9">
                    <Form.Item name="memo" className="mb-0 w-full">
                      <Input
                        name="memo"
                        className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-10 w-full rounded-full border-none px-6 text-[15px]"
                        // size="large"
                        autoComplete="memo"
                        ref={focusElement}
                        data-cy="pup-notes-basic-input-memo"
                        suffix
                        placeholder="자세한 내용을 기록해보세요."
                      />
                    </Form.Item>
                  </div>
                </div>

                {error ? (
                  <Form.Item name="_error">
                    <Alert
                      type="error"
                      message={`Registration failed`}
                      description={
                        <span>
                          {extractError(error).message}
                          {code ? (
                            <span>
                              {" "}
                              (Error code: <code>ERR_{code}</code>)
                            </span>
                          ) : null}
                        </span>
                      }
                    />
                  </Form.Item>
                ) : null}
                <Form.Item name="_submit" className="mt-12">
                  <SubmitButton
                    className="bg-pupcleBlue font-poppins text-pupcle-20px h-10 w-full rounded-full border-none text-center font-bold text-white"
                    htmlType="submit"
                    data-cy="pup-notes-basic-submit-button"
                  >
                    {submitLabel}
                  </SubmitButton>
                </Form.Item>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default PupNotes;
