import { Link, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Row } from "antd";
import { NextPage } from "next";
import * as React from "react";

const Calender: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="calender" query={query}>
      Calender
    </SharedLayout>
  );
};

export default Calender;
