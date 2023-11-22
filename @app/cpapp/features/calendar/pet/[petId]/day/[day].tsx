import CustomInput from "@app/cpapp/components/CustomInput";
import { FourOhFour } from "@app/cpapp/components/FourOhFour";
import { P, Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { AuthRestrict, SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { isSafe } from "@app/cpapp/utils/utils";
import {
  CalendarRecords_PrivateDailyRecordFragment,
  DailyRecordStatus,
  HomePage_PetFragment,
  HomePage_PrivateDailyRecordFragment,
  HomePage_SharedDailyRecordFragment,
  SharedLayout_UserFragment,
  useCalendarPageQuery,
  useCalendarRecordsQuery,
  useHomePageQuery,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import fourOhFour from "@app/server/public/404_page.png";
import bathroomStatusGray from "@app/server/public/bathroom_status_grey.png";
import blueCaret from "@app/server/public/blue_caret.png";
import calendar from "@app/server/public/calendar_blk.png";
import dietStatusGray from "@app/server/public/diet_status_grey.png";
import healthStatusGray from "@app/server/public/health_status_grey.png";
import playStatusGray from "@app/server/public/play_status_grey.png";
import sleepStatusGray from "@app/server/public/sleep_status_grey.png";
import walkingStatusGray from "@app/server/public/walking_status_grey.png";
import { format, parseISO } from "date-fns";
import { ScrollView } from "moti";
import { StyledComponent } from "nativewind";
import React, { FC, useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { createParam } from "solito";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { useRouter } from "solito/navigation";
import { Button, Circle, Tooltip, useTheme } from "tamagui";

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
  statusImage: any;
  statusComment: string | null;
};

const CommentRow: FC<CommentRowProps> = ({
  statusImage,
  statusComment,
}: CommentRowProps) => {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);

  return (
    <View className="mt-5 flex w-full flex-row items-start justify-between">
      <View className="mr-[10px] flex w-[19.09px] flex-row items-center">
        <StyledComponent
          component={SolitoImage}
          className="h-[20px] w-[19.09px]"
          src={statusImage}
          alt=""
          // fill
        />
      </View>

      <Text className="font-poppins mb-0 mt-[2px] w-full pr-[29.09px] text-start text-[12px] text-[#8F9092]">
        {statusComment}
      </Text>

      {/* {isCommentExpanded ? (
          <P
            className="calendar-comment font-poppins text-pupcleGray mb-0 text-[16px] font-semibold"
            key={`isExpanded-${true}`}
          >
            {statusComment} &nbsp;&nbsp;
            {isCommentExpanded && (
              <Button
                className="border-pupcleBlue inline-block h-[20px] w-[35px] rounded-full border-[1px] p-0"
                onClick={() => setIsCommentExpanded(false)}
              >
                <Text className="font-poppins text-pupcleBlue text-[10px] font-bold">
                  접기
                </Text>
              </Button>
            )}
          </P>
        ) : (
          <P
            key={`isExpanded-${false}`}
            className="calendar-comment font-poppins mb-0 text-[12px] text-[#8F9092]"
            // ellipsis={{
            //   rows: 1,
            //   expandable: true,
            //   onExpand: () => setIsCommentExpanded(true),
            //   symbol: <TestExpandable setIsExpandable={setIsExpandable} />,
            // }}
          >
            {statusComment}
          </P>
        )} */}
      <View>
        {/* {!isExpandable || !statusComment?.length ? (
          <View className="w-[44px]"></View>
        ) : (
          <Button
            onClick={() => setIsCommentExpanded(true)}
            className="bg-pupcleBlue flex h-[20px] w-[44px] items-center rounded-full border-none"
          >
            <Text className="font-poppins text-[10px] font-bold text-white">
              펼치기
            </Text>
          </Button>
        )} */}
      </View>
    </View>
  );
};
interface CalendarPetDayScreenInnerProps {
  privateDailyRecord: CalendarRecords_PrivateDailyRecordFragment;
  status: DailyRecordStatus;
}

const CalendarPetDayScreenInner: FC<CalendarPetDayScreenInnerProps> = ({
  privateDailyRecord,
  status,
}: CalendarPetDayScreenInnerProps) => {
  return (
    <>
      {status === privateDailyRecord.sleepStatus && (
        <CommentRow
          statusImage={sleepStatusGray}
          statusComment={privateDailyRecord.sleepComment}
        />
      )}
      {status === privateDailyRecord.dietStatus && (
        <CommentRow
          statusImage={dietStatusGray}
          statusComment={privateDailyRecord.dietComment}
        />
      )}
      {status === privateDailyRecord.walkingStatus && (
        <CommentRow
          statusImage={walkingStatusGray}
          statusComment={privateDailyRecord.walkingComment}
        />
      )}
      {status === privateDailyRecord.playStatus && (
        <CommentRow
          statusImage={playStatusGray}
          statusComment={privateDailyRecord.playComment}
        />
      )}
      {status === privateDailyRecord.bathroomStatus && (
        <CommentRow
          statusImage={bathroomStatusGray}
          statusComment={privateDailyRecord.bathroomComment}
        />
      )}
      {status === privateDailyRecord.healthStatus && (
        <CommentRow
          statusImage={healthStatusGray}
          statusComment={privateDailyRecord.healthComment}
        />
      )}
    </>
  );
};

type CalendarPetDayScreenParams = {
  petId?: string;
  day?: string;
};

export function CalendarPetDayScreen() {
  const query = useCalendarPageQuery();
  const { useParam } = createParam<CalendarPetDayScreenParams>();
  const [petId] = useParam("petId");
  const [day] = useParam("day");
  const formattedDay = format(parseISO(day ?? "2023-01-01"), "yyyy.MM.dd");

  const { data: calendarRecordsData, loading: calendarRecordsDataLoading } =
    useCalendarRecordsQuery({
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
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      {query.loading || calendarRecordsDataLoading ? (
        <Text>loading...</Text>
      ) : !dailyRecord ? (
        <FourOhFour />
      ) : (
        <View className="flex h-full w-full flex-col bg-[#F2F7FD] px-5">
          <View className="flex h-[14%] w-full flex-row items-end justify-start">
            <View className="flex h-[45px] flex-row items-center">
              <Link href="/calendar">
                <StyledComponent
                  component={SolitoImage}
                  className="mr-10 h-[13px] w-[9px]"
                  src={blueCaret}
                  alt=""
                  // fill
                />
              </Link>

              <Text className="font-poppins text-[24px] font-semibold text-black">
                {pet.name}
              </Text>
              <View className="ml-2 mt-1 flex flex-row">
                <Text className="font-poppins text-[16px] font-semibold text-black">
                  {formattedDay}
                </Text>
                <StyledComponent
                  component={SolitoImage}
                  className="mt-[1px] ml-[2px] h-4 w-4"
                  src={calendar}
                  alt=""
                  // fill
                />
              </View>
            </View>
          </View>
          <View className="flex h-[86%] w-full flex-col justify-start pb-[140px] pt-5">
            <ScrollView>
              <View className="h-fit w-full rounded-[30px] bg-white p-5">
                <Text className="font-poppins text-[24px] font-semibold uppercase text-[#FF9C06]">
                  good
                </Text>
                <CalendarPetDayScreenInner
                  status={DailyRecordStatus.Good}
                  privateDailyRecord={dailyRecord}
                />
              </View>
              <View className="mt-5 h-fit w-full rounded-[30px] bg-white p-5">
                <Text className="font-poppins text-pupcleBlue text-[24px] font-semibold uppercase">
                  bad
                </Text>
                <CalendarPetDayScreenInner
                  status={DailyRecordStatus.Bad}
                  privateDailyRecord={dailyRecord}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SharedLayout>
  );
}
