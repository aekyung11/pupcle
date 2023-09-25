import { AuthRestrict, FourOhFour, SharedLayout } from "@app/components";
import {
  CalendarRecords_PrivateDailyRecordFragment,
  DailyRecordStatus,
  useCalendarPageQuery,
  useCalendarRecordsQuery,
} from "@app/graphql";
import { Button, Typography } from "antd";
import { format, parseISO } from "date-fns";
import { NextPage } from "next";
import { useRouter } from "next/router";
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
    <div className="my-[30px] flex w-full items-center justify-between">
      <div className="flex w-[50px] justify-center">
        <img src={statusImage} style={{ width: "36px" }} />
      </div>
      <div className="w-[300px] overflow-hidden text-ellipsis">
        {isCommentExpanded ? (
          <Paragraph
            className="calendar-comment font-poppins text-pupcleGray mb-0 text-[16px] font-semibold"
            key={`isExpanded-${true}`}
          >
            {statusComment} &nbsp;&nbsp;
            {isCommentExpanded && (
              <Button
                className="border-pupcleBlue inline-block h-[27px] w-[51px] rounded-full border-2 p-0"
                onClick={() => setIsCommentExpanded(false)}
              >
                <span className="font-poppins text-pupcleBlue text-[16px] font-semibold">
                  접기
                </span>
              </Button>
            )}
          </Paragraph>
        ) : (
          <Paragraph
            key={`isExpanded-${false}`}
            className="calendar-comment font-poppins text-pupcleGray mb-0 text-[16px] font-semibold"
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
        {!isExpandable || !statusComment?.length ? (
          <div className="w-[74px]"></div>
        ) : (
          <Button
            onClick={() => setIsCommentExpanded(true)}
            className="bg-pupcleBlue flex h-[27px] w-[74px] items-center rounded-full border-none"
          >
            <span className="font-poppins text-[16px] font-semibold text-white">
              펼치기
            </span>
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
    <div className="flex h-full w-full overflow-scroll rounded-[30px] bg-white px-[68px] pt-16 pb-[30px]">
      <div className="flex w-full flex-col items-center">
        <img
          className="w-[180px]"
          src={
            status === DailyRecordStatus.Good
              ? "/good_puppy.png"
              : status === DailyRecordStatus.Bad
              ? "/bad_puppy.png"
              : undefined
          }
        />
        <span className="font-poppins text-pupcleOrange mt-[14px] mb-[10px] text-[28px] font-semibold">
          {status === DailyRecordStatus.Good && "GOOD"}
          {status === DailyRecordStatus.Bad && "BAD"}
        </span>
        <div className="bg-pupcleBlue h-[2px] w-full rounded-full border-none"></div>
        <div className="mt-[30px] flex w-[90%] flex-col items-center overflow-scroll">
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
        <FourOhFour />
      ) : (
        <>
          <div className="flex h-[140px] items-baseline px-20 pt-[68px]">
            <span className="font-poppins mr-4 text-[48px] font-bold">
              {pet.name}
            </span>
            <span className="font-poppins flex items-center text-[30px] font-semibold">
              {formattedDay}
              &nbsp;
              <img
                src="/calendar_blk.png"
                className="mb-[1px] h-[30px] w-[30px]"
              />
            </span>
          </div>
          <div className="flex w-full justify-center">
            <div className="mt-7 mb-10 flex h-[calc(100vh-6rem-140px-68px)] w-full max-w-[1440px]">
              <div className="flex w-1/2 max-w-[720px] pr-[14px] pl-7">
                <StatusTable
                  status={DailyRecordStatus.Good}
                  privateDailyRecord={dailyRecord}
                />
              </div>
              <div className="flex w-1/2 max-w-[720px] pl-[14px] pr-7">
                <StatusTable
                  status={DailyRecordStatus.Bad}
                  privateDailyRecord={dailyRecord}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </SharedLayout>
  );
};

export default CalendarPetDay;
