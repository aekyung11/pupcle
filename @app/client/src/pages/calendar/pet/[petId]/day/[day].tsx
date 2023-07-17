import { AuthRestrict, SharedLayout } from "@app/components";
import {
  CalendarRecords_PrivateDailyRecordFragment,
  DailyRecordDayStatus,
  DailyRecordStatus,
  useCalendarPageQuery,
  useCalendarRecordsQuery,
} from "@app/graphql";
import { format, parseISO } from "date-fns";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { type } from "os";
import React from "react";

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
        <div>
          {status === privateDailyRecord.sleepStatus && (
            <div>{privateDailyRecord.sleepComment}</div>
          )}
          {status === privateDailyRecord.dietStatus && (
            <div>{privateDailyRecord.dietComment}</div>
          )}
          {status === privateDailyRecord.walkingStatus && (
            <div>{privateDailyRecord.walkingComment}</div>
          )}
          {status === privateDailyRecord.playStatus && (
            <div>{privateDailyRecord.playComment}</div>
          )}
          {status === privateDailyRecord.bathroomStatus && (
            <div>{privateDailyRecord.bathroomComment}</div>
          )}
          {status === privateDailyRecord.healthStatus && (
            <div>{privateDailyRecord.healthComment}</div>
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
