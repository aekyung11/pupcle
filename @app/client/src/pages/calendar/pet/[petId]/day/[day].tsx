import { DownOutlined } from "@ant-design/icons";
import { AuthRestrict, SharedLayout } from "@app/components";
import {
  CalendarRecords_PrivateDailyRecordFragment,
  DailyRecordDayStatus,
  DailyRecordStatus,
  useCalendarPageQuery,
  useCalendarRecordsQuery,
} from "@app/graphql";
import { Button, Typography } from "antd";
import { format, parseISO } from "date-fns";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { type } from "os";
import React, { useEffect, useState } from "react";
const { Paragraph } = Typography;

export function usePetId() {
  const router = useRouter();
  const { petId } = router.query;
  return String(petId);
}

export function useDay() {
  const router = useRouter();
  const { day } = router.query;
  return String(day);
}

const TestExpandable = ({
  setIsExpandable,
}: {
  setIsExpandable: (isExpandable: boolean) => void;
}) => {
  useEffect(() => {
    setIsExpandable(true);
    return () => {
      setIsExpandable(false);
    };
  });
  return null;
};

type CommentRowProps = {
  statusImage: string;
  statusComment: string | null;
};

const CommentRow: React.FC<CommentRowProps> = ({
  statusImage,
  statusComment,
}: CommentRowProps) => {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        margin: "30px 0px",
      }}
    >
      <div style={{ width: "15%" }}>
        <img src={statusImage} style={{ width: "36px" }} />
      </div>
      <div
        style={{
          width: "70%",
          textOverflow: "ellipsis",
          // whiteSpace: "nowrap",
          overflow: "hidden",
          paddingRight: "20px",
          paddingTop: "8px",
        }}
      >
        {isCommentExpanded ? (
          <Paragraph
            key={`isExpanded-${true}`}
            style={{
              marginBottom: 0,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: "min(16px, 12 + 0.5vw)",
              color: "#8F9092",
            }}
          >
            {statusComment} &nbsp;&nbsp;
            {isCommentExpanded && (
              <Button
                onClick={() => setIsCommentExpanded(false)}
                style={{
                  // width: "min(74px, 4rem + 0.5vw)",
                  height: "27px",
                  display: "inline-block",
                  borderWidth: "2px",
                  borderRadius: "14px",
                  alignItems: "center",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "min(16px, 12 + 0.5vw)",
                  color: "#7FB3E8",
                  borderColor: "#7FB3E8",
                  backgroundColor: "white",
                  padding: "0 10px",
                }}
              >
                접기
              </Button>
            )}
          </Paragraph>
        ) : (
          <Paragraph
            key={`isExpanded-${false}`}
            style={{
              marginBottom: 0,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: "min(16px, 12 + 0.5vw)",
              color: "#8F9092",
            }}
            ellipsis={{
              rows: 1,
              expandable: true,
              onExpand: () => setIsCommentExpanded(true),
              symbol: <TestExpandable setIsExpandable={setIsExpandable} />,
            }}
          >
            {statusComment}
          </Paragraph>
        )}
      </div>
      <div>
        {isExpandable && (
          <Button
            onClick={() => setIsCommentExpanded(true)}
            style={{
              // width: "min(74px, 4rem + 0.5vw)",
              height: "27px",
              display: "flex",
              borderRadius: "14px",
              alignItems: "center",
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: "min(16px, 12 + 0.5vw)",
              color: "white",
              backgroundColor: "#7FB3E8",
              borderStyle: "none",
              marginTop: "5px",
            }}
          >
            펼치기
          </Button>
        )}
      </div>
    </div>
  );
};

type StatusTableProps = {
  status: DailyRecordStatus;
  privateDailyRecord: CalendarRecords_PrivateDailyRecordFragment;
};

