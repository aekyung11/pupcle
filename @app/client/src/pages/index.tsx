import { Button, Col, Divider, Row, Typography } from "antd";
import * as React from "react";
const { Text, Title, Paragraph } = Typography;
import { SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { NextPage } from "next";

// Convenience helper
const Li = ({ children, ...props }: any) => (
  <li {...props}>
    <Typography>{children}</Typography>
  </li>
);

const Home: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="" query={query}>
      <Row>
        <Col></Col>
      </Row>
    </SharedLayout>
  );
};

export default Home;
