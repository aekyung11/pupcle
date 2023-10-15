import { QuestionCircleOutlined } from "@ant-design/icons";
import { useApolloClient } from "@apollo/client";
import { useRegisterForm } from "@app/componentlib";
import {
  AuthRestrict,
  FormikIconCheckBox,
  Redirect,
  SharedLayout,
} from "@app/components";
import { useSharedQuery } from "@app/graphql";
import {
  extractError,
  getCodeFromError,
  resetWebsocketConnection,
} from "@app/lib";
import { Alert, Button, Col, InputRef, Row } from "antd";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import Link from "next/link";
import Router from "next/router";
import React, { useCallback, useEffect, useRef } from "react";

import { isSafe } from "../login";

interface RegisterProps {
  next: string | null;
}
// TODO: cell number
/**
 * The registration page just renders the standard layout and embeds the
 * registration form.
 */
const Register: NextPage<RegisterProps> = ({ next: rawNext }) => {
  const next: string = isSafe(rawNext) ? rawNext! : "/";
  const query = useSharedQuery();
  const client = useApolloClient();

  const postResult = useCallback(async () => {
    resetWebsocketConnection();
    client.resetStore();
    Router.push(next);
  }, [client, next]);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useRegisterForm(postResult);

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  return (
    <SharedLayout
      title="Register"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_IN}
    >
      {({ currentUser }) =>
        currentUser ? (
          <Redirect href={next} />
        ) : (
          <Row
            style={{
              width: "100%",
              height: "100vh",
              backgroundColor: "#D8E7F7",
              minHeight: "720px",
            }}
          >
            <Col
              span={12}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "50px",
              }}
            >
              <Row
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "24px",
                  height: "5rem",
                  position: "fixed",
                  top: 0,
                  left: 0,
                }}
              >
                <Link href="/">
                  <img
                    src="/logo.png"
                    style={{ height: "2.4rem" }}
                    alt="home"
                  />
                </Link>
              </Row>
              <Row style={{ display: "flex", justifyContent: "center" }}>
                <img
                  src="/login_page_img.png"
                  style={{ maxWidth: "400px", width: "80%" }}
                  alt=""
                />
              </Row>
              <Row style={{ maxWidth: "450px" }}>
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "28px",
                    fontWeight: 600,
                    textAlign: "center",
                    marginTop: "32px",
                  }}
                >
                  Check your pet&apos;s condition easily
                </span>
              </Row>
              <Row style={{ maxWidth: "450px" }}>
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    textAlign: "center",
                    margin: "24px 0px",
                  }}
                >
                  Make an account and take care of your pet.
                </span>
              </Row>
              <Row>
                <Button
                  style={{
                    padding: "0px",
                    width: "1rem",
                    height: "1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#BED8F3",
                    borderStyle: "none",
                  }}
                ></Button>
                <Button
                  style={{
                    padding: "0px",
                    margin: "0px 8px",
                    width: "1rem",
                    height: "1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#BED8F3",
                    borderStyle: "none",
                  }}
                ></Button>
                <Button
                  style={{
                    padding: "0px",
                    width: "1rem",
                    height: "1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#BED8F3",
                    borderStyle: "none",
                  }}
                ></Button>
              </Row>
            </Col>
            <Col
              span={12}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "50px 0px 0px 50px",
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
                    회원가입
                  </span>
                  <img
                    src="/paw.png"
                    style={{ width: "36px", marginBottom: "3px" }}
                    alt=""
                  />
                </Row>
                <Formik
                  validateOnBlur
                  validationSchema={validationSchema}
                  initialValues={initialValues}
                  onSubmit={handleSubmit}
                >
                  {({}) => (
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
                          Username
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
                          Email
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
                      <Form.Item name="email">
                        <Input
                          name="email"
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
                          // ref={focusElement}
                          data-cy="registerpage-input-email"
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
                          Cell number (Optional)
                        </span>
                      </Row>
                      <Form.Item name="cellnumber">
                        <Input
                          name="cellnumber"
                          // size="large"
                          style={{
                            backgroundColor: "#f5f5f5",
                            height: "40px",
                            borderRadius: "20px",
                            borderStyle: "none",
                          }}
                          // ref={focusElement}
                          data-cy="registerpage-input-cellnumber"
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
                          Password
                        </span>
                      </Row>
                      <Form.Item name="password">
                        <Input.Password
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          data-cy="registerpage-input-password"
                          iconRender={(visible) =>
                            visible ? (
                              <img
                                src="/password_visible.png"
                                style={{ width: "22px" }}
                                alt="password visible"
                              />
                            ) : (
                              <img
                                src="/password_invisible.png"
                                style={{ width: "22px" }}
                                alt="password invisible"
                              />
                            )
                          }
                          // onFocus={setPasswordFocussed}
                          // onBlur={setPasswordNotFocussed}
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
                      <Form.Item
                        name="_submit"
                        style={{ marginBottom: "12px" }}
                      >
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
                      <Form.Item
                        name="agreedToTerms"
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <FormikIconCheckBox
                            name="agreedToTerms"
                            style={{
                              display: "flex",
                              borderStyle: "none",
                              padding: "0px",
                              width: "14px",
                              height: "14px",
                              marginRight: "4px",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "Poppins, sans-serif",
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#8F9092",
                            }}
                          >
                            <a
                              href="/terms"
                              style={{ color: "#7FB3E8", fontWeight: 600 }}
                            >
                              서비스 이용약관
                            </a>
                            에 동의합니다
                          </span>
                        </div>
                      </Form.Item>
                    </Form>
                  )}
                </Formik>
              </div>
            </Col>
          </Row>
          //       <Form
          //         {...formItemLayout}
          //         form={form}
          //         onFinish={handleSubmit}
          //         onValuesChange={handleValuesChange}
          //       >
          //         <Form.Item
          //           label={
          //             <span data-cy="registerpage-name-label">
          //               Name&nbsp;
          //               <Tooltip title="What is your name?">
          //                 <QuestionCircleOutlined />
          //               </Tooltip>
          //             </span>
          //           }
          //           name="name"
          //           rules={[
          //             {
          //               required: true,
          //               message: "Please input your name.",
          //               whitespace: true,
          //             },
          //           ]}
          //         >
          //           <Input
          //             ref={focusElement}
          //             autoComplete="name"
          //             data-cy="registerpage-input-name"
          //           />
          //         </Form.Item>
          //         <Form.Item
          //           label={
          //             <span>
          //               Username&nbsp;
          //               <Tooltip title="What do you want others to call you?">
          //                 <QuestionCircleOutlined />
          //               </Tooltip>
          //             </span>
          //           }
          //           name="username"
          //           rules={[
          //             {
          //               required: true,
          //               message: "Please input your username.",
          //               whitespace: true,
          //             },
          //             {
          //               min: 2,
          //               message: "Username must be at least 2 characters long.",
          //             },
          //             {
          //               max: 24,
          //               message: "Username must be no more than 24 characters long.",
          //             },
          //             {
          //               pattern: /^([a-zA-Z]|$)/,
          //               message: "Username must start with a letter.",
          //             },
          //             {
          //               pattern: /^([^_]|_[^_]|_$)*$/,
          //               message:
          //                 "Username must not contain two underscores next to each other.",
          //             },
          //             {
          //               pattern: /^[a-zA-Z0-9_]*$/,
          //               message:
          //                 "Username must contain only alphanumeric characters and underscores.",
          //             },
          //           ]}
          //         >
          //           <Input
          //             autoComplete="username"
          //             data-cy="registerpage-input-username"
          //           />
          //         </Form.Item>
          //         <Form.Item
          //           label="E-mail"
          //           name="email"
          //           rules={[
          //             {
          //               type: "email",
          //               message: "The input is not valid E-mail.",
          //             },
          //             {
          //               required: true,
          //               message: "Please input your E-mail.",
          //             },
          //           ]}
          //         >
          //           <Input data-cy="registerpage-input-email" />
          //         </Form.Item>
          //         <Form.Item label="Passphrase" required>
          //           <Form.Item
          //             noStyle
          //             name="password"
          //             rules={[
          //               {
          //                 required: true,
          //                 message: "Please input your passphrase.",
          //               },
          //             ]}
          //           >
          //             <Input
          //               type="password"
          //               autoComplete="new-password"
          //               data-cy="registerpage-input-password"
          //               onFocus={setPasswordFocussed}
          //               onBlur={setPasswordNotFocussed}
          //             />
          //           </Form.Item>
          //           <PasswordStrength
          //             passwordStrength={passwordStrength}
          //             suggestions={passwordSuggestions}
          //             isDirty={passwordIsDirty}
          //             isFocussed={passwordIsFocussed}
          //           />
          //         </Form.Item>
          //         <Form.Item
          //           label="Confirm passphrase"
          //           name="confirm"
          //           rules={[
          //             {
          //               required: true,
          //               message: "Please confirm your passphrase.",
          //             },
          //             {
          //               validator: compareToFirstPassword,
          //             },
          //           ]}
          //         >
          //           <Input
          //             type="password"
          //             autoComplete="new-password"
          //             onBlur={handleConfirmBlur}
          //             data-cy="registerpage-input-password2"
          //           />
          //         </Form.Item>
          //         {error ? (
          //           <Form.Item label="Error">
          //             <Alert
          //               type="error"
          //               message={`Registration failed`}
          //               description={
          //                 <span>
          //                   {extractError(error).message}
          //                   {code ? (
          //                     <span>
          //                       {" "}
          //                       (Error code: <code>ERR_{code}</code>)
          //                     </span>
          //                   ) : null}
          //                 </span>
          //               }
          //             />
          //           </Form.Item>
          //         ) : null}
          //         <Form.Item {...tailFormItemLayout}>
          //           <Button htmlType="submit" data-cy="registerpage-submit-button">
          //             Register
          //           </Button>
          //         </Form.Item>
          //       </Form>
        )
      }
    </SharedLayout>
  );
};
Register.getInitialProps = async ({ query }) => ({
  next: typeof query.next === "string" ? query.next : null,
});

export default Register;
