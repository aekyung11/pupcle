import { Link, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Row } from "antd";
import { NextPage } from "next";
import * as React from "react";

const StartPage: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="" query={query}>
      <Col span={24}>
        <Row
          style={{
            display: "flex",
            backgroundImage: "url(/background-effect.png)",
            height: "calc(100vh - 6rem)",
            minHeight: "calc(330px + 9rem)",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPositionY: "4.5rem",
          }}
        >
          <Col
            span={12}
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              padding: "4.5rem 1rem 4.5rem 0",
            }}
          >
            <img
              src="/cycle_example.png"
              style={{
                height: "fit-content",
                width: "85%",
                maxWidth: "600px",
              }}
              alt="cycle example"
            />
          </Col>
          <Col
            span={12}
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              padding: "4.5rem 0 4.5rem max(3rem, 6vw)",
            }}
          >
            <div
              style={{
                minHeight: "330px",
                maxHeight: "630px",
                height: "40vw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {query.data?.currentUser ? (
                <>
                  <Row>
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(calc(16px + 3vw), 64px)",
                        fontWeight: 700,
                        textAlign: "left",
                      }}
                    >
                      Document
                      <br />
                      your pet&apos;s
                      <br />
                      current condition
                      <br />
                      with{" "}
                      <span
                        style={{ color: "#7FB3E8", textTransform: "uppercase" }}
                      >
                        Pupcle
                      </span>
                    </span>
                  </Row>
                  <Row
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      paddingTop: "min(4rem, 4vw)",
                    }}
                  >
                    <Button
                      href="/home"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#7FB3E8",
                        height: "min(calc(24px + 3vw), 72px)",
                        width: "75%",
                        borderRadius: "36px",
                        borderStyle: "none",
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(32px, 2.5vw)",
                        fontWeight: 600,
                        color: "white",
                      }}
                    >
                      Let&apos;s start PUPCLE
                    </Button>
                  </Row>
                </>
              ) : (
                <>
                  <Row>
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(calc(16px + 3vw), 64px)",
                        fontWeight: 700,
                        textAlign: "left",
                      }}
                    >
                      Check
                      <br />
                      your pet&apos;s
                      <br />
                      condition
                      <br />
                      with{" "}
                      <span
                        style={{ color: "#7FB3E8", textTransform: "uppercase" }}
                      >
                        Pupcle
                      </span>
                    </span>
                  </Row>
                  <Row
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: "min(2.5rem, 2.5vw)",
                    }}
                  >
                    <Button
                      href="/register"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#7FB3E8",
                        height: "min(calc(16px + 3vw), 56px)",
                        width: "87%",
                        borderRadius: "28px",
                        borderStyle: "none",
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(24px, 2vw)",
                        fontWeight: 600,
                        color: "white",
                      }}
                    >
                      Create an account
                    </Button>
                  </Row>
                  <Row
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: "min(1rem, 1vw)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(24px, 2vw)",
                        fontWeight: 400,
                        color: "#8F9092",
                        marginRight: "4px",
                      }}
                    >
                      Have an account?
                    </span>
                    <Link
                      href="/login"
                      type="default"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "min(24px, 2vw)",
                        fontWeight: 500,
                        color: "#7FB3E8",
                      }}
                    >
                      Login
                    </Link>
                  </Row>
                </>
              )}
            </div>
          </Col>
        </Row>
      </Col>
    </SharedLayout>
  );
};

export default StartPage;
