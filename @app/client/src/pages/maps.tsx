import { Link, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Row } from "antd";
import { NextPage } from "next";
import * as React from "react";
import { useEffect } from "react";

const Maps: NextPage = () => {
  const query = useSharedQuery();

  useEffect(() => {
    var container = document.getElementById("map");
    if (typeof window !== "undefined") {
      var options = {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
      };

      var map = new window.kakao.maps.Map(container, options);
    }
  }, []);

  return (
    <SharedLayout title="maps" query={query}>
      <div id="map" style={{ width: "500px", height: "400px" }}></div>
    </SharedLayout>
  );
};

export default Maps;
