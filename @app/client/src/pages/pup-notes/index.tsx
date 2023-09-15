import { usePetInfoForm } from "@app/componentlib";
import {
  AuthRestrict,
  DayPickerInput,
  FramedAvatarUpload,
  SharedLayout,
} from "@app/components";
import {
  PetGender,
  SharedLayout_UserFragment,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as Tabs from "@radix-ui/react-tabs";
import { Alert, Button, Col, InputRef, Row } from "antd";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import Router from "next/router";
import * as React from "react";
import { FC, useCallback, useEffect, useRef, useState } from "react";

import { isSafe } from "../login";

interface PupNotesPageProps {
  next: string | null;
}

enum Tab {
  INFO = "info",
  BASIC = "basic",
  DETAILED = "detailed",
  CHART = "chart",
}

const PupNotes: NextPage<PupNotesPageProps> = ({ next: rawNext }) => {
  const query = useSharedQuery();
  const refetch = async () => query.refetch();
  const next: string = isSafe(rawNext) ? rawNext! : "/";
  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.INFO);

  const currentUserId = query.data?.currentUser?.id as string | undefined;
  // const currentPet = query.data?.currentUser?.pets[0];

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
          height: "15%",
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
        style={{ display: "flex", height: "85%" }}
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
            style={{ display: "flex", width: "100%" }}
          >
            <div className="flex w-full items-center">
              {query.data?.currentUser && (
                <PupNotesPageInner
                  refetch={refetch}
                  next={next}
                  currentUser={query.data?.currentUser}
                />
              )}
            </div>

            {/* <div className="flex w-1/2 flex-col items-center justify-center border-r-2 border-[#D9D9D9] p-10"></div>
            <div className="w-1/2 p-10"></div> */}
          </Tabs.Content>
          <Tabs.Content key={Tab.BASIC} value={Tab.BASIC}>
            <div className="flex w-full flex-col items-center">
              <div className="mx-[65px] flex w-full max-w-[965px] flex-col py-[34px]">
                <div className="mb-5 flex w-full flex-row justify-between">
                  <Button className="border-pupcleLightGray flex h-[63px] w-[287px] items-center justify-center rounded-full border-[3px]">
                    <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                      치과 검진
                    </span>
                  </Button>
                  <Button className="border-pupcleLightGray flex h-[63px] w-[287px] items-center justify-center rounded-full border-[3px]">
                    <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                      슬개골 검사
                    </span>
                  </Button>
                  <Button className="border-pupcleLightGray flex h-[63px] w-[287px] items-center justify-center rounded-full border-[3px]">
                    <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                      피부 검사
                    </span>
                  </Button>
                </div>
                <div className="flex w-full flex-row justify-between">
                  <Button className="border-pupcleLightGray flex h-[63px] w-[287px] items-center justify-center rounded-full border-[3px]">
                    <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                      심장 청잔
                    </span>
                  </Button>
                  <Button className="border-pupcleLightGray flex h-[63px] w-[287px] items-center justify-center rounded-full border-[3px]">
                    <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                      신체 검사
                    </span>
                  </Button>
                  <Button className="border-pupcleLightGray flex h-[63px] w-[287px] items-center justify-center rounded-full border-[3px]">
                    <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                      추가 등록
                    </span>
                  </Button>
                </div>
              </div>
              <div className="bg-pupcleLightLightGray h-[9px] w-full"></div>
              <div className="flex h-[84px] w-full flex-row items-center justify-start px-[65px]">
                <span className="font-poppins text-pupcle-24px font-semibold">
                  히스토리
                </span>
                <img
                  src="/pup_notes_caret_icon.png"
                  className="ml-3 h-[13px] w-5"
                />
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
                      <span className="font-poppins text-[15px]">
                        추가 메모{") "}
                      </span>
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
          </Tabs.Content>
          <Tabs.Content key={Tab.DETAILED} value={Tab.DETAILED}></Tabs.Content>
          <Tabs.Content key={Tab.CHART} value={Tab.CHART}></Tabs.Content>
        </div>
      </Tabs.Root>
    </SharedLayout>
  );
};

interface PupNotesPageInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
  refetch: () => Promise<any>;
}

const PupNotesPageInner: FC<PupNotesPageInnerProps> = ({
  currentUser,
  next,
  refetch,
}) => {
  const postResult = useCallback(async () => {
    await refetch();
    Router.push(next);
  }, [next, refetch]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    usePetInfoForm(currentUser.id, postResult);

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
            <Form className="flex w-full">
              <div
                className="flex h-full w-1/2 flex-col items-center justify-center p-20"
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
                >
                  <FramedAvatarUpload
                    disabled={false}
                    avatarUrl={values.avatarUrl}
                    onUpload={async (avatarUrl) =>
                      setFieldValue("avatarUrl", avatarUrl)
                    }
                  />
                </Form.Item>
                <div className="flex items-center">
                  <span className="font-poppins mr-2 text-[24px] font-semibold">
                    {currentUser.pets.nodes[0].name}
                  </span>
                  <img src="/paw.png" className="h-fit w-[43px]" alt="" />
                </div>
              </div>
              <div className="h-full w-1/2 border-l-2 p-10">
                <div className="mb-[100px] flex w-full justify-end">
                  <Button className="bg-pupcleLightBlue h-[63px] w-[179px] rounded-[30px] border-none">
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
                              className="circular-radio-button"
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
                              className="circular-radio-button"
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
                              className="circular-radio-button"
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
                              className="circular-radio-button"
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
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default PupNotes;
