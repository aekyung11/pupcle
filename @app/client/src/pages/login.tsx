import {
  LockOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ApolloError, useApolloClient } from "@apollo/client";
import {
  AuthRestrict,
  ButtonLink,
  Col,
  Redirect,
  Row,
  SharedLayout,
  SharedLayoutChildProps,
  SocialLoginOptions,
} from "@app/components";
import { useLoginMutation, useSharedQuery } from "@app/graphql";
import {
  extractError,
  getCodeFromError,
  resetWebsocketConnection,
} from "@app/lib";
import type { InputRef } from "antd";
import { Alert, Button, Form, Input } from "antd";
import { useForm } from "antd/lib/form/Form";
import { NextPage } from "next";
import Link from "next/link";
import Router from "next/router";
import { Store } from "rc-field-form/lib/interface";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface LoginProps {
  next: string | null;
}

export function isSafe(nextUrl: string | null) {
  // Prevent protocol-relative URLs - test for `//foo.bar`
  return (nextUrl && nextUrl[0] === "/" && nextUrl[1] !== "/") || false;
}

/**
 * Login page just renders the standard layout and embeds the login form
 */
const Login: NextPage<LoginProps> = ({ next: rawNext }) => {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const next: string = isSafe(rawNext) ? rawNext! : "/";
  const query = useSharedQuery();
  return (
    <SharedLayout
      title="Sign in"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_IN}
    >
      {({ currentUser }: SharedLayoutChildProps) =>
        currentUser ? (
          <Redirect href={next} />
        ) : (
          <Row justify="center">
            {showLogin ? (
              <Row>
                <LoginForm
                  onSuccessRedirectTo={next}
                  onCancel={() => setShowLogin(false)}
                  error={error}
                  setError={setError}
                />
              </Row>
            ) : (
              <Row
                style={{
                  width: "100%",
                  height: "100vh",
                  backgroundColor: "#D8E7F7",
                  minHeight: "600px",
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
                      <img src="/logo.png" style={{ height: "2.4rem" }} />
                    </Link>
                  </Row>
                  <Row style={{ display: "flex", justifyContent: "center" }}>
                    <img
                      src="/login_page_img.png"
                      style={{ maxWidth: "400px", width: "80%" }}
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
                      Check your pet's condition easily
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
                    <Row style={{ display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          marginRight: "4px",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "24px",
                          fontWeight: 600,
                        }}
                      >
                        로그인
                      </span>
                      <img
                        src="/paw.png"
                        style={{ width: "36px", marginBottom: "3px" }}
                      />
                    </Row>
                    <Row>
                      <span
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          margin: "8px 0px 32px",
                        }}
                      >
                        Please login to access your account.
                      </span>
                    </Row>
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
                      <Form.Item
                        name="email"
                        rules={[
                          {
                            required: true,
                            message: "Please input your email",
                          },
                        ]}
                      >
                        <Input
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
                          // prefix={
                          //   <UserOutlined
                          //     style={{ color: "rgba(0,0,0,.25)" }}
                          //   />
                          // }
                          // placeholder="E-mail or Username"
                          autoComplete="email username"
                          // ref={focusElement}
                          data-cy="loginpage-input-username"
                        />
                      </Form.Item>
                      <Row
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "32px",
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
                      <Form.Item
                        name="password"
                        rules={[
                          {
                            required: true,
                            message: "Please input your password",
                          },
                        ]}
                        style={{ marginBottom: "0px" }}
                      >
                        <Input
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
                          // prefix={
                          //   <LockOutlined
                          //     style={{ color: "rgba(0,0,0,.25)" }}
                          //   />
                          // }
                          // size="large"
                          type="password"
                          // placeholder="Passphrase"
                          autoComplete="current-password"
                          data-cy="loginpage-input-password"
                          // TODO: eyeoutlined/eyeinvisibleoutlined
                        />
                      </Form.Item>
                      <Form.Item>
                        <Link
                          href="/forgot"
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#7FB3E8",
                            paddingLeft: "16px",
                          }}
                        >
                          Forgot Password?
                        </Link>
                      </Form.Item>
                      <Form.Item style={{ marginBottom: "12px" }}>
                        <Button
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
                            marginTop: "1rem",
                          }}
                          type="primary"
                          htmlType="submit"
                          // disabled={submitDisabled}
                          data-cy="loginpage-button-submit"
                        >
                          Sign in
                        </Button>
                      </Form.Item>
                      <Row
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <span
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "14px",
                            fontWeight: 400,
                            color: "#8F9092",
                            marginRight: "4px",
                          }}
                        >
                          계정이 없으십니까?
                        </span>
                        <Link
                          href={`/register?next=${encodeURIComponent(next)}`}
                          type="default"
                          data-cy="loginpage-button-register"
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#7FB3E8",
                          }}
                        >
                          Sign up
                        </Link>
                      </Row>
                    </Form>
                    {/* <Row>
                      <Input
                        style={{
                          backgroundColor: "#f5f5f5",
                          height: "40px",
                          borderRadius: "20px",
                          borderStyle: "none",
                        }}
                      />
                    </Row> */}
                    {/* <Row>
                      <Input
                        style={{
                          backgroundColor: "#f5f5f5",
                          height: "40px",
                          borderRadius: "20px",
                          borderStyle: "none",
                        }}
                      />
                    </Row> */}
                  </div>

                  {/* <Button
                    data-cy="loginpage-button-withusername"
                    icon={<UserOutlined />}
                    size="large"
                    block
                    onClick={() => setShowLogin(true)}
                    type="primary"
                  >
                    Sign in with E-mail or Username
                  </Button> */}

                  {/* <SocialLoginOptions next={next} /> */}

                  {/* <ButtonLink
                    icon={<UserAddOutlined />}
                    size="large"
                    block
                    type="default"
                    data-cy="loginpage-button-register"
                    href={`/register?next=${encodeURIComponent(next)}`}
                  >
                    Create an account
                  </ButtonLink> */}
                </Col>
              </Row>
            )}
          </Row>
        )
      }
    </SharedLayout>
  );
};

