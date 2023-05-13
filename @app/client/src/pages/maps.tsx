import { CrownOutlined } from "@ant-design/icons";
import { Link, SharedLayout, Warn } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import { Button, Col, Dropdown, Input, Menu, Row } from "antd";
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
      <div style={{ minWidth: "768px" }}>
        <div
          id="map"
          style={{
            width: "100vw",
            height: "100vh",
            position: "fixed",
            top: 0,
          }}
        ></div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "fixed",
            top: "calc(6rem + 25px)",
            left: "18px",
          }}
        >
          <Button
            style={{
              width: "min(53px, 2rem + 1vw)",
              height: "min(53px, 2rem + 1vw)",
              borderRadius: "50%",
              boxShadow: "0px 4px 4px rgb(0 0 0 / 0.25)",
              padding: 0,
            }}
          >
            <img src="/map_list.png" />
          </Button>
          <div
            style={{
              marginLeft: "3rem",
              width: "23vw",
              minWidth: "200px",
              height: "min(72px, 2rem + 1.5vw)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Input
              className="map-search"
              style={{
                width: "100%",
                height: "100%",
                borderStyle: "none",
                borderRadius: "min(10px, 0.6vw)",
                boxShadow: "0px 4px 4px rgb(0 0 0 / 0.15)",
              }}
              placeholder="어디로 가고 싶으세요?"
              prefix={
                <img
                  src="/search_icon.png"
                  style={{
                    width: "min(25px, 1rem + 0.5vw)",
                    marginRight: "8px",
                  }}
                />
              }
            />
          </div>
          <div
            style={{
              marginLeft: "3rem",
              // width: "35vw",
              // minWidth: "280px",
              height: "min(72px, 2rem + 1.5vw)",
              display: "flex",
              alignItems: "center",
              // justifyContent: "space-between",
              overscrollBehavior: "contain",
              overflow: "scroll",
              maxWidth: "calc(100vw - (18px + 53px + 6rem + 200px))",
            }}
          >
            <Button className="maps-category group">
              <img
                src="/vet_icon.png"
                id="vet"
                style={{ width: "min(17px, 12px + 0.1vw)" }}
              />
              <span className="maps-category-span group-hover:text-white">
                동물병원
              </span>
            </Button>
            <Button className="maps-category group">
              <img
                src="/cafe_icon.png"
                id="cafe"
                style={{ width: "min(29px, 20px + 1vw)" }}
              />
              <span className="maps-category-span group-hover:text-white">
                카페
              </span>
            </Button>
            <Button className="maps-category group">
              <img
                src="/restaurant_icon.png"
                id="restaurant"
                style={{ width: "min(19px, 13px + 0.1vw)" }}
              />
              <span className="maps-category-span group-hover:text-white">
                식당
              </span>
            </Button>
            <Button className="maps-category group">
              <img
                src="/park_icon.png"
                id="park"
                style={{ width: "min(23.5px, 16px + 0.1vw)" }}
              />
              <span className="maps-category-span group-hover:text-white">
                공원
              </span>
            </Button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "fixed",
            top: "calc(6rem + 45px + min(53px, 2rem + 1vw))",
            left: "18px",
          }}
        >
          <Button
            style={{
              width: "min(53px, 2rem + 1vw)",
              height: "min(53px, 2rem + 1vw)",
              borderRadius: "50%",
              boxShadow: "0px 4px 4px rgb(0 0 0 / 0.25)",
              padding: 0,
            }}
          >
            <img src="/map_c.png" />
          </Button>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Maps;