const StatusTable: React.FC<StatusTableProps> = ({
  status,
  privateDailyRecord,
}: StatusTableProps) => {
  return (
    <div
      style={{
        width: "48%",
        display: "flex",
        backgroundColor: "white",
        borderRadius: "30px",
        justifyContent: "center",
        padding: "80px 0px",
        height: "calc(100vh - 6rem - 140px - 20px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          width: "80%",
        }}
      >
        <img
          src={
            status === DailyRecordStatus.Good
              ? "/good_puppy.png"
              : status === DailyRecordStatus.Bad
              ? "/bad_puppy.png"
              : undefined
          }
          style={{ width: "min(180px, 150px + 2vw)" }}
        />
        <span
          style={{
            fontFamily: "Poppins",
            fontWeight: 600,
            fontSize: "min(28px, 2.2vw)",
            color: "#FF9C06",
            marginTop: "1rem",
          }}
        >
          {status === DailyRecordStatus.Good && "GOOD"}
          {status === DailyRecordStatus.Bad && "BAD"}
        </span>
        <div
          style={{
            height: "2px",
            width: "100%",
            borderRadius: "1px",
            backgroundColor: "#7FB3E8",
            marginTop: "0.5rem",
          }}
        ></div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            width: "90%",
            marginTop: "30px",
            overflow: "scroll",
          }}
        >
          {status === privateDailyRecord.sleepStatus && (
            <CommentRow
              statusImage={"/sleep_status_grey.png"}
              statusComment={privateDailyRecord.sleepComment}
            />
          )}
          {status === privateDailyRecord.dietStatus && (
            <CommentRow
              statusImage={"/diet_status_grey.png"}
              statusComment={privateDailyRecord.dietComment}
            />
          )}
          {status === privateDailyRecord.walkingStatus && (
            <CommentRow
              statusImage={"/walking_status_grey.png"}
              statusComment={privateDailyRecord.walkingComment}
            />
          )}
          {status === privateDailyRecord.playStatus && (
            <CommentRow
              statusImage={"/play_status_grey.png"}
              statusComment={privateDailyRecord.playComment}
            />
          )}
          {status === privateDailyRecord.bathroomStatus && (
            <CommentRow
              statusImage={"/bathroom_status_grey.png"}
              statusComment={privateDailyRecord.bathroomComment}
            />
          )}
          {status === privateDailyRecord.healthStatus && (
            <CommentRow
              statusImage={"/health_status_grey.png"}
              statusComment={privateDailyRecord.healthComment}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarPetDay: NextPage = () => {
  const query = useCalendarPageQuery();
  const petId = usePetId();
  const day = useDay();
  const formattedDay = format(parseISO(day), "yyyy.MM.dd");
  const { data: calendarRecordsData } = useCalendarRecordsQuery({
    fetchPolicy: "network-only",
    variables: {
      petId: petId,
      start: day,
      end: day,
    },
  });
  const pet = calendarRecordsData?.pet;
  const dailyRecord = pet?.privateDailyRecords.nodes[0];

  return (
    <SharedLayout
      title="calendar-pet-day"
      query={query}
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {!dailyRecord ? (
        <>404 Not Found</>
      ) : (
        <>
          {" "}
          <div
            style={{
              padding: "40px 50px",
              height: "15%",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "min(48px, 3.8vw)",
                fontWeight: 700,
                textAlign: "center",
                marginRight: "1rem",
              }}
            >
              {pet.name}
            </span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "min(30px, 2.4vw)",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {formattedDay}
              </span>
              <img
                src="/calendar_blk.png"
                style={{
                  width: "min(30px, 2.4vw)",
                  height: "min(30px, 2.4vw)",
                  margin: "0 0 1px 2px",
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "85%",
              justifyContent: "space-around",
              padding: "0px 20px 40px",
            }}
          >
            <div style={{ display: "contents" }}>
              <StatusTable
                status={DailyRecordStatus.Good}
                privateDailyRecord={dailyRecord}
              />
            </div>
            <div style={{ display: "contents" }}>
              <StatusTable
                status={DailyRecordStatus.Bad}
                privateDailyRecord={dailyRecord}
              />
            </div>
          </div>
        </>
      )}
    </SharedLayout>
  );
};

export default CalendarPetDay;
