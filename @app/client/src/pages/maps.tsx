import { DownOutlined } from "@ant-design/icons";
import { MapSheet, SharedLayout } from "@app/components";
import {
  PoiFavorites_PoiFavoriteFragment,
  PoiSummaries_PoiFragment,
  useDeletePoiFavoriteMutation,
  usePoiFavoritesQuery,
  usePoiSummariesQuery,
  useSharedQuery,
  useUpsertPoiFavoriteMutation,
  useUpsertPoiReviewMutation,
} from "@app/graphql";
import * as Tabs from "@radix-ui/react-tabs";
import { Button, Col, Input, Rate, Select, Typography } from "antd";
import { keyBy } from "lodash";
const { Paragraph } = Typography;

import { NextPage } from "next";
import * as React from "react";
import { KeyboardEvent, useCallback, useEffect, useState } from "react";

const handleChange = (value: string) => {
  console.log(`selected ${value}`);
};

enum Tab {
  EXPLORE = "explore",
  FAVORITES = "favorites",
}

type Place = {
  address_name: string;
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  distance: string;
  id: string;
  phone: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
  x: string;
  y: string;
};

type PlaceItemProps = {
  place: Place;
  rating: number | undefined;
  poiFavorite: PoiFavorites_PoiFavoriteFragment | undefined;
  currentUserId: string | undefined;
  onRatingChange: () => Promise<void>;
  onFavoriteChange: () => Promise<void>;
};

const PlaceItem = ({
  place,
  rating,
  currentUserId,
  poiFavorite,
  onRatingChange: handleRatingChange,
  onFavoriteChange: handleFavoriteChange,
}: PlaceItemProps) => {
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  const [upsertPoiReview] = useUpsertPoiReviewMutation();
  const [upsertPoiFavorite] = useUpsertPoiFavoriteMutation();
  const [deletePoiFavorite] = useDeletePoiFavoriteMutation();

  return (
    <div
      key={place.id}
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
        span={18}
        // span={20}
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
          <span className="map-list-title">{place.place_name}</span>
          <span className="map-list-details">
            {place.distance ? `${place.distance}m` : "-"}
          </span>
          <div className="map-rate">
            {/* TODO: disable this and move this to the poi detail */}
            <Rate
              allowHalf
              allowClear
              value={rating != null ? rating / 2 : undefined}
              onChange={async (value) => {
                await upsertPoiReview({
                  variables: {
                    input: {
                      poiReview: {
                        poiId: "00000000-0000-0000-0000-000000000000",
                        kakaoId: place.id,
                        userId: currentUserId,
                        rating: value * 2,
                      },
                    },
                  },
                });
                await handleRatingChange();
              }}
            />
            <span className="map-list-details">
              ({rating != null ? rating / 2 : "N/A"})
            </span>
          </div>
          <div>
            {isAddressExpanded ? (
              <Paragraph
                className="map-list-details"
                key={`id-${place.id}:address:isExpanded-${true}`}
                style={{ marginBottom: 0 }}
              >
                {place.road_address_name}
                {isAddressExpanded && (
                  <DownOutlined onClick={() => setIsAddressExpanded(false)} />
                )}
              </Paragraph>
            ) : (
              <Paragraph
                className="map-list-details"
                key={`id-${place.id}:address:isExpanded-${false}`}
                style={{ marginBottom: 0 }}
                ellipsis={{
                  rows: 1,
                  expandable: true,
                  onExpand: () => setIsAddressExpanded(true),
                  symbol: <DownOutlined />,
                }}
              >
                {place.road_address_name}
              </Paragraph>
            )}
          </div>
          {/* TODO: database */}
          <span className="map-list-details">
            리뷰 {Number(place.id) % 10}개
          </span>
        </div>
      </Col>
      <Col
        span={6}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img className="mr-1 h-fit w-[33px]" src="/pupcle_count.png" />
          <Button
            className="h-7 w-7 rounded-full border-none bg-transparent p-0 !drop-shadow-none"
            onClick={async () => {
              if (poiFavorite) {
                await deletePoiFavorite({
                  variables: {
                    input: {
                      poiId: poiFavorite.poiId,
                      userId: currentUserId,
                    },
                  },
                });
              } else {
                await upsertPoiFavorite({
                  variables: {
                    input: {
                      poiFavorite: {
                        poiId: "00000000-0000-0000-0000-000000000000",
                        kakaoId: place.id,
                        userId: currentUserId,
                      },
                    },
                  },
                });
              }

              await handleFavoriteChange();
            }}
            // style={{
            //   border: "none",
            //   borderRadius: "50%",
            //   padding: 0,
            //   width: "45%",
            // }}
          >
            {poiFavorite ? (
              <img src="/map_minus.png" />
            ) : (
              <img src="/map_plus.png" />
            )}
          </Button>
        </div>

        <div>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "Poppins, sans-serif",
              fontWeight: "bolder",
            }}
          >
            {poiFavorite ? "내 장소 삭제" : "내 장소 추가"}
          </span>
        </div>
      </Col>
    </div>
  );
};

