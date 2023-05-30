import { AuthRestrict, SharedLayout } from "@app/components";
import { useCalendarPageQuery } from "@app/graphql";
import { Col, Row } from "antd";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { NextPage } from "next";
import * as React from "react";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";

enum Tab {
  SLEEP = "sleep",
  DIET = "diet",
  WALKING = "walking",
  PLAY = "play",
  BATHROOM = "bathroom",
  HEALTH = "health",
}

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  const [dayDate, setDayDate] = useState<Date | null>(null);
  useEffect(() => {
    const date = new Date();
    setDay(format(date, "yyyy-MM-dd"));
    setDayDate(date);
  }, []);
  return { day, dayDate };
};

const Calendar: NextPage = () => {
  const { day: today, dayDate: todayDate } = useToday();
  const firstDayOfMonth = todayDate ? startOfMonth(todayDate) : null;
  const lastDayOfMonth = todayDate ? endOfMonth(todayDate) : null;

  const query = useCalendarPageQuery({
    variables: {
      start: firstDayOfMonth ?? "2023-01-01",
      end: lastDayOfMonth ?? "2023-01-31",
    },
  });
  const _refetch = async () => query.refetch();
  const pet = query.data?.currentUser?.pets.nodes[0];
  const _todayPrivateDailyRecord = pet?.privateDailyRecords.nodes.find(
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

  const pupcleCount = pet?.sharedDailyRecords.nodes.filter((sdr) => {
    return sdr.isComplete;
  }).length;

  return (
    <SharedLayout
      title="calendar"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <Col span={24} style={{ padding: "0 1rem" }}>
        <Row
          style={{
            display: "flex",
            height: "calc(100vh - 6rem)",
            minHeight: "calc(330px + 9rem)",
          }}
        >
          <Col
            span={14}
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <div
              style={{ height: "85%", display: "flex", alignItems: "center" }}
            >
              <DayPicker
                className="calendar-pupcle-calendar"
                weekStartsOn={1}
                locale={ko}
              />
            </div>
          </Col>
          <Col
            span={8}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div style={{ marginBottom: "min(2vw, 20px)" }}>
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "min(calc(16px + 2vw), 48px)",
                  fontWeight: 700,
                }}
              >
                {pet?.name}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "min(30px, 2.4vw)",
                  fontWeight: 400,
                }}
              >
                총 획득 펍클:&nbsp;&nbsp;{pupcleCount}&nbsp;
              </span>
              <img
                src="/pupcle_count.png"
                style={{
                  width: "min(29px, 20px + 0.5vw)",
                  height: "fit-content",
                }}
                alt="pupcle count"
              />
            </div>
          </Col>
          <Col
            span={2}
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <div
              style={{
                height: "85%",
                width: "min(85px, 4rem + 0.5vw)",
                backgroundColor: "rgba(127, 179, 232, 0.3)",
                borderRadius: "min(30px, 20px + 0.5vw)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  height: "90%",
                }}
              >
                {/* TODO: friends.map() */}
                <div
                  style={{
                    borderRadius: "50%",
                    width: "min(57px, 3rem + 0.2vw)",
                    height: "min(57px, 3rem + 0.2vw)",
                    margin: "1rem 0px",
                  }}
                >
                  {/* TODO: write an if statement */}
                  <img
                    src="/calendar_friends_avatar_default.png"
                    alt="friend avatar"
                  />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </SharedLayout>
  );
};

export default Calendar;
