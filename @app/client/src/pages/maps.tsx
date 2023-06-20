import { DownOutlined } from "@ant-design/icons";
import { MapSheet, SharedLayout } from "@app/components";
import { useSharedQuery } from "@app/graphql";
import * as Tabs from "@radix-ui/react-tabs";
import { Button, Col, Input, Select } from "antd";
import { NextPage } from "next";
import * as React from "react";
import { useEffect, useState } from "react";

const handleChange = (value: string) => {
  console.log(`selected ${value}`);
};

enum Tab {
  EXPLORE = "explore",
  FAVORITES = "favorites",
}

const Maps: NextPage = () => {
  const query = useSharedQuery();

  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.EXPLORE);
  // is there a better way?
  const [lastClickedTab, setLastClickedTab] = useState<Tab | undefined>();

  const [sheetIsOpen, setSheetIsOpen] = useState<boolean>(false);

  // @ts-ignore
  const kakao = typeof window !== "undefined" && window?.kakao;
  const kakaoMaps = kakao?.maps;

  useEffect(() => {
    if (!kakaoMaps) {
      return;
    }
    kakao.maps.load(() => {
      var container = document.getElementById("map");
      var options = {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 2,
      };

      var map = new kakao.maps.Map(container, options);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const displayLevel = () => {
        var _levelEl = document.getElementById("maplevel");
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const zoomIn = () => {
        // 현재 지도의 레벨을 얻어옵니다
        var level = map.getLevel();

        // 지도를 1레벨 내립니다 (지도가 확대됩니다)
        map.setLevel(level - 1);

        // 지도 레벨을 표시합니다
        displayLevel();
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const zoomOut = () => {
        // 현재 지도의 레벨을 얻어옵니다
        var level = map.getLevel();

        // 지도를 1레벨 올립니다 (지도가 축소됩니다)
        map.setLevel(level + 1);

        // 지도 레벨을 표시합니다
        displayLevel();
      };

      displayLevel();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          var lat = position.coords.latitude; // 현재 위치의 위도
          var lng = position.coords.longitude; // 현재 위치의 경도

          // 현재 위치를 중심으로 하는 지도로 이동합니다.
          map.setCenter(new kakao.maps.LatLng(lat, lng));

          var moveLatLon = new kakao.maps.LatLng(lat, lng);
          map.panTo(moveLatLon);

          // 현재 위치에 마커를 표시합니다.
          var _markerImage = new kakao.maps.MarkerImage(
            "https://map.kakaocdn.net/sh/maps/dhdwk7mst/marker/star.png",
            new kakao.maps.Size(24, 35),
            { offset: new kakao.maps.Point(12, 35) }
          );

          var _marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(lat, lng),
            map: map,
          });
        });
      }
    });
  }, [kakao, kakaoMaps]);

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
            zIndex: 2,
          }}
        >
          <MapSheet.Sheet modal={false} open={sheetIsOpen}>
            <Tabs.Root
              value={selectedTab}
              onValueChange={(newValue) => {
                setSelectedTab(newValue as Tab);
              }}
            >
              <Tabs.List style={{ display: "flex" }}>
                <Tabs.Trigger
                  key={Tab.EXPLORE}
                  value={Tab.EXPLORE}
                  style={{
                    width: "min(53px, 2rem + 1vw)",
                    height: "min(53px, 2rem + 1vw)",
                    borderRadius: "50%",
                    boxShadow: "0px 4px 4px rgb(0 0 0 / 0.25)",
                    padding: 0,
                  }}
                  onClick={() => {
                    setSheetIsOpen(
                      !(lastClickedTab === Tab.EXPLORE && sheetIsOpen)
                    );
                    setLastClickedTab(Tab.EXPLORE);
                  }}
                >
                  <img src="/map_list.png" alt="map list" />
                </Tabs.Trigger>
                <div
                  style={{
                    marginLeft: "3rem",
                    width: "23vw",
                    minWidth: "200px",
                    height: "min(72px, 2rem + 1.5vw)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => {
                    if (!sheetIsOpen) {
                      setSheetIsOpen(true);
                    }
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
                          width: "min(25px, 14px + 0.5vw)",
                          marginRight: "8px",
                        }}
                        alt="search icon"
                      />
                    }
                  />
                </div>
                <Tabs.Trigger
                  key={Tab.FAVORITES}
                  value={Tab.FAVORITES}
                  style={{
                    display: "flex",
                    position: "fixed",
                    top: "calc(6rem + 45px + min(53px, 2rem + 1vw))",
                    left: "18px",
                    zIndex: 2,
                  }}
                  onClick={() => {
                    setSheetIsOpen(
                      !(lastClickedTab === Tab.FAVORITES && sheetIsOpen)
                    );
                    setLastClickedTab(Tab.FAVORITES);
                  }}
                >
                  <div
                    style={{
                      width: "min(53px, 2rem + 1vw)",
                      height: "min(53px, 2rem + 1vw)",
                      borderRadius: "50%",
                      boxShadow: "0px 4px 4px rgb(0 0 0 / 0.25)",
                      padding: 0,
                    }}
                  >
                    <img src="/map_c.png" alt="my list" />
                  </div>
                </Tabs.Trigger>
              </Tabs.List>
              <MapSheet.SheetContent
                position="left"
                onPointerDownOutside={(event) => {
                  event.preventDefault();
                }}
                onInteractOutside={(event) => {
                  event.preventDefault();
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    width: "min(53px + 36px, 2rem + 1vw + 36px)",
                    height: "100vh",
                    position: "fixed",
                    top: 0,
                    boxShadow: "4px 0px 4px rgb(0 0 0 / 0.10)",
                    zIndex: 1,
                  }}
                ></div>
                <div
                  style={{
                    backgroundColor: "white",
                    left: "min(53px + 36px, 2rem + 1vw + 36px)",
                    width: "calc(6rem - 36px + max(200px, 23vw))",
                    height: "100vh",
                    position: "fixed",
                    top: 0,
                    boxShadow: "4px 0px 4px rgb(0 0 0 / 0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      width: "100%",
                      padding:
                        "calc(7rem + 25px + min(72px, 2rem + 1.5vw)) calc(3rem - 18px) 1rem",
                    }}
                  >
                    <Select
                      className="maps"
                      onChange={handleChange}
                      defaultValue="distance"
                      suffixIcon={
                        <img src="/maps-selector.png" width="12px" alt="" />
                      }
                      options={[
                        { value: "distance", label: "거리 순" },
                        { value: "reviews", label: "리뷰 순" },
                        { value: "highRatings", label: "별점 높은 순" },
                        { value: "lowRatings", label: "별점 낮은 순" },
                      ]}
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    />
                  </div>
                  <Tabs.Content key={Tab.EXPLORE} value={Tab.EXPLORE}>
                    <div
                      style={{
                        width: "100%",
                        borderWidth: "1px 0px",
                        borderColor: "#D9D9D9",
                        padding: "min(1.8rem, 2vw) min(1rem, 1.2vw)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Col
                        span={7}
                        style={{
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          padding: "8px 0px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "lightgrey",
                            width: "min(106px, 7.5vw)",
                            minWidth: "60px",
                            height: "min(106px, 7.5vw)",
                            minHeight: "60px",
                            borderRadius: "20%",
                          }}
                        ></div>
                      </Col>
                      <Col
                        span={13}
                        style={{
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "80%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span>논현동물병원</span>
                          <span>26m</span>
                          <div>ratings</div>
                          <div>
                            <span>서울 강남구 논현동</span>
                            <DownOutlined />
                          </div>
                          <span>리뷰 000개</span>
                        </div>
                      </Col>
                      <Col span={4} style={{ height: "100%" }}></Col>
                    </div>
                  </Tabs.Content>
                  <Tabs.Content key={Tab.FAVORITES} value={Tab.FAVORITES}>
                    Favorites
                  </Tabs.Content>
                </div>
                {/* <MapSheet.SheetHeader>
                <MapSheet.SheetTitle>
                  Are you sure absolutely sure?
                </MapSheet.SheetTitle>
                <MapSheet.SheetDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </MapSheet.SheetDescription>
              </MapSheet.SheetHeader> */}
              </MapSheet.SheetContent>
            </Tabs.Root>
          </MapSheet.Sheet>

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
                alt="vet icon"
              />
              <span className="maps-category-span group-hover:text-white">
                동물병원
              </span>
            </Button>
            <Button className="maps-category group">
              <img
                src="/cafe_icon.png"
                id="cafe"
                style={{ width: "min(28px, 20px + 0.1vw)" }}
                alt="cafe icon"
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
                alt="restaurant icon"
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
                alt="park icon"
              />
              <span className="maps-category-span group-hover:text-white">
                공원
              </span>
            </Button>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Maps;
