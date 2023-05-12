import { CrownOutlined } from "@ant-design/icons";
import { Link, SharedLayout, Warn } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Dropdown, Menu, Row } from "antd";
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
        level: 2,
      };

      var map = new window.kakao.maps.Map(container, options);

      displayLevel();

      function zoomIn() {
        // 현재 지도의 레벨을 얻어옵니다
        var level = map.getLevel();

        // 지도를 1레벨 내립니다 (지도가 확대됩니다)
        map.setLevel(level - 1);

        // 지도 레벨을 표시합니다
        displayLevel();
      }

      function zoomOut() {
        // 현재 지도의 레벨을 얻어옵니다
        var level = map.getLevel();

        // 지도를 1레벨 올립니다 (지도가 축소됩니다)
        map.setLevel(level + 1);

        // 지도 레벨을 표시합니다
        displayLevel();
      }

      function displayLevel() {
        var levelEl = document.getElementById("maplevel");
        levelEl;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          var lat = position.coords.latitude; // 현재 위치의 위도
          var lng = position.coords.longitude; // 현재 위치의 경도

          // 현재 위치를 중심으로 하는 지도로 이동합니다.
          map.setCenter(new kakao.maps.LatLng(lat, lng));

          var moveLatLon = new kakao.maps.LatLng(lat, lng);
          map.panTo(moveLatLon);

          // 현재 위치에 마커를 표시합니다.
          var markerImage = new kakao.maps.MarkerImage(
            "https://map.kakaocdn.net/sh/maps/dhdwk7mst/marker/star.png",
            new kakao.maps.Size(24, 35),
            { offset: new kakao.maps.Point(12, 35) }
          );

          var marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(lat, lng),
            map: map,
          });
        });
      }
    }
  }, []);

  return (
    <SharedLayout title="maps" query={query}>
      <div
        id="map"
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
        }}
      ></div>
    </SharedLayout>
  );
};

export default Maps;
