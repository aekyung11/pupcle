import { AuthRestrict, Link, SharedLayout } from "@app/components";
import {
  DailyRecordStatus,
  HomePage_PrivateDailyRecordFragment,
  PetGender,
  SharedLayout_UserFragment,
  useHomePageQuery,
  useSharedQuery,
  useUpsertPrivateDailyRecordMutation,
} from "@app/graphql";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as Tabs from "@radix-ui/react-tabs";
import { Button, Col, Input, Row } from "antd";
import { format } from "date-fns";
import { min } from "lodash";
import { NextPage } from "next";
import * as React from "react";
import { FC, useEffect, useState } from "react";

enum Tab {
  SLEEP = "sleep",
  DIET = "diet",
  WALKING = "walking",
  PLAY = "play",
  BATHROOM = "bathroom",
  HEALTH = "health",
}

type StatusTabProps = {
  tab: Tab;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  userId: string;
  petId: string;
  day: string;
  refetch: () => Promise<any>;
};

function StatusTab({
  tab,
  privateRecord,
  userId,
  petId,
  day,
  refetch,
}: StatusTabProps) {
  const [upsertPrivateDailyRecord] = useUpsertPrivateDailyRecordMutation();
  const [showCommentBox, setShowCommentBox] = useState<boolean>(false);

  let statusKey: keyof HomePage_PrivateDailyRecordFragment;
  let status = null;
  let commentKey: keyof HomePage_PrivateDailyRecordFragment;
  let comment = null;
  let statusBannerUrl = null;
  if (tab === Tab.SLEEP) {
    statusKey = "sleepStatus";
    commentKey = "sleepComment";
    statusBannerUrl = "/sleep_status_banner.png";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.DIET) {
    statusKey = "dietStatus";
    commentKey = "dietComment";
    statusBannerUrl = "/diet_status_banner.png";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.WALKING) {
    statusKey = "walkingStatus";
    commentKey = "walkingComment";
    statusBannerUrl = "/walking_status_banner.png";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.PLAY) {
    statusKey = "playStatus";
    commentKey = "playComment";
    statusBannerUrl = "/play_status_banner.png";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.BATHROOM) {
    statusKey = "bathroomStatus";
    commentKey = "bathroomComment";
    statusBannerUrl = "/bathroom_status_banner.png";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.HEALTH) {
    statusKey = "healthStatus";
    commentKey = "healthComment";
    statusBannerUrl = "/health_status_banner.png";
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }

  const [commentBox, setCommentBox] = useState(comment || "");

  const dailyRecordStatus =
    status === DailyRecordStatus.Good || status === DailyRecordStatus.Bad
      ? status
      : undefined;

  return (
    <>
      <Row
        style={{
          marginTop: "min(5%, 20px)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <img
          src={statusBannerUrl}
          style={{
            height: "min(calc(48px + 2.4vw), 94px)",
            filter: "drop-shadow(0px 4px 7px rgb(0 0 0 / 0.1)",
          }}
        />
      </Row>
      <Row
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "min(3vw, 30px) 0px",
        }}
      >
        <span
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "min(30px, 2.4vw)",
            fontWeight: 500,
          }}
        >
          Did he {tab} well?
        </span>
      </Row>
      <Row style={{ display: showCommentBox ? "none" : "flex" }}>
        <RadioGroupPrimitive.Root
          value={dailyRecordStatus}
          onValueChange={async (status: DailyRecordStatus) => {
            await upsertPrivateDailyRecord({
              variables: {
                input: {
                  privateDailyRecord: {
                    userId,
                    petId,
                    day,
                    [statusKey]: status,
                  },
                },
              },
            });
            await refetch();
          }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: "100%",
            maxWidth: "470px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <RadioGroupPrimitive.Item
              className="circular-radio-button"
              value={DailyRecordStatus.Good}
              style={{ marginRight: "min(2vw, 40px)", borderRadius: 0 }}
            >
              <img
                src="/good_icon_unchecked.png"
                style={{ width: "min(220px, 20vw)" }}
              />
              <img
                className="image-hover"
                src="/good_icon_checked.png"
                style={{ width: "min(220px, 20vw)" }}
                // width={40}
                // height={40}
              />
            </RadioGroupPrimitive.Item>
            <RadioGroupPrimitive.Item
              className="circular-radio-button"
              value={DailyRecordStatus.Bad}
              style={{ borderRadius: 0 }}
            >
              <img
                src="/bad_icon_unchecked.png"
                style={{ width: "min(220px, 20vw)" }}
              />
              <img
                className="image-hover"
                src="/bad_icon_checked.png"
                style={{ width: "min(220px, 20vw)" }}
                // width={40}
                // height={40}
              />
            </RadioGroupPrimitive.Item>
          </div>
        </RadioGroupPrimitive.Root>
      </Row>
      <Row
        style={{
          width: "100%",
          marginTop: "min(3vw, 30px)",
          display: showCommentBox ? "none" : "flex",
        }}
      >
        <Button
          style={{
            width: "100%",
            backgroundColor: "#FFF9D8",
            height: "min(30px + 2vw, 70px)",
            borderRadius: "35px",
            border: "none",
            display: "flex",
            alignItems: "center",
            padding: "0 6%",
          }}
          onClick={() => setShowCommentBox(true)}
        >
          <img
            style={{ height: "min(calc((30px + 2vw) / 2), 35px)" }}
            src="/write_icon.png"
          />
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "min(24px, 2vw)",
              fontWeight: 600,
              color: "#615518",
              paddingLeft: "3%",
            }}
          >
            Leave a comment here
          </span>
          <img
            src="/caret_icon.png"
            style={{
              height: "min(10px + 0.2vw, 20px)",
              position: "absolute",
              right: "22px",
            }}
          />
        </Button>
      </Row>
      <Row style={{ display: showCommentBox ? "flex" : "none" }}>
        <Button onClick={() => setShowCommentBox(false)}>
          <img
            src="/close_button.png"
            style={{ width: "min(24px, 10px + 0.2vw)" }}
          />
        </Button>
        <Input.TextArea
          value={commentBox}
          onChange={(e) => setCommentBox(e.target.value)}
        />
        <Button
          onClick={async () => {
            await upsertPrivateDailyRecord({
              variables: {
                input: {
                  privateDailyRecord: {
                    userId,
                    petId,
                    day,
                    [commentKey]: commentBox,
                  },
                },
              },
            });
            await refetch();
            setShowCommentBox(false);
          }}
        >
          save
        </Button>
      </Row>
    </>
  );
}

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(format(new Date(), "yyyy-MM-dd")), []);
  return day;
};

