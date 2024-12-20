import { SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { NextPage } from "next";
import * as React from "react";

const Circle: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="circle" query={query}>
      Circle
    </SharedLayout>
  );
};

export default Circle;