const Maps: NextPage = () => {
  const query = useSharedQuery();
  const currentUserId: string | undefined = query.data?.currentUser?.id;

  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.EXPLORE);
  // is there a better way?
  const [lastClickedTab, setLastClickedTab] = useState<Tab | undefined>();

  const [sheetIsOpen, setSheetIsOpen] = useState<boolean>(false);

  const [placesApi, setPlacesApi] = useState<any>(undefined);

  const [map, setMap] = useState<any>();
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [listResults, setListResults] = useState<Place[]>([]);
  const placeKakaoIds = (listResults ?? []).map((p) => p.id);

  const {
    data: poiSummaries,
    previousData: previousPoiSummaries,
    refetch: poiSummariesRefetch,
  } = usePoiSummariesQuery({
    variables: {
      kakaoIds: placeKakaoIds,
    },
  });
  const handleRatingChange = async () => {
    await poiSummariesRefetch();
  };
  const poiSummariesByKakaoId: Record<string, PoiSummaries_PoiFragment> = keyBy(
    (poiSummaries ?? previousPoiSummaries)?.pois?.nodes,
    "kakaoId"
  );

  const {
    data: poiFavorites,
    previousData: previousPoiFavorites,
    refetch: poiFavoritesRefetch,
  } = usePoiFavoritesQuery({
    variables: {
      kakaoIds: placeKakaoIds,
    },
  });
  const handleFavoriteChange = async () => {
    await poiFavoritesRefetch();
  };
  const poiFavoritesByKakaoId: Record<
    string,
    PoiFavorites_PoiFavoriteFragment
  > = keyBy(
    (poiFavorites ?? previousPoiFavorites)?.currentUser?.poiFavorites.nodes,
    "kakaoId"
  );

  // @ts-ignore
  const kakao = typeof window !== "undefined" && window?.kakao;
  const kakaoMapApi = kakao?.maps;

  useEffect(() => {
    if (!kakaoMapApi) {
      return;
    }
    kakaoMapApi.load(() => {
      const container = document.getElementById("map");
      const options = {
        center: new kakaoMapApi.LatLng(33.450701, 126.570667),
        level: 3, // 지도의 확대 레벨
      };

      const map = new kakaoMapApi.Map(container, options);
      const ps = new kakaoMapApi.services.Places(map);
      setPlacesApi(ps);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const displayLevel = () => {
        const _levelEl = document.getElementById("maplevel");
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const zoomIn = () => {
        // 현재 지도의 레벨을 얻어옵니다
        const level = map.getLevel();

        // 지도를 1레벨 내립니다 (지도가 확대됩니다)
        map.setLevel(level - 1);

        // 지도 레벨을 표시합니다
        displayLevel();
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const zoomOut = () => {
        // 현재 지도의 레벨을 얻어옵니다
        const level = map.getLevel();

        // 지도를 1레벨 올립니다 (지도가 축소됩니다)
        map.setLevel(level + 1);

        // 지도 레벨을 표시합니다
        displayLevel();
      };

      displayLevel();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude; // 현재 위치의 위도
          const lng = position.coords.longitude; // 현재 위치의 경도

          // 현재 위치를 중심으로 하는 지도로 이동합니다.
          map.setCenter(new kakaoMapApi.LatLng(lat, lng));

          const moveLatLon = new kakaoMapApi.LatLng(lat, lng);
          map.panTo(moveLatLon);

          // 현재 위치에 마커를 표시합니다.
          const _markerImage = new kakaoMapApi.MarkerImage(
            "https://map.kakaocdn.net/sh/maps/dhdwk7mst/marker/star.png",
            new kakaoMapApi.Size(24, 35),
            { offset: new kakaoMapApi.Point(12, 35) }
          );

          const _marker = new kakaoMapApi.Marker({
            position: new kakaoMapApi.LatLng(lat, lng),
            map: map,
          });
        });
      }

      setMap(map);
    });
  }, [kakao, kakaoMapApi]);

  const newMarker = useCallback(
    // 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
    (position: any, idx: number) => {
      var imageSrc =
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new kakaoMapApi.Size(36, 37), // 마커 이미지의 크기
        imgOptions = {
          spriteSize: new kakaoMapApi.Size(36, 691), // 스프라이트 이미지의 크기
          spriteOrigin: new kakaoMapApi.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
          offset: new kakaoMapApi.Point(13, 37), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new kakaoMapApi.MarkerImage(
          imageSrc,
          imageSize,
          imgOptions
        ),
        marker = new kakaoMapApi.Marker({
          position: position, // 마커의 위치
          image: markerImage,
        });

      marker.setMap(map); // 지도 위에 마커를 표출합니다
      return marker;
    },
    [kakaoMapApi, map]
  );

  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.replace(/^\s+|\s+$/g, "")) {
        alert("키워드를 입력해주세요!");
        return false;
      }

      const { data, pagination }: { data: Place[]; pagination: unknown } =
        await new Promise((resolve, reject) => {
          placesApi.keywordSearch(
            keyword,
            (data: unknown, status: any, pagination: unknown) => {
              if (status === kakaoMapApi.services.Status.OK) {
                resolve({ data: data as Place[], pagination });
              } else if (status === kakaoMapApi.services.Status.ZERO_RESULT) {
                alert("검색 결과가 존재하지 않습니다.");
                resolve({ data: [], pagination: null });
              } else if (status === kakaoMapApi.services.Status.ERROR) {
                reject("검색 결과 중 오류가 발생했습니다.");
              }
            },
            {
              useMapCenter: true,
              useMapBounds: true,
            }
          );
        });

      console.log({ data, pagination });

      // clear markers
      for (let marker of mapMarkers) {
        marker.setMap(null);
      }

      const bounds = new kakao.maps.LatLngBounds();

      // set new markers
      const newMarkers = data.map((place, i) => {
        // 마커를 생성하고 지도에 표시합니다
        const placePosition = new kakao.maps.LatLng(place.y, place.x),
          placeMarker = newMarker(placePosition, i);

        bounds.extend(placePosition);

        return placeMarker;
      });
      map.setBounds(bounds);

      setMapMarkers(newMarkers);
      setListResults(data);
    },
    [placesApi, newMarker, mapMarkers, map]
  );

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
                    onPressEnter={(e: KeyboardEvent<HTMLInputElement>) =>
                      handleSearch(e.currentTarget.value)
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
                onOpenAutoFocus={(event) => {
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
                  <Tabs.Content
                    key={Tab.EXPLORE}
                    value={Tab.EXPLORE}
                    style={{
                      height: "100%",
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                    }}
                  >
                    {listResults?.map((place) => (
                      <PlaceItem
                        key={place.id}
                        place={place}
                        rating={poiSummariesByKakaoId[place.id]?.rating}
                        poiFavorite={poiFavoritesByKakaoId[place.id]}
                        onRatingChange={handleRatingChange}
                        onFavoriteChange={handleFavoriteChange}
                        currentUserId={currentUserId}
                      />
                    ))}
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
