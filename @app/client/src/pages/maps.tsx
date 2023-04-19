import { Link, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Row } from "antd";
import { NextPage } from "next";
import * as React from "react";

const Maps: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="maps" query={query}>
      Maps
    </SharedLayout>
  );
};

export default Maps;
