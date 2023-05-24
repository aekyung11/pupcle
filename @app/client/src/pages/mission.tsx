import { SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { NextPage } from "next";
import * as React from "react";

const Mission: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="mission" query={query}>
      Mission
    </SharedLayout>
  );
};

export default Mission;
