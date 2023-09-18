import { FetchResult } from "@apollo/client";
import {
  useBasicExamCategoryForm,
  useBasicExamResultsForm,
  useNewBasicExamResultsCategoryForm,
  usePetInfoForm,
} from "@app/componentlib";
import {
  AuthRestrict,
  DayPickerInput,
  FourOhFour,
  FramedAvatarUpload,
  SharedLayout,
} from "@app/components";
import {
  PetGender,
  PupNotesPage_BasicExamCategoryFragment,
  PupNotesPage_PetFragment,
  PupNotesPage_UserFragment,
  SharedLayout_PetFragment,
  SharedLayout_UserFragment,
  UpsertBasicExamCategoryMutation,
  UpsertBasicExamResultsMutation,
  usePupNotesPageQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Alert, Button, Col, Row } from "antd";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import Router, { useRouter } from "next/router";
import * as React from "react";
import { FC, useCallback, useMemo, useState } from "react";
import {
  InputAttributes,
  NumberFormatBase,
  NumericFormatProps,
  useNumericFormat,
} from "react-number-format";

function localeCompare(a: string, b: string) {
  return a.localeCompare(b);
}

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

// Allows empty formatting
export function CustomNumberFormat<BaseType = InputAttributes>(
  props: NumericFormatProps<BaseType> & {
    allowEmptyFormatting?: boolean;
  }
) {
  const { prefix = "", suffix = "", allowEmptyFormatting } = props;
  const numberFormatBaseProps = useNumericFormat<BaseType>(props);
  const { format } = numberFormatBaseProps;
  const _format = (numStr: string) => {
    const formattedValue = (format && format(numStr)) || "";
    return allowEmptyFormatting && formattedValue === ""
      ? prefix + suffix
      : formattedValue;
  };

  return (
    <NumberFormatBase<BaseType> {...numberFormatBaseProps} format={_format} />
  );
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
            <PupNotesPageBasicExamsInner
              currentUser={currentUser}
              currentPet={currentPet}
            />
          </Tabs.Content>
          <Tabs.Content
            key={Tab.DETAILED}
            value={Tab.DETAILED}
            className="flex h-full"
          >
            <div className="border-pupcleLightLightGray flex h-full w-1/2 flex-col items-center justify-center border-r-[8px]">
              <img
                src="/pup_notes_register_detail.png"
                className="mb-14 h-[302px] w-[322px]"
              />
              <Button className="bg-pupcleLightBlue flex h-[63px] w-[358px] items-center justify-center rounded-full border-none hover:contrast-[.8]">
                <span className="font-poppins text-pupcleBlue text-[24px] font-semibold">
                  세부검사 등록하기
                </span>
              </Button>
            </div>
            <div className="flex h-full w-1/2 flex-col items-center justify-center">
              <img
                src="/pup_notes_register_examination_result.png"
                className="mb-14 h-[302px] w-[322px]"
              />
              <Button className="bg-pupcleLightBlue flex h-[63px] w-[358px] items-center justify-center rounded-full border-none hover:contrast-[.8]">
                <span className="font-poppins text-pupcleBlue text-[24px] font-semibold">
                  검사수치 등록하기
                </span>
              </Button>
            </div>
          </Tabs.Content>
          <Tabs.Content
            key={Tab.CHART}
            value={Tab.CHART}
            className="relative h-full"
          >
            <div className="flex w-full flex-col items-center">
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button className="z-90 fixed right-[60px] bottom-[56px] h-[100px] w-[100px] rounded-full border-none p-0 drop-shadow-lg duration-300 hover:animate-bounce hover:drop-shadow-2xl">
                    <img
                      src="/pup_notes_add_new_floating_button.png"
                      className="h-[100px] w-[100px]"
                    />
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                  <Dialog.Content
                    className={clsx(
                      "fixed z-20",
                      "w-[90vw] rounded-[15px] bg-white px-8 py-10 lg:w-[60%]",
                      "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 lg:left-[62%] xl:left-[60%] 2xl:left-[57%]"
                    )}
                  >
                    <Dialog.Title className="flex h-[84px] w-full flex-row items-center justify-center px-[65px]">
                      <span className="font-poppins text-pupcle-24px mr-2 font-semibold">
                        항목을 선택해주세요.
                      </span>
                      <img src="/paw.png" className="h-fit w-[43px]" alt="" />
                    </Dialog.Title>
                    <div className="bg-pupcleLightLightGray h-[9px] w-full"></div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
              <div className="flex w-full max-w-[1095px] flex-col px-[65px] py-[34px]">
                <ToggleGroup.Root
                  className="ToggleGroup"
                  type="single"
                  aria-label="Text alignment"
                >
                  <div className="grid w-full grid-cols-3 justify-items-center gap-y-5">
                    <ToggleGroup.Item
                      key="CBC"
                      value="CBC"
                      className="border-pupcleLightGray aria-checked:bg-pupcleLightLightGray hover:bg-pupcleLightLightGray flex h-[63px] w-[19vw] max-w-[287px] items-center justify-center rounded-full border-[3px] hover:border-none aria-checked:border-none"
                    >
                      <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                        기본혈액검사{"("}CBC{")"}
                      </span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item
                      key="XRAY"
                      value="XRAY"
                      className="border-pupcleLightGray aria-checked:bg-pupcleLightLightGray hover:bg-pupcleLightLightGray flex h-[63px] w-[19vw] max-w-[287px] items-center justify-center rounded-full border-[3px] hover:border-none aria-checked:border-none"
                    >
                      <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                        X-RAY
                      </span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item
                      key="PEE"
                      value="PEE"
                      className="border-pupcleLightGray aria-checked:bg-pupcleLightLightGray hover:bg-pupcleLightLightGray flex h-[63px] w-[19vw] max-w-[287px] items-center justify-center rounded-full border-[3px] hover:border-none aria-checked:border-none"
                    >
                      <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                        소변 검사
                      </span>
                    </ToggleGroup.Item>
                  </div>
                </ToggleGroup.Root>
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
              <div className="border-pupcleLightGray flex w-full items-center border-t-[1px] px-[65px] py-10">
                <div className="flex w-[70%] items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div className="bg-pupcleLightLightGray h-[106px] w-[106px] rounded-[20px]"></div>
                    <div className="mx-9 flex flex-col">
                      <div className="bg-pupcleLightLightGray flex h-[25px] w-[114px] items-center justify-center rounded-full">
                        <span className="font-poppins text-pupcleGray text-[15px] font-semibold">
                          기본혈액검사
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
                  <span className="font-poppins text-[15px]">
                    {/* {takenAt && format(parseISO(takenAt), "yyyy.MM.dd")} */}
                    2023.09.14
                  </span>
                </div>
                <div className="w-[30%] px-5">
                  <Button className="bg-pupcleBlue flex h-[49px] w-[95px] items-center justify-center rounded-full border-none hover:contrast-[.8]">
                    <span className="font-poppins text-[20px] font-semibold text-white">
                      보기
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </Tabs.Content>
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
                        message={`Failed to save pet info`}
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
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [
    newBasicExamResultsCategoryDialogOpen,
    setNewBasicExamResultsCategoryDialogOpen,
  ] = useState(false);
  const [newBasicExamResultsCategoryId, setNewBasicExamResultsCategoryId] =
    useState("");
  const [newBasicExamResults, setNewBasicExamResults] = useState(false);

  const categories = useMemo(
    () =>
      [...currentUser.basicExamCategories.nodes].sort((a, b) => {
        return localeCompare(a.name, b.name);
      }),
    [currentUser.basicExamCategories.nodes]
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const basicExamResults = currentPet.basicExamResults.nodes;
  const filteredBasicExamResults = useMemo(() => {
    return selectedCategoryId
      ? basicExamResults.filter(
          (ber) => ber.basicExamCategory?.id === selectedCategoryId
        )
      : basicExamResults;
  }, [basicExamResults, selectedCategoryId]);

  const onBasicExamCategoryFormComplete = useCallback(
    (result: FetchResult<UpsertBasicExamCategoryMutation>) => {
      const upsertedCategoryId =
        result.data?.upsertBasicExamCategory?.basicExamCategory?.id;
      setSelectedCategoryId(upsertedCategoryId ?? null);
      setNewCategoryDialogOpen(false);
    },
    [setSelectedCategoryId, setNewCategoryDialogOpen]
  );
  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useBasicExamCategoryForm(
      currentUser.id,
      undefined,
      onBasicExamCategoryFormComplete
    );

  const code = getCodeFromError(error);

  return (
    <>
      <div
        className={clsx("flex w-full flex-col items-center", {
          hidden: newBasicExamResults,
        })}
      >
        <Dialog.Root
          open={newBasicExamResultsCategoryDialogOpen}
          onOpenChange={setNewBasicExamResultsCategoryDialogOpen}
        >
          <Dialog.Trigger asChild>
            <Button className="z-90 fixed right-[60px] bottom-[56px] h-[100px] w-[100px] rounded-full border-none p-0 drop-shadow-lg duration-300 hover:animate-bounce hover:drop-shadow-2xl">
              <img
                src="/pup_notes_add_new_floating_button.png"
                className="h-[100px] w-[100px]"
              />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
            <Dialog.Content
              className={clsx(
                "fixed z-20",
                "w-[90vw] rounded-[15px] bg-white px-8 py-10 lg:w-[60%]",
                "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 lg:left-[62%] xl:left-[60%] 2xl:left-[57%]"
              )}
            >
              <Dialog.Title className="flex h-[84px] w-full flex-row items-center justify-center px-[65px]">
                <span className="font-poppins text-pupcle-24px mr-2 font-semibold">
                  항목을 선택해주세요.
                </span>
                <img src="/paw.png" className="h-fit w-[43px]" alt="" />
              </Dialog.Title>
              <div className="bg-pupcleLightLightGray h-[9px] w-full"></div>
              <div className="flex w-full justify-center">
                <NewBasicExamResultsCategoryForm
                  categories={categories}
                  defaultCategoryId={selectedCategoryId || categories[0]?.id}
                  onComplete={(categoryId) => {
                    setNewBasicExamResultsCategoryDialogOpen(false);
                    setNewBasicExamResultsCategoryId(categoryId);
                    setNewBasicExamResults(true);
                  }}
                  onCancel={() => {
                    setNewBasicExamResultsCategoryDialogOpen(false);
                  }}
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
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
                <ToggleGroup.Item
                  key={id}
                  value={id}
                  className="border-pupcleLightGray aria-checked:bg-pupcleLightLightGray hover:bg-pupcleLightLightGray flex h-[63px] w-[19vw] max-w-[287px] items-center justify-center rounded-full border-[3px] hover:border-none aria-checked:border-none"
                >
                  <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                    {name}
                  </span>
                </ToggleGroup.Item>
              ))}
              <Dialog.Root
                open={newCategoryDialogOpen}
                onOpenChange={setNewCategoryDialogOpen}
              >
                <Dialog.Trigger asChild>
                  <Button className="hover:bg-pupcleLightLightGray border-pupcleLightGray flex h-[63px] w-[19vw] max-w-[287px] items-center justify-center rounded-full border-[3px] hover:border-none">
                    <img
                      src="/pup_notes_add_pics.png"
                      className="mr-1 h-[34px] w-[34px]"
                    />
                    <span className="text-pupcle-20px font-poppins text-pupcleGray font-semibold">
                      추가 등록
                    </span>
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                  <Dialog.Content
                    className={clsx(
                      "fixed z-20",
                      "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
                      "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%]",
                      "bg-white dark:bg-gray-800",
                      "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75"
                    )}
                  >
                    <Dialog.Title className="DialogTitle">
                      **New basic exam category**
                    </Dialog.Title>
                    <Dialog.Description className="DialogDescription">
                      **Make changes to your basic exam category here. Click
                      save when you're done.**
                    </Dialog.Description>
                    <Formik
                      validationSchema={validationSchema}
                      initialValues={initialValues}
                      onSubmit={handleSubmit}
                    >
                      <Form className="flex h-full w-full">
                        <div className="w-full">
                          <div className="mb-12 flex">
                            <div className="flex w-20 items-center justify-end">
                              <span className="font-poppins text-pupcle-20px text-pupcleBlue font-medium">
                                **Name**
                              </span>
                            </div>
                            <div className="flex w-[calc(100%-80px)] pl-9">
                              <Form.Item name="name" className="mb-0 w-full">
                                <Input
                                  name="name"
                                  className="bg-pupcleLightLightGray font-poppins h-10 w-full rounded-full border-none px-6 text-[15px]"
                                  // size="large"
                                  autoComplete="basic-category-name"
                                  data-cy="pup-notes-basic-category-name"
                                  suffix
                                />
                              </Form.Item>
                            </div>
                          </div>

                          {error ? (
                            <Form.Item name="_error">
                              <Alert
                                type="error"
                                message={`**Saving basic exam category failed**`}
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
                          <Form.Item name="_cancel" className="mt-12">
                            <button className="Button"></button>
                            <Dialog.Close asChild>
                              <Button className="bg-pupcleBlue font-poppins text-pupcle-20px h-10 w-full rounded-full border-none text-center font-bold text-white">
                                취소
                              </Button>
                            </Dialog.Close>
                          </Form.Item>
                        </div>
                      </Form>
                    </Formik>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
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
        {filteredBasicExamResults.map(
          ({ id, memo, takenAt, basicExamCategory }) => (
            <div
              className="border-pupcleLightGray flex w-full items-center border-t-[1px] px-[65px] py-10"
              key={id}
            >
              <div className="flex w-[70%] items-center justify-between">
                <div className="flex flex-row items-center">
                  <div className="bg-pupcleLightLightGray h-[106px] w-[106px] rounded-[20px]"></div>
                  <div className="mx-9 flex flex-col">
                    <div className="bg-pupcleLightLightGray flex h-[25px] w-[114px] items-center justify-center rounded-full">
                      <span className="font-poppins text-pupcleGray text-[15px] font-semibold">
                        {basicExamCategory?.name}
                      </span>
                    </div>
                    <span className="font-poppins text-pupcleBlue mt-1 text-[20px] font-bold">
                      서울동물병원
                    </span>
                    <span className="font-poppins text-[15px]">
                      추가 메모{") "}
                      {memo}
                    </span>
                  </div>
                </div>
                <span className="font-poppins text-[15px]">
                  {takenAt && format(parseISO(takenAt), "yyyy.MM.dd")}
                </span>
              </div>

              <div className="w-[30%] px-5">
                <Button className="bg-pupcleBlue flex h-[49px] w-[95px] items-center justify-center rounded-full border-none hover:contrast-[.8]">
                  <span className="font-poppins text-[20px] font-semibold text-white">
                    보기
                  </span>
                </Button>
              </div>
            </div>
          )
        )}
      </div>
      <div
        className={clsx({
          hidden: !newBasicExamResults,
        })}
      >
        <div className="border-pupcleLightLightGray flex h-[91px] w-full flex-row items-center justify-start border-b-[9px] px-[65px]">
          <Button
            className="mr-3 h-[13px] w-5 border-none p-0"
            onClick={() => setNewBasicExamResults(false)}
          >
            <img
              src="/pup_notes_caret_icon.png"
              className="h-[13px] w-5 rotate-90"
            />
          </Button>
          <span className="font-poppins text-pupcle-24px mt-[2px] font-semibold">
            {
              categories.find(({ id }) => id === newBasicExamResultsCategoryId)
                ?.name
            }
          </span>
        </div>

        <div className="flex h-[calc(100vh-6rem-125px-91px-20px)] w-full justify-center py-16">
          <div className="h-full w-1/2 overflow-scroll">
            <div className="w-full">
              <BasicExamResultsForm
                currentUser={currentUser}
                currentPet={currentPet}
                basicExamCategoryId={newBasicExamResultsCategoryId}
                onComplete={() => {
                  setNewBasicExamResults(false);
                  setSelectedCategoryId("");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

type NewBasicExamResultsCategoryFormProps = {
  defaultCategoryId: string | undefined;
  categories: PupNotesPage_BasicExamCategoryFragment[];
  onComplete: (result: string) => Promise<void> | void;
  onCancel: () => Promise<void> | void;
};

const NewBasicExamResultsCategoryForm: FC<
  NewBasicExamResultsCategoryFormProps
> = ({ defaultCategoryId, categories, onComplete, onCancel }) => {
  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useNewBasicExamResultsCategoryForm(defaultCategoryId, onComplete);

  const code = getCodeFromError(error);
  return (
    <>
      <Formik
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => (
          <Form className="flex h-full w-[400px] flex-col justify-center">
            <Form.Item
              name="categoryId"
              className="mb-0 w-full justify-center pt-[96px]"
            >
              <Select.Root
                defaultValue={values.categoryId}
                onValueChange={(value) => {
                  setFieldValue("categoryId", value);
                }}
              >
                <Select.Trigger
                  asChild
                  aria-label="Category"
                  className="w-full"
                >
                  <Button
                    className={clsx(
                      "font-poppins text-pupcleGray border-pupcleLightGray relative flex h-12 w-full items-center justify-center rounded-none border-x-0 border-t-0 border-b-[3px] text-[24px] font-semibold"
                    )}
                  >
                    <Select.Value placeholder="항목을 선택해주세요." />
                    <Select.Icon className="absolute right-8">
                      <img
                        src="/pup_notes_caret_icon.png"
                        className="h-[13px] w-5"
                      />
                    </Select.Icon>
                  </Button>
                </Select.Trigger>
                <Select.Portal className="relative flex w-full">
                  <Select.Content
                    position="popper"
                    sideOffset={2}
                    className="z-20 w-[400px]"
                  >
                    <Select.ScrollUpButton className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      {/* should be chevron up? <ChevronUpIcon /> */}
                      <img
                        src="/pup_notes_caret_icon.png"
                        className="h-[13px] w-5"
                      />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="flex justify-center rounded-b-[15px] bg-white shadow-lg">
                      <Select.Group>
                        {categories.map(({ id, name }) => (
                          <Select.Item
                            key={id}
                            value={id}
                            className={clsx(
                              "relative flex h-[50px] w-[400px] items-center justify-center rounded-[5px] px-[75px] py-[10px] text-center text-[20px]",
                              "radix-disabled:opacity-50",
                              "hover:bg-pupcleLightLightGray select-none focus:outline-none"
                            )}
                          >
                            <Select.ItemIndicator className="absolute left-[25px] inline-flex items-center">
                              {/* <CheckIcon /> */}
                              <img
                                src="/checkbox.png"
                                className="h-[25px] w-[25px]"
                              />
                            </Select.ItemIndicator>
                            <Select.ItemText className="">
                              <span className="font-poppins font-medium">
                                {name}
                              </span>
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <img
                        src="/pup_notes_caret_icon.png"
                        className="h-[13px] w-5"
                      />
                    </Select.ScrollDownButton>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </Form.Item>

            {error ? (
              <Form.Item name="_error">
                <Alert
                  type="error"
                  message={`**Saving basic exam category failed**`}
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
            <Form.Item name="_submit" className="mt-[96px] mb-3">
              <SubmitButton
                className="bg-pupcleBlue font-poppins text-pupcle-20px relative flex h-[63px] w-full items-center justify-center rounded-full border-none text-center font-bold text-white"
                htmlType="submit"
                data-cy="pup-notes-basic-submit-button"
              >
                <img
                  src="/pup_notes_next_icon.png"
                  className="absolute right-8 h-5 w-3"
                />
                {submitLabel}
              </SubmitButton>
            </Form.Item>
            <Form.Item name="_cancel" className="mb-10">
              <Button
                className="font-poppins text-pupcle-20px border-pupcleLightGray text-pupcleGray h-[63px] w-full rounded-full border-[3px] bg-transparent text-center font-bold"
                onClick={onCancel}
              >
                취소
              </Button>
            </Form.Item>
          </Form>
        )}
      </Formik>
    </>
  );
};

interface BasicExamResultsFormProps {
  currentUser: SharedLayout_UserFragment;
  currentPet: SharedLayout_PetFragment;
  basicExamCategoryId: string;
  onComplete: (result: any) => Promise<void> | void;
}

const BasicExamResultsForm: FC<BasicExamResultsFormProps> = ({
  currentUser,
  currentPet,
  basicExamCategoryId,
  onComplete,
}) => {
  const postResult = useCallback(
    async (result: FetchResult<UpsertBasicExamResultsMutation>) => {
      await onComplete(result);
    },
    [onComplete]
  );

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useBasicExamResultsForm(
      currentUser.id,
      currentPet.id,
      basicExamCategoryId,
      undefined,
      postResult
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
                        selected={values.takenAt}
                        setSelected={(d) => setFieldValue("takenAt", d)}
                      />
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
                    <Form.Item name="cost" className="mb-0 w-full">
                      <CustomNumberFormat
                        className="bg-pupcleLightLightGray font-poppins h-10 w-full rounded-full border-none px-6 text-[15px]"
                        autoComplete="cost"
                        data-cy="pup-notes-basic-input-cost"
                        thousandSeparator={true}
                        prefix={"₩"}
                        value={values.cost}
                        onValueChange={({ value }) =>
                          setFieldValue("cost", value)
                        }
                        allowEmptyFormatting
                        decimalScale={0}
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
                    <Form.Item name="locationKakaoId" className="mb-0 w-full">
                      <Input
                        name="locationKakaoId"
                        placeholder="TODO location chooser"
                        className="bg-pupcleLightLightGray font-poppins h-10 w-full rounded-full border-none px-6 text-[15px]"
                        // size="large"
                        autoComplete="locationKakaoId"
                        data-cy="pup-notes-basic-input-locationKakaoId"
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
                    <Form.Item name="nextReservation" className="mb-0 w-full">
                      <DayPickerInput
                        selected={values.nextReservation}
                        setSelected={(d) => setFieldValue("nextReservation", d)}
                      />
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
                      message={`Failed to save exam results`}
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