const Home: NextPage = () => {
  const today = useToday();
  const query = useHomePageQuery({ variables: { day: today || "2023-01-01" } });
  const refetch = async () => query.refetch();
  const todayPrivateDailyRecord =
    query.data?.currentUser?.pets.nodes[0]?.privateDailyRecords.nodes.find(
      (record) => record.day === today
    );
  // console.log({ query });
  return (
    <SharedLayout
      title="home"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && today ? (
        <HomePageInner
          currentUser={query.data?.currentUser}
          privateRecord={todayPrivateDailyRecord}
          day={today}
          refetch={refetch}
        />
      ) : (
        <p>loading...</p>
      )}
    </SharedLayout>
  );
};

interface HomePageInnerProps {
  currentUser: SharedLayout_UserFragment;
  privateRecord?: HomePage_PrivateDailyRecordFragment;
  day: string;
  refetch: () => Promise<any>;
}

const HomePageInner: FC<HomePageInnerProps> = ({
  currentUser,
  privateRecord,
  day,
  refetch,
}) => {
  return (
    <Tabs.Root defaultValue={undefined}>
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
          <Col span={12}>
            <Tabs.List
              className="cycle"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                padding: "4.5rem 1rem 4.5rem 0",
                position: "relative",
                height: "100%",
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
              <Tabs.Trigger value={Tab.SLEEP} key={Tab.SLEEP} asChild={true}>
                <Button className="status-tab-trigger sleep">
                  <img id="sleep" src="/sleep.png" />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value={Tab.DIET} key={Tab.DIET} asChild={true}>
                <Button className="status-tab-trigger diet">
                  <img id="diet" src="/diet.png" />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger
                value={Tab.WALKING}
                key={Tab.WALKING}
                asChild={true}
              >
                <Button className="status-tab-trigger walking">
                  <img id="walking" src="/walking.png" />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value={Tab.PLAY} key={Tab.PLAY} asChild={true}>
                <Button className="status-tab-trigger play">
                  <img id="play" src="/play.png" />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger
                value={Tab.BATHROOM}
                key={Tab.BATHROOM}
                asChild={true}
              >
                <Button className="status-tab-trigger bathroom">
                  <img id="bathroom" src="/bathroom.png" />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value={Tab.HEALTH} key={Tab.HEALTH} asChild={true}>
                <Button className="status-tab-trigger health">
                  <img id="health" src="/health.png" />
                </Button>
              </Tabs.Trigger>
            </Tabs.List>
          </Col>
          <Col
            span={12}
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              padding: "4.5rem max(3rem, 6vw)",
            }}
          >
            <div
              style={{
                minHeight: "330px",
                maxHeight: "630px",
                // height: "45vw",
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
                  Hello, {currentUser.pets.nodes[0]?.name}!
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
              <Row style={{ height: "80%" }}>
                {Object.values(Tab).map((tab) => (
                  <Tabs.Content value={tab} key={tab}>
                    <StatusTab
                      tab={tab}
                      privateRecord={privateRecord}
                      userId={currentUser.id}
                      petId={currentUser.pets.nodes[0]?.id}
                      day={day}
                      refetch={refetch}
                    />
                  </Tabs.Content>
                ))}
              </Row>
            </div>
          </Col>
        </Row>
      </Col>
    </Tabs.Root>
  );
};

export default Home;
