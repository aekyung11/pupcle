import { QuestionCircleOutlined } from "@ant-design/icons";
import { usePetInfoForm } from "@app/componentlib";
import { AuthRestrict, Link, SharedLayout } from "@app/components";
import { SharedLayout_UserFragment, useSharedQuery } from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import { Alert, Button, Col, InputRef, message, Row } from "antd";
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
  const next: string = isSafe(rawNext) ? rawNext! : "/onboarding/pet-profile";

  return (
    <SharedLayout
      title="pet-profile"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <PetProfilePageInner
          next={next}
          currentUser={query.data?.currentUser}
        ></PetProfilePageInner>
      )}
    </SharedLayout>
  );
};

interface PetProfilePageInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
}

const PetProfilePageInner: FC<PetProfilePageInnerProps> = ({
  currentUser,
  next,
}) => {
  const postResult = useCallback(async () => {
    Router.push(next);
  }, [next]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    usePetInfoForm(currentUser.id, postResult);

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  const handleAvatarUpload = useCallback(async () => {
    try {
      message.success("Successfully updated profile picture");
    } catch (e) {
      message.error("Error updating profile picture");
    }
  }, []);

  return (
    <>
      <Row
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "#D8E7F7",
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
                회원님의 정보를 입력해주세요
              </span>
              <img
                src="/paw.png"
                style={{ width: "36px", marginBottom: "3px" }}
              />
            </Row>
            {/* <FramedAvatarUpload
              user={currentUser}
              disabled={false}
              onUpload={handleAvatarUpload}
            /> */}
            <Formik
              validationSchema={validationSchema}
              initialValues={initialValues}
              onSubmit={handleSubmit}
            >
              {() => (
                <Form>
                  <Row
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
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
                    <Form.Item name="name">
                      <Input
                        name="name"
                        // size="large"
                        style={{
                          backgroundColor: "#f5f5f5",
                          height: "40px",
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
                      />
                    </Form.Item>
                  </Row>

                  <Row
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
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
                    <Form.Item name="dob">
                      <Input
                        name="dob"
                        // size="large"
                        style={{
                          backgroundColor: "#f5f5f5",
                          height: "40px",
                          borderRadius: "20px",
                          borderStyle: "none",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          padding: "0 1.5rem",
                        }}
                        autoComplete="dob"
                        // ref={focusElement}
                        data-cy="petprofilepage-input-dob"
                      />
                    </Form.Item>
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
