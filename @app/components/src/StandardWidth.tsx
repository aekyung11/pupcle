import { Col, Row } from "antd";
import React, { FC } from "react";

export interface StandardWidthProps {
  children: React.ReactNode;
}

export const StandardWidth: FC<
  StandardWidthProps & React.HTMLAttributes<HTMLDivElement>
> = ({ children, className }) => (
  <Row className={className}>
    <Col flex={1}>{children}</Col>
  </Row>
);
