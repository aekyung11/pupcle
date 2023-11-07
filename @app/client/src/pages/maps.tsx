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
import clsx from "clsx";
import { keyBy } from "lodash";
const { Paragraph } = Typography;
import * as Dialog from "@radix-ui/react-dialog";
import { NextPage } from "next";
import * as React from "react";
import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { Form } from "formik-antd";

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
            alignItems: "start",
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

type PlacePanelProps = {
  place: Place;
  rating: number | undefined;
  poiFavorite: PoiFavorites_PoiFavoriteFragment | undefined;
  currentUserId: string | undefined;
  onRatingChange: () => Promise<void>;
  onFavoriteChange: () => Promise<void>;
};

const PlacePanel = ({
  place,
  rating,
  currentUserId,
  poiFavorite,
  onRatingChange: handleRatingChange,
  onFavoriteChange: handleFavoriteChange,
}: PlacePanelProps) => {
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  const [upsertPoiReview] = useUpsertPoiReviewMutation();
  const [upsertPoiFavorite] = useUpsertPoiFavoriteMutation();
  const [deletePoiFavorite] = useDeletePoiFavoriteMutation();

  const [panelIsOpen, setPanelIsOpen] = useState<boolean>(true);

  return (
    <div
      key={`${place.id}:panel`}
      className={clsx(
        "shadow-mapInsetBoxShadow drop-shadow-mapsDropShadow fixed top-[96px] left-[calc(min(89px,2rem+1vw+36px)+calc(6rem-36px+max(200px,23vw)))] z-[1] h-[calc(100vh-6rem)] w-[calc(6rem-36px+max(200px,23vw))] rounded-r-[50px] bg-white",
        { hidden: !panelIsOpen }
      )}
    >
      <div className="shadow-mapInsetBoxShadow drop-shadow-mapsDropShadowLighter relative flex h-full w-full flex-col rounded-tr-[50px] border-none bg-white">
        <div className="shadow-mapInsetBoxShadow drop-shadow-mapsDropShadow flex h-[calc(min(72px,2rem+1.5vw)+50px)] w-full flex-row items-center justify-center rounded-tr-[50px] bg-white px-8">
          <span className="font-poppins w-[80%] truncate text-center text-[25px] font-bold text-black">
            {place.place_name}
          </span>
          <Button
            onClick={() => setPanelIsOpen(false)}
            className="absolute right-[32px] h-[21px] w-[21px] border-none p-0"
          >
            <img src="close_button_blue.png" className="h-[21px] w-[21px]" />
          </Button>
        </div>
        <div className="h-[calc(100%-calc(min(72px,2rem+1.5vw)+50px))] w-full overflow-scroll">
          <div className="map-rate mt-10 justify-center">
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
              ({rating != null ? rating / 2 : "N/A"})&nbsp;&nbsp;·&nbsp;&nbsp;
            </span>
            <span className="font-poppins text-pupcleBlue text-[15px] font-medium">
              리뷰 28개
            </span>
          </div>
          <div className="flex w-full flex-col px-8 py-10">
            <div className="mb-5 flex flex-row">
              <div className="flex h-6 w-6 flex-row justify-center">
                <img className="h-6" src="map_pin.png" />
              </div>
              <span className="font-poppins ml-6 text-[15px] font-medium text-black">
                {place.road_address_name}
              </span>
            </div>
            <div className="mb-5 flex flex-row">
              <img className="h-6" src="call_icon.png" />
              <span className="font-poppins ml-6 text-[15px] font-medium text-black">
                {place.phone}
              </span>
            </div>
            <div className="flex flex-row">
              <img className="h-6" src="clock_icon.png" />
              <span className="font-poppins ml-6 text-[15px] font-medium text-black">
                {/* {place.}
              TODO: 영업시간 */}
              </span>
            </div>
          </div>
          <div className="bg-pupcleLightLightGray shadow-mapInsetBoxShadow h-2 w-full border-none"></div>
          <div className="flex w-full flex-row justify-center py-10">
            <div className="relative h-[88.1px] w-[335px]">
              <img src="/maps_review_rating_dog.png" />
              <div className="absolute bottom-0 right-0">
                <div className="flex h-[85px] w-[218px] flex-col items-center justify-center">
                  <div className="flex items-center justify-center">
                    <span className="font-poppins text-[15px] font-medium text-black">
                      별점을 남겨주라멍
                    </span>
                    {/* TODO: if rating is there, 리뷰를 남겨주라멍, and if review is there, 소중한 리뷰 고맙다멍 */}
                    <img src="/paw.png" className="ml-[2px] h-[13px] w-5" />
                  </div>
                  <div className="map-rate justify-center">
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
                      {rating != null ? rating / 2 : "(N/A)"}/5.0
                    </span>
                  </div>
                  {/* TODO: hange the html when 리뷰를 남겨주라멍: */}
                  {/* <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <Button className="h-5 border-none bg-transparent p-0">
                        <div className="flex flex-row">
                          <img className="h-5 w-5" src="/write_blue.png" />
                          <span className="font-poppins text-pupcleBlue ml-1 text-[15px] font-bold">
                            리뷰 쓰기
                          </span>
                        </div>
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                      <Dialog.Content
                        className={clsx(
                          "fixed z-20",
                          "w-[90vw] rounded-[50px] bg-white lg:w-[45%]",
                          "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 "
                        )}
                      >
                        <Dialog.Title className="border-pupcleLightGray flex h-[90px] w-full flex-row items-center border-b-[1px] px-[44px]">
                          <img
                            src="/write_blue.png"
                            className="h-[37px] w-[37px]"
                            alt=""
                          />
                          <span className="font-poppins text-pupcleBlue ml-1 text-[20px] font-semibold">
                            리뷰 쓰기
                          </span>
                        </Dialog.Title>
                        <div className="pl-[40px] pb-[30px] pt-[40px]">
                          <div className="mb-10 flex w-full flex-row justify-center pr-10">
                            <span className="font-poppins text-[25px] font-bold text-black">
                              {place.place_name}
                            </span>
                          </div>
                          <div className="mb-[67px] flex h-[60px] w-full flex-row items-center">
                            <div className="w-[40px]">
                              <span className="font-poppins text-pupcleGray text-[20px] font-bold">
                                별점
                              </span>
                            </div>
                            <div className="map-dialog-rate relative w-[calc(100%-40px)] px-[66px] pb-[10px]">
                              <Rate
                                allowHalf
                                allowClear
                                value={rating != null ? rating / 2 : undefined}
                                onChange={async (value) => {
                                  await upsertPoiReview({
                                    variables: {
                                      input: {
                                        poiReview: {
                                          poiId:
                                            "00000000-0000-0000-0000-000000000000",
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
                            </div>
                          </div>
                          <div className="mb-9 flex w-full flex-row">
                            <div className="w-[40px]">
                              <span className="font-poppins text-pupcleGray text-[20px] font-bold">
                                리뷰
                              </span>
                            </div>
                            <div className="w-[calc(100%-40px)] px-[66px]">
                              <textarea
                                name="review"
                                className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-[226px] w-full rounded-[20px] border-none p-6 text-[15px] font-medium focus:outline-0 focus:ring-0"
                                // size="large"
                                autoComplete="review"
                                data-cy="maps-review"
                                placeholder="이 장소에 대한 경험을 공유해주세요."
                              />
                            </div>
                          </div>
                          <div className="flex w-full justify-end pr-[66px]">
                            <Dialog.Close asChild>
                              <Button className="border-pupcleGray mr-[15px] h-[46px] w-[134px] rounded-full border-[1px] bg-transparent">
                                <span className="font-poppins text-pupcleGray text-[20px] font-bold">
                                  취소
                                </span>
                              </Button>
                            </Dialog.Close>

                            <Button className="border-pupcleBlue h-[46px] w-[134px] rounded-full border-[1px] bg-transparent">
                              <span className="font-poppins text-pupcleBlue text-[20px] font-bold">
                                게시
                              </span>
                            </Button>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root> */}
                </div>
              </div>
            </div>
          </div>
          <div className="border-pupcleLightGray flex h-[55px] w-full items-center justify-between border-y-[1px] px-8">
            <div className="flex flex-row">
              <span className="font-poppins text-[18px] font-semibold text-black">
                리뷰&nbsp;
              </span>
              <span className="font-poppins text-pupcleBlue text-[18px] font-semibold">
                18개
              </span>
            </div>
            <div>
              <Select
                className="maps-detail-selector flex items-center border-none"
                onChange={handleChange}
                defaultValue="latest"
                suffixIcon={
                  <img src="/maps_selector_caret.png" className="h-1 w-2" />
                }
                options={[
                  { value: "latest", label: "최신 순" },
                  { value: "highRatings", label: "별점 높은 순" },
                  { value: "lowRatings", label: "별점 낮은 순" },
                ]}
              />
            </div>
          </div>
          {/* TODO: map */}
          <div className="border-pupcleLightGray flex w-full flex-col border-b-[1px] px-8 py-6">
            <div className="flex flex-row items-center">
              <img
                className="h-[38px] w-[38px]"
                src="/avatar_white_border.png"
              />
              <span className="font-poppins text-pupcleGray ml-4 text-[15px] font-semibold">
                퐁당이 누나
              </span>
              <div className="map-rate ml-3 justify-center">
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
              </div>
            </div>
            <div className="w-full pl-[50px]">
              <span className="font-poppins text-[15px] font-medium text-black">
                친절하시고 너무 좋아요~
              </span>
            </div>
            <div className="flex w-full flex-row justify-end">
              <span className="font-poppins text-pupcleGray text-[13px] font-medium">
                2023.11.06
              </span>
            </div>
          </div>
        </div>
      </div>
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

  const [selectedKakaoId, setSelectedKakaoId] = useState<string | undefined>();

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
                    zIndex: 3,
                  }}
                ></div>
                <div
                  style={{
                    backgroundColor: "white",
                    left: "min(53px + 36px, 2rem + 1vw + 36px)",
                    width: "calc(6rem - 36px + max(200px, 23vw))",
                    height: "100vh",
                    position: "fixed",
                    zIndex: 2,
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
                      <>
                        <Button
                          onClick={() => {
                            if (selectedKakaoId === place.id) {
                              setSelectedKakaoId(undefined);
                            } else {
                              setSelectedKakaoId(place.id);
                            }
                          }}
                          className="h-fit w-full border-none bg-transparent p-0 !shadow-none"
                        >
                          <PlaceItem
                            key={place.id}
                            place={place}
                            rating={poiSummariesByKakaoId[place.id]?.rating}
                            poiFavorite={poiFavoritesByKakaoId[place.id]}
                            onRatingChange={handleRatingChange}
                            onFavoriteChange={handleFavoriteChange}
                            currentUserId={currentUserId}
                          />
                        </Button>
                        {selectedKakaoId === place.id && (
                          <PlacePanel
                            place={place}
                            rating={poiSummariesByKakaoId[place.id]?.rating}
                            poiFavorite={poiFavoritesByKakaoId[place.id]}
                            onRatingChange={handleRatingChange}
                            onFavoriteChange={handleFavoriteChange}
                            currentUserId={currentUserId}
                          />
                        )}
                      </>
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
          {!selectedKakaoId && (
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
          )}
        </div>
      </div>
    </SharedLayout>
  );
};

export default Maps;
