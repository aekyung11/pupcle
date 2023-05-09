import { Link, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Row } from "antd";
import { NextPage } from "next";
import * as React from "react";

const Home: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="home" query={query}>
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
            className="cycle"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              padding: "4.5rem 1rem 4.5rem 0",
              position: "relative",
              // backgroundImage: "url(/c.png)",
            }}
          >
            <img
              src="/c.png"
              style={{
                height: "fit-content",
                width: "85%",
                maxWidth: "573px",
                filter: "drop-shadow(2px 2px 2px grey)",
              }}
            />
            <Button className="sleep">
              <img src="/sleep.png" />
            </Button>
            <Button className="diet">
              <img src="/diet.png" />
            </Button>
            <Button className="walking">
              <img src="/walking.png" />
            </Button>
            <Button className="play">
              <img src="/play.png" />
            </Button>
            <Button className="bathroom">
              <img src="/bathroom.png" />
            </Button>
            <Button className="health">
              <img src="/health.png" />
            </Button>
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
                alignItems: "center",
              }}
            >
              <Row>
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "min(30px, 2.4vw)",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Hello, {query.data?.currentUser?.pets.nodes[0]?.name}!
                </span>
              </Row>
              <Row>
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "min(calc(16px + 2vw), 48px)",
                    fontWeight: 700,
                    textAlign: "left",
                  }}
                >
                  How was today?
                </span>
              </Row>
            </div>
          </Col>
        </Row>
      </Col>
    </SharedLayout>
  );
};

export default Home;
