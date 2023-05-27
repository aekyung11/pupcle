import { AspectRatioImage, AuthRestrict, SharedLayout } from "@app/components";
import {
  DailyRecordStatus,
  HomePage_PetFragment,
  HomePage_PrivateDailyRecordFragment,
  HomePage_SharedDailyRecordFragment,
  PetGender,
  SharedLayout_UserFragment,
  useHomePageQuery,
  useUpsertPrivateDailyRecordMutation,
} from "@app/graphql";
import badIconChecked from "@app/server/public/bad_icon_checked.png";
import badIconUnchecked from "@app/server/public/bad_icon_unchecked.png";
import bathroom from "@app/server/public/bathroom.png";
import bathroomStatusBanner from "@app/server/public/bathroom_status_banner.png";
import c from "@app/server/public/c.png";
import cBathroomSelected from "@app/server/public/c_bathroom_selected.png";
import cDietSelected from "@app/server/public/c_diet_selected.png";
import cHealthSelected from "@app/server/public/c_health_selected.png";
import cPlaySelected from "@app/server/public/c_play_selected.png";
import cSleepSelected from "@app/server/public/c_sleep_selected.png";
import cWalkingSelected from "@app/server/public/c_walking_selected.png";
import caretIcon from "@app/server/public/caret_icon.png";
import closeButton from "@app/server/public/close_button.png";
import diet from "@app/server/public/diet.png";
import dietStatusBanner from "@app/server/public/diet_status_banner.png";
import goodIconChecked from "@app/server/public/good_icon_checked.png";
import goodIconUnchecked from "@app/server/public/good_icon_unchecked.png";
import health from "@app/server/public/health.png";
import healthStatusBanner from "@app/server/public/health_status_banner.png";
import play from "@app/server/public/play.png";
import playStatusBanner from "@app/server/public/play_status_banner.png";
import sleep from "@app/server/public/sleep.png";
import sleepStatusBanner from "@app/server/public/sleep_status_banner.png";
import statusHero from "@app/server/public/status_hero.png";
import walking from "@app/server/public/walking.png";
import walkingStatusBanner from "@app/server/public/walking_status_banner.png";
import writeIcon from "@app/server/public/write_icon.png";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as Tabs from "@radix-ui/react-tabs";
import { Button, Col, Row } from "antd";
import clsx from "clsx";
import { format } from "date-fns";
import { NextPage } from "next";
import Image from "next/image";
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
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  userId: string;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
};

