import { AuthRestrict, Redirect, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { NextPage } from "next";
import * as React from "react";

const Circle: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout
      title="circle"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_IN}
    >
      Circle
      <Redirect href={`${process.env.DISCOURSE_URL}`} />
    </SharedLayout>
  );
};

export default Circle;
