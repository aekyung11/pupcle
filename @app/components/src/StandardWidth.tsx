import { Col, Row } from "antd";
import React, { FC } from "react";

export interface StandardWidthProps {
  children: React.ReactNode;
}

export const StandardWidth: FC<StandardWidthProps> = ({ children }) => (
  <Row>
    <Col flex={1}>{children}</Col>
  </Row>
);