function StatusTab({
  tab,
  privateRecord,
  userId,
  day,
  refetch,
  pet,
}: StatusTabProps) {
  const [upsertPrivateDailyRecord] = useUpsertPrivateDailyRecordMutation();
  const [showCommentBox, setShowCommentBox] = useState<boolean>(false);

  let statusKey: keyof HomePage_PrivateDailyRecordFragment;
  let status = null;
  let commentKey: keyof HomePage_PrivateDailyRecordFragment;
  let comment = null;
  let statusBannerUrl: React.ComponentProps<typeof Image>["src"] =
    "/unknown.png";
  let statusBannerWidth = 0;
  let statusBannerHeight = 0;
  if (tab === Tab.SLEEP) {
    statusKey = "sleepStatus";
    commentKey = "sleepComment";
    statusBannerUrl = sleepStatusBanner;
    statusBannerWidth = 829;
    statusBannerHeight = 282;
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.DIET) {
    statusKey = "dietStatus";
    commentKey = "dietComment";
    statusBannerUrl = dietStatusBanner;
    statusBannerWidth = 765;
    statusBannerHeight = 282;
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.WALKING) {
    statusKey = "walkingStatus";
    commentKey = "walkingComment";
    statusBannerUrl = walkingStatusBanner;
    statusBannerWidth = 1276;
    statusBannerHeight = 307;
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.PLAY) {
    statusKey = "playStatus";
    commentKey = "playComment";
    statusBannerUrl = playStatusBanner;
    statusBannerWidth = 755;
    statusBannerHeight = 282;
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.BATHROOM) {
    statusKey = "bathroomStatus";
    commentKey = "bathroomComment";
    statusBannerUrl = bathroomStatusBanner;
    statusBannerWidth = 1454;
    statusBannerHeight = 282;
    if (privateRecord) {
      status = privateRecord[statusKey];
      comment = privateRecord[commentKey];
    }
  }
  if (tab === Tab.HEALTH) {
    statusKey = "healthStatus";
    commentKey = "healthComment";
    statusBannerUrl = healthStatusBanner;
    statusBannerWidth = 1023;
    statusBannerHeight = 291;
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
        <AspectRatioImage
          src={statusBannerUrl}
          style={{
            height: "min(calc(48px + 2.4vw), 94px)",
            filter: "drop-shadow(0px 4px 7px rgb(0 0 0 / 0.1))",
          }}
          alt="status banner"
          imgWidth={statusBannerWidth}
          imgHeight={statusBannerHeight}
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
          Did {pet.gender === PetGender.F ? "she" : "he"} {tab} well?
        </span>
      </Row>
      <Row
        style={{
          display: "flex",
          position: "relative",
          justifyContent: "center",
          width: "min(32vw, 580px)",
          minWidth: "280px",
        }}
      >
        <RadioGroupPrimitive.Root
          value={dailyRecordStatus}
          onValueChange={async (status: DailyRecordStatus) => {
            await upsertPrivateDailyRecord({
              variables: {
                input: {
                  privateDailyRecord: {
                    userId,
                    petId: pet.id,
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
            // width: "100%",
            // maxWidth: "470px",
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
              <AspectRatioImage
                src={goodIconUnchecked}
                style={{ width: "min(220px, 20vw)" }}
                alt="good unchecked"
                imgWidth={644}
                imgHeight={512}
              />
              <AspectRatioImage
                className="image-hover"
                src={goodIconChecked}
                style={{ width: "min(220px, 20vw)" }}
                alt="good checked"
                imgWidth={645}
                imgHeight={512}
              />
            </RadioGroupPrimitive.Item>
            <RadioGroupPrimitive.Item
              className="circular-radio-button"
              value={DailyRecordStatus.Bad}
              style={{ borderRadius: 0 }}
            >
              <AspectRatioImage
                src={badIconUnchecked}
                style={{ width: "min(220px, 20vw)" }}
                alt="bad icon unchecked"
                imgWidth={644}
                imgHeight={510}
              />
              <AspectRatioImage
                className="image-hover"
                src={badIconChecked}
                style={{ width: "min(220px, 20vw)" }}
                alt="bad icon checked"
                imgWidth={644}
                imgHeight={510}
              />
            </RadioGroupPrimitive.Item>
          </div>
        </RadioGroupPrimitive.Root>
      </Row>
      <Row
        style={{
          width: "min(32vw, 580px)",
          marginTop: "min(3vw, 30px)",
          display: "flex",
          position: "relative",
        }}
      >
        <Button
          style={{
            width: "100%",
            backgroundColor: comment ? "transparent" : "#FFF9D8",
            height: "min(30px + 2vw, 70px)",
            borderRadius: "35px",
            border: "none",
            display: "flex",
            alignItems: "center",
            padding: "0 6%",
          }}
          onClick={() => setShowCommentBox(true)}
          disabled={!dailyRecordStatus}
        >
          <AspectRatioImage
            style={{ height: "min(calc((30px + 2vw) / 2), 35px)" }}
            src={writeIcon}
            alt="write icon"
            imgWidth={96}
            imgHeight={96}
          />
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "min(24px, 1.8vw)",
              fontWeight: 600,
              color: "#615518",
              paddingLeft: "3%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {comment ? <u>{comment}</u> : "Leave a comment here"}
          </span>
          <AspectRatioImage
            src={caretIcon}
            style={{
              height: "min(10px + 0.2vw, 20px)",
              position: "absolute",
              right: "22px",
            }}
            alt="caret icon"
            imgWidth={72}
            imgHeight={48}
          />
        </Button>
      </Row>
      <Row
        style={{
          backgroundColor: "#FFF9D8",
          position: "absolute",
          bottom: "0px",
          width: "100%",
          height: "72%",
          borderRadius: "min(2vw, 35px)",
          display: showCommentBox ? "flex" : "none",
          filter: "drop-shadow(0px 4px 15px rgb(0 0 0 / 0.1))",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "fit-content",
            display: "flex",
            justifyContent: "flex-end",
            padding: "min(20px + 0.5vw , 40px) min(20px + 0.75vw, 48px) 0px",
          }}
        >
          <Button
            onClick={() => setShowCommentBox(false)}
            style={{
              border: "none",
              width: "min(24px, 15px + 0.5vw)",
              height: "min(24px, 15px + 0.5vw)",
              padding: "0px",
            }}
          >
            <AspectRatioImage
              src={closeButton}
              style={{ width: "min(24px, 15px + 0.5vw)" }}
              alt="close button"
              imgWidth={84}
              imgHeight={84}
            />
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "50%",
            padding: "0px min(20px + 0.75vw, 48px)",
          }}
        >
          <textarea
            className="text-Poppins text-pupcle-30px text-home-comment placeholder-home-comment w-full resize-none border-0 bg-transparent px-0 font-semibold text-gray-900 focus:outline-0 focus:ring-0"
            placeholder={
              "자세히 기록해보세요.\n(기록하지 않더라도 결과는 저장됩니다.)"
            }
            value={commentBox}
            onChange={(e) => setCommentBox(e.target.value)}
          />
        </div>
        <div
          style={{
            width: "100%",
            height: "fit-content",
            display: "flex",
            justifyContent: "flex-end",
            padding: "0px min(20px + 0.75vw, 48px) min(20px + 0.5vw , 40px)",
          }}
        >
          <Button
            style={{
              border: "none",
              borderRadius: "27px",
              height: "min(54px, 36px + 1vw)",
              fontSize: "min(30px, 2.4vw)",
              backgroundColor: "#615518",
              color: "white",
              display: "flex",
              alignItems: "center",
              fontFamily: "Poppins",
              fontWeight: 600,
              padding: "0px 8%",
            }}
            onClick={async () => {
              await upsertPrivateDailyRecord({
                variables: {
                  input: {
                    privateDailyRecord: {
                      userId,
                      petId: pet.id,
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
            SAVE
          </Button>
        </div>
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
  const pet = query.data?.currentUser?.pets.nodes[0];
  const todayPrivateDailyRecord = pet?.privateDailyRecords.nodes.find(
    (record) => record.day === today
  );
  const todaySharedDailyRecord = pet?.sharedDailyRecords.nodes.find(
    (record) => record.day === today
  );
  const [selectedTab, setSelectedTab] = useState<Tab | undefined>();

  useEffect(() => {
    if (selectedTab === undefined) {
      const completeStatusCount =
        todaySharedDailyRecord?.completeStatusCount || 0;

      const initialTab =
        completeStatusCount === 0
          ? undefined
          : Object.values(Tab)[completeStatusCount - 1];

      setSelectedTab(initialTab);
    }
  }, [selectedTab, todaySharedDailyRecord]);

  // console.log({ query });
  return (
    <SharedLayout
      title="home"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.data?.currentUser && today && pet ? (
        <HomePageInner
          currentUser={query.data?.currentUser}
          privateRecord={todayPrivateDailyRecord}
          sharedRecord={todaySharedDailyRecord}
          day={today}
          refetch={refetch}
          pet={pet}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
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
  sharedRecord?: HomePage_SharedDailyRecordFragment;
  day: string;
  refetch: () => Promise<any>;
  pet: HomePage_PetFragment;
  selectedTab: Tab | undefined;
  setSelectedTab: React.Dispatch<React.SetStateAction<Tab | undefined>>;
}

const HomePageInner: FC<HomePageInnerProps> = ({
  currentUser,
  privateRecord,
  sharedRecord,
  day,
  refetch,
  pet,
  selectedTab,
  setSelectedTab,
}) => {
  const completeStatusCount = sharedRecord?.completeStatusCount || 0;
  console.log({ completeStatusCount });
  return (
    <Tabs.Root
      value={selectedTab}
      onValueChange={(value) => setSelectedTab(value as Tab)}
    >
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
              <AspectRatioImage
                src={
                  completeStatusCount > 5
                    ? cHealthSelected
                    : completeStatusCount > 4
                    ? cBathroomSelected
                    : completeStatusCount > 3
                    ? cPlaySelected
                    : completeStatusCount > 2
                    ? cWalkingSelected
                    : completeStatusCount > 1
                    ? cDietSelected
                    : completeStatusCount > 0
                    ? cSleepSelected
                    : c
                }
                style={{
                  height: "fit-content",
                  width: "85%",
                  maxWidth: "573px",
                  filter: "drop-shadow(2px 2px 2px grey)",
                }}
                alt=""
                imgWidth={
                  completeStatusCount > 5
                    ? 1722
                    : completeStatusCount > 4
                    ? 1725
                    : completeStatusCount > 3
                    ? 1722
                    : completeStatusCount > 2
                    ? 1722
                    : completeStatusCount > 1
                    ? 1722
                    : completeStatusCount > 0
                    ? 1719
                    : 1721
                }
                imgHeight={
                  completeStatusCount > 5
                    ? 1806
                    : completeStatusCount > 4
                    ? 1810
                    : completeStatusCount > 3
                    ? 1803
                    : completeStatusCount > 2
                    ? 1803
                    : completeStatusCount > 1
                    ? 1802
                    : completeStatusCount > 0
                    ? 1800
                    : 1802
                }
              />
              <Tabs.Trigger value={Tab.SLEEP} key={Tab.SLEEP} asChild={true}>
                <Button
                  className={clsx({
                    "status-tab-trigger sleep": true,
                    complete: completeStatusCount >= 1,
                  })}
                >
                  <AspectRatioImage
                    id="sleep"
                    src={sleep}
                    alt="sleep tab"
                    imgWidth={604}
                    imgHeight={604}
                  />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value={Tab.DIET} key={Tab.DIET} asChild={true}>
                <Button
                  className={clsx({
                    "status-tab-trigger diet": true,
                    complete: completeStatusCount >= 2,
                  })}
                >
                  <AspectRatioImage
                    id="diet"
                    src={diet}
                    alt="diet tab"
                    imgWidth={604}
                    imgHeight={604}
                  />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger
                value={Tab.WALKING}
                key={Tab.WALKING}
                asChild={true}
              >
                <Button
                  className={clsx({
                    "status-tab-trigger walking": true,
                    complete: completeStatusCount >= 3,
                  })}
                >
                  <AspectRatioImage
                    id="walking"
                    src={walking}
                    alt="walking tab"
                    imgWidth={604}
                    imgHeight={604}
                  />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value={Tab.PLAY} key={Tab.PLAY} asChild={true}>
                <Button
                  className={clsx({
                    "status-tab-trigger play": true,
                    complete: completeStatusCount >= 4,
                  })}
                >
                  <AspectRatioImage
                    id="play"
                    src={play}
                    alt="play tab"
                    imgWidth={604}
                    imgHeight={604}
                  />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger
                value={Tab.BATHROOM}
                key={Tab.BATHROOM}
                asChild={true}
              >
                <Button
                  className={clsx({
                    "status-tab-trigger bathroom": true,
                    complete: completeStatusCount >= 5,
                  })}
                >
                  <AspectRatioImage
                    id="bathroom"
                    src={bathroom}
                    alt="bathroom tab"
                    imgWidth={604}
                    imgHeight={604}
                  />
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value={Tab.HEALTH} key={Tab.HEALTH} asChild={true}>
                <Button
                  className={clsx({
                    "status-tab-trigger health": true,
                    complete: completeStatusCount >= 6,
                  })}
                >
                  <AspectRatioImage
                    id="health"
                    src={health}
                    alt="health tab"
                    imgWidth={604}
                    imgHeight={604}
                  />
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
                maxWidth: "580px",
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
              <Row style={{ height: "80%", position: "relative" }}>
                {selectedTab === undefined ? (
                  <>
                    <Row
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        margin: "min(2vw, 20px) 0px min(3vw, 30px) 0px",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "min(30px, 2.4vw)",
                          fontWeight: 500,
                        }}
                      >
                        Let&apos;s click pupcle!
                      </span>
                    </Row>
                    <Row>
                      <AspectRatioImage
                        src={statusHero}
                        style={{ height: "100%" }}
                        alt="status hero"
                        imgWidth={1263}
                        imgHeight={1020}
                      />
                    </Row>
                  </>
                ) : (
                  <>
                    {Object.values(Tab).map((tab) => (
                      <Tabs.Content value={tab} key={tab}>
                        <StatusTab
                          tab={tab}
                          privateRecord={privateRecord}
                          sharedRecord={sharedRecord}
                          userId={currentUser.id}
                          day={day}
                          refetch={refetch}
                          pet={pet}
                        />
                      </Tabs.Content>
                    ))}
                  </>
                )}
              </Row>
            </div>
          </Col>
        </Row>
      </Col>
    </Tabs.Root>
  );
};

export default Home;
