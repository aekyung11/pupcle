import { Link, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Row } from "antd";
import { NextPage } from "next";
import * as React from "react";

const RegisterPetProfile: NextPage = () => {
  const query = useSharedQuery();
  return (
    <SharedLayout title="register-pet-profile" query={query}>
      RegisterPetProfile
    </SharedLayout>
  );
};

export default RegisterPetProfile;