Login.getInitialProps = async ({ query }) => ({
  next: typeof query.next === "string" ? query.next : null,
});

export default Login;

interface LoginFormProps {
  onSuccessRedirectTo: string;
  error: Error | ApolloError | null;
  setError: (error: Error | ApolloError | null) => void;
  onCancel: () => void;
}

function LoginForm({
  onSuccessRedirectTo,
  onCancel,
  error,
  setError,
}: LoginFormProps) {
  const [form] = useForm();
  const [login] = useLoginMutation({});
  const client = useApolloClient();

  const [submitDisabled, setSubmitDisabled] = useState(false);
  const handleSubmit = useCallback(
    async (values: Store) => {
      setError(null);
      try {
        await login({
          variables: {
            username: values.username,
            password: values.password,
          },
        });
        // Success: refetch
        resetWebsocketConnection();
        client.resetStore();
        Router.push(onSuccessRedirectTo);
      } catch (e: any) {
        const code = getCodeFromError(e);
        if (code === "CREDS") {
          form.setFields([
            {
              name: "password",
              value: form.getFieldValue("password"),
              errors: ["Incorrect username or passphrase"],
            },
          ]);
          setSubmitDisabled(true);
        } else {
          setError(e);
        }
      }
    },
    [client, form, login, onSuccessRedirectTo, setError]
  );

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const handleValuesChange = useCallback(() => {
    setTimeout(() => {
      setSubmitDisabled(
        form.getFieldsError().some((fieldError) => fieldError.errors.length > 0)
      );
    }, 0);
  }, [form]);

  const code = getCodeFromError(error);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={handleValuesChange}
      style={{ width: "100%" }}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your username" }]}
      >
        <Input
          size="large"
          prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
          placeholder="E-mail or Username"
          autoComplete="email username"
          ref={focusElement}
          data-cy="loginpage-input-username"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your passphrase" }]}
      >
        <Input
          prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
          size="large"
          type="password"
          placeholder="Passphrase"
          autoComplete="current-password"
          data-cy="loginpage-input-password"
        />
      </Form.Item>
      <Form.Item>
        <Link href="/forgot">Forgotten passphrase?</Link>
      </Form.Item>

      {error ? (
        <Form.Item>
          <Alert
            type="error"
            message={`Sign in failed`}
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
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          disabled={submitDisabled}
          data-cy="loginpage-button-submit"
        >
          Sign in
        </Button>
        <a style={{ marginLeft: 16 }} onClick={onCancel}>
          Use a different sign in method
        </a>
      </Form.Item>
    </Form>
  );
}
