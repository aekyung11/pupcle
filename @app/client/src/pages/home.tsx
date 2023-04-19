import { Link, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Row } from "antd";
import { NextPage } from "next";
import * as React from "react";

const Home: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="home" query={query}>
      home
    </SharedLayout>
  );
};

export default Home;
