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
        style={{
          width: "100%",
          boxShadow: "0 4px 4px lightgrey", // TODO: f5f5f5 -> pupcleGray로 지정
          zIndex: 2,
          overflow: "hidden",
          height: "6rem",
          borderRadius: "0 0 50px 50px",
          border: "solid 2px #f5f5f5",
          backgroundColor: "white",
          position: "relative",
          padding: "0 50px",
        }}
      >
        <Row style={{ display: "flex", height: "6rem", alignItems: "center" }}>
          <Col
            span={5}
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <Link href="/">
              <img
                src="/logo.png"
                style={{ height: "min(2.8rem, 4vw)", minHeight: "2rem" }}
              />
            </Link>
          </Col>
          <Col className="homepage-title" span={15}>
            {query.data?.currentUser && (
              <>
                <a
                  href="/home"
                  style={{
                    fontWeight: 400,
                  }}
                >
                  HOME
                </a>
                <a
                  href="/calender"
                  style={{
                    fontWeight: 400,
                  }}
                >
                  CALENDER
                </a>
                <a
                  href="/mission"
                  style={{
                    fontWeight: 400,
                  }}
                >
                  MISSION
                </a>
                <a
                  href="/maps"
                  style={{
                    fontWeight: 600,
                  }}
                >
                  MAPS
                </a>
                <a
                  href="/circle"
                  style={{
                    fontWeight: 400,
                  }}
                >
                  CIRCLE
                </a>
              </>
            )}
          </Col>
          <Col span={4} style={{ display: "flex", justifyContent: "flex-end" }}>
            {query.data && query.data.currentUser ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <Dropdown
                  overlay={
                    <Menu>
                      {query.data.currentUser.organizationMemberships.nodes.map(
                        ({ organization, isOwner }) => (
                          <Menu.Item key={organization?.id}>
                            <Link
                              href={`/o/[slug]`}
                              as={`/o/${organization?.slug}`}
                            >
                              {organization?.name}
                              {isOwner ? (
                                <span>
                                  {" "}
                                  <CrownOutlined />
                                </span>
                              ) : (
                                ""
                              )}
                            </Link>
                          </Menu.Item>
                        )
                      )}
                      <Menu.Item key="_account">
                        <Link href="/account" data-cy="layout-link-account">
                          Account
                        </Link>
                      </Menu.Item>
                      <Menu.Item key="_pup-notes">
                        <Link href="/pup-notes" data-cy="layout-link-pup-notes">
                          My Pup&apos;s Notes
                        </Link>
                      </Menu.Item>
                      <Menu.Item key="_friends">
                        <Link href="/friends" data-cy="layout-link-friends">
                          Friends
                        </Link>
                      </Menu.Item>
                      <Menu.Item key="_settings">
                        <Link href="/settings" data-cy="layout-link-settings">
                          <Warn okay={query.data.currentUser.isVerified}>
                            Settings
                          </Warn>
                        </Link>
                      </Menu.Item>
                      <Menu.Item key="_notification">
                        <Link
                          href="/notification"
                          data-cy="layout-link-notification"
                        >
                          Notification
                        </Link>
                      </Menu.Item>
                      {/* <Menu.Item key="_logout">
                    <a onClick={handleLogout}>Logout</a>
                  </Menu.Item> */}
                    </Menu>
                  }
                >
                  <span
                    data-cy="layout-dropdown-user"
                    style={{
                      whiteSpace: "nowrap",
                      marginRight: "min(24px, calc(8px + 1.5vw))",
                      position: "relative",
                      top: "min(calc(0.1vw + 4px), 18px)",
                    }}
                  >
                    <Warn
                      okay={query.data.currentUser.isVerified}
                      data-cy="header-unverified-warning"
                    >
                      <img
                        src="/hamburger.png"
                        style={{
                          height: "min(2rem, 4vw)",
                          minHeight: "1.5rem",
                        }}
                      />
                    </Warn>
                  </span>
                </Dropdown>
                <Dropdown
                  overlay={
                    <Menu>
                      {/* TODO: show a list of pets, each pet has it's own page */}
                      {query.data.currentUser.pets.nodes.map((pet) => (
                        <Menu.Item key={pet.id}>
                          <a>{pet.name}</a>
                        </Menu.Item>
                      ))}

                      <Menu.Item key="_logout">
                        <a>Logout</a>
                        {/* <a onClick={handleLogout}>Logout</a> */}
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <img
                    src={
                      query.data.currentUser.pets.nodes[0]?.avatarUrl ||
                      query.data.currentUser.avatarUrl ||
                      "/default_avatar.png"
                    }
                    style={{
                      height: "min(38px, 4vw)",
                      width: "min(38px, 4vw)",
                      minHeight: "1.8rem",
                      minWidth: "1.8rem",
                      borderRadius: "min(19px, 2vw)",
                      objectFit: "cover",
                    }}
                  />
                </Dropdown>
              </div>
            ) : null}
          </Col>
        </Row>
      </div>
      <div
        id="map"
        style={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          top: 0,
        }}
      ></div>
    </SharedLayout>
  );
};

export default Maps;
