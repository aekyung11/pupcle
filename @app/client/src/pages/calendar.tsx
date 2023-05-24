import { SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { NextPage } from "next";
import * as React from "react";

const Calendar: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="calendar" query={query}>
      Calendar
    </SharedLayout>
  );
};

export default Calendar;
