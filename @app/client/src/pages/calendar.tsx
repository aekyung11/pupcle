import { AuthRestrict, SharedLayout } from "@app/components";
import {
  DailyRecordDayStatus,
  useCalendarPageQuery,
  useCalendarRecordsQuery,
} from "@app/graphql";
import { Col, Row } from "antd";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { keyBy } from "lodash";
import { NextPage } from "next";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { DayContent, DayContentProps, DayPicker } from "react-day-picker";

const useToday = () => {
  const [day, setDay] = useState<string | null>(null);
  const [dayDate, setDayDate] = useState<Date | null>(null);
  const [monthStart, setMonthStart] = useState<Date | null>(null);
  const [monthEnd, setMonthEnd] = useState<Date | null>(null);
  useEffect(() => {
    const date = new Date();
    setDay(format(date, "yyyy-MM-dd"));
    setDayDate(date);
    setMonthStart(startOfMonth(date));
    setMonthEnd(endOfMonth(date));
  }, []);
  return { day, dayDate, monthStart, setMonthStart, monthEnd, setMonthEnd };
};

const Calendar: NextPage = () => {
  const {
    day: today,
    monthStart,
    setMonthStart,
    monthEnd,
    setMonthEnd,
  } = useToday();

  const query = useCalendarPageQuery();
  const currentUserFirstPet = query.data?.currentUser?.pets.nodes[0];
  const [selectedPetId, setSelectedPetId] = useState(
    currentUserFirstPet?.id as string | undefined
  );
  // TODO: use inner to ensure loaded state
  const selectedPetIdOrDefault = selectedPetId ?? currentUserFirstPet?.id;

  const { data: calendarRecordsData } = useCalendarRecordsQuery({
    fetchPolicy: "network-only",
    variables: {
      petId: selectedPetIdOrDefault,
      start: monthStart ?? "2023-01-01",
      end: monthEnd ?? "2023-01-31",
    },
  });
  const firstPetCalendarRecords = calendarRecordsData?.pet;
  const pupcleCount = firstPetCalendarRecords?.sharedDailyRecords.nodes.filter(
    (sdr) => {
      return sdr.isComplete;
    }
  ).length;

  const sharedDailyRecords = keyBy(
    firstPetCalendarRecords?.sharedDailyRecords.nodes,
    "day"
  );

  const CustomDayContent: React.FC<DayContentProps> = useMemo(() => {
    const c = (props: DayContentProps) => {
      const dateTime = format(props.date, "yyyy-MM-dd");
      const sharedDailyRecord = sharedDailyRecords[dateTime];
      const completePercentage =
        ((sharedDailyRecord?.completeStatusCount ?? 0) / 6) * 100;
      return (
        <time
          dateTime={dateTime}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <DayContent {...props} />
          {sharedDailyRecord && completePercentage ? (
            <div
              className="radial-progress"
              style={{
                // width: "1rem",
                // height: "1rem",
                // @ts-ignore
                "--value": completePercentage,
                // @ts-ignore
                "--size": "3vw",
                // @ts-ignore
                "--thickness": "1vw",
                color:
                  DailyRecordDayStatus.AllGood === sharedDailyRecord.dayStatus
                    ? "#7fb3e8"
                    : DailyRecordDayStatus.Mixed === sharedDailyRecord.dayStatus
                    ? "#A0B0EB"
                    : DailyRecordDayStatus.AllBad ===
                      sharedDailyRecord.dayStatus
                    ? "#E35B67"
                    : undefined,
              }}
            ></div>
          ) : null}
        </time>
      );
    };
    c.displayName = "CustomDayContent";
    return c;
  }, [sharedDailyRecords]);

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
              style={{
                height: "85%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {monthStart && monthEnd && (
                <DayPicker
                  className="calendar-pupcle-calendar"
                  weekStartsOn={1}
                  locale={ko}
                  components={{ DayContent: CustomDayContent }}
                  month={monthStart}
                  onMonthChange={(month) => {
                    setMonthStart(startOfMonth(month));
                    setMonthEnd(endOfMonth(month));
                  }}
                />
              )}
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
                {currentUserFirstPet?.name}
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
