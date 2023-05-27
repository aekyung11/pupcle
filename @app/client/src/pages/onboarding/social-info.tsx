import { QuestionCircleOutlined } from "@ant-design/icons";
import { useSocialInfoForm } from "@app/componentlib";
import {
  AspectRatioImage,
  AuthRestrict,
  FramedAvatarUpload,
  SharedLayout,
} from "@app/components";
import {
  SharedLayout_UserFragment,
  useSharedQuery,
  useUpdateUserMutation,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import paw from "@app/server/public/paw.png";
import { Alert, Col, InputRef, message, Row } from "antd";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import Router from "next/router";
import React, { FC, useCallback, useEffect, useRef } from "react";

import { isSafe } from "../login";

interface SocialInfoPageProps {
  next: string | null;
}

const SocialInfoPage: NextPage<SocialInfoPageProps> = ({ next: rawNext }) => {
  const query = useSharedQuery();
  const next: string = isSafe(rawNext) ? rawNext! : "/onboarding/pet-profile";

  return (
    <SharedLayout
      title="Social Info"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && (
        <SocialInfoPageInner
          next={next}
          currentUser={query.data?.currentUser}
        ></SocialInfoPageInner>
      )}
    </SharedLayout>
  );
};

interface SocialInfoPageInnerProps {
  next: string;
  currentUser: SharedLayout_UserFragment;
}

const SocialInfoPageInner: FC<SocialInfoPageInnerProps> = ({
  currentUser,
  next,
}) => {
  const postResult = useCallback(async () => {
    Router.push(next);
  }, [next]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useSocialInfoForm(
      currentUser.id,
      postResult,
      currentUser.nickname,
      currentUser.username
    );

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  const [updateUser] = useUpdateUserMutation();

  const handleAvatarUpload = useCallback(
    async (avatarUrl: string) => {
      try {
        await updateUser({
          variables: {
            id: currentUser.id,
            patch: {
              avatarUrl,
            },
          },
        });
        message.success("Successfully updated profile picture");
      } catch (e) {
        message.error("Error updating profile picture");
      }
    },
    [currentUser.id, updateUser]
  );

  return (
    <>
      <Row
        style={{
          width: "100%",
          height: "calc(100vh - 64px - 70px)",
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
                회원님의 정보를 입력해주세요
              </span>
              <AspectRatioImage
                src={paw}
                style={{ width: "36px", marginBottom: "3px" }}
                alt=""
                imgWidth={86}
                imgHeight={56}
              />
            </Row>
            <FramedAvatarUpload
              avatarUrl={currentUser.avatarUrl}
              disabled={false}
              onUpload={handleAvatarUpload}
            />
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
                      Nickname
                    </span>
                    <QuestionCircleOutlined
                      style={{
                        color: "#7FB3E8", // TODO: pupcleBlue로 컬러 정의 후 사용(계속 사용할 것 같음)
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "14px",
                        fontWeight: 400,
                        paddingRight: "16px",
                      }}
                    />
                  </Row>
                  <Form.Item name="nickname">
                    <Input
                      name="nickname"
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
                      autoComplete="nickname name"
                      ref={focusElement}
                      data-cy="registerpage-input-name"
                      suffix
                    />
                  </Form.Item>
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
                      ID
                    </span>
                    <QuestionCircleOutlined
                      style={{
                        color: "#7FB3E8", // TODO: pupcleBlue로 컬러 정의 후 사용(계속 사용할 것 같음)
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "14px",
                        fontWeight: 400,
                        paddingRight: "16px",
                      }}
                    />
                  </Row>
                  <Form.Item name="username">
                    <Input
                      name="username"
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
                      autoComplete="username"
                      // ref={focusElement}
                      data-cy="registerpage-input-username"
                      suffix
                    />
                  </Form.Item>
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

export default SocialInfoPage;
