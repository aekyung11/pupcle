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
import { Alert, Col, InputRef, Row } from "antd";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import Router from "next/router";
import * as React from "react";
import { FC, useCallback, useEffect, useRef } from "react";

import { isSafe } from "../login";

interface PetProfilePageProps {
  next: string | null;
}

const PetProfilePage: NextPage<PetProfilePageProps> = ({ next: rawNext }) => {
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
        <PetProfilePageInner
          refetch={refetch}
          next={next}
          currentUser={query.data?.currentUser}
        />
      )}
    </SharedLayout>
  );
};

interface PetProfilePageInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
  refetch: () => Promise<any>;
}

const PetProfilePageInner: FC<PetProfilePageInnerProps> = ({
  currentUser,
  next,
  refetch,
}) => {
  const postResult = useCallback(async () => {
    await refetch();
    Router.push(next);
  }, [next, refetch]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    usePetInfoForm(currentUser.id, undefined, postResult);

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  return (
    <>
      <Row
        style={{
          width: "100%",
          height: "100vh",
          minHeight: "720px",
        }}
      >
        <Col
          span={24}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            padding: "50px",
          }}
        >
          <div style={{ maxWidth: "480px", width: "100%" }}>
            <Row
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "32px",
              }}
            >
              <span
                style={{
                  marginRight: "4px",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "24px",
                  fontWeight: 600,
                }}
              >
                반려견의 정보를 입력해주세요
              </span>
              <img
                src="/paw.png"
                style={{ width: "36px", marginBottom: "3px" }}
                alt=""
              />
            </Row>
            <Formik
              validationSchema={validationSchema}
              initialValues={initialValues}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue }) => (
                <Form>
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
                </Form>
              )}
            </Formik>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default PetProfilePage;
