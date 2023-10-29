import { View } from "@app/cpapp/design/view";
import { User } from "@app/graphql";
import fourOhFour from "@app/server/public/404_page.png";
import logo from "@app/server/public/logo.png";
import { StyledComponent } from "nativewind";
// import { Result } from "antd";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";

// import { ButtonLink } from "./ButtonLink";

interface FourOhFourProps {
  currentUser?: Pick<User, "id"> | null;
}
export function FourOhFour(props: FourOhFourProps) {
  const { currentUser } = props;
  return (
    <View
      // data-cy="fourohfour-div"
      className="flex h-full w-full bg-[#F2F7FD]"
    >
      <View className="flex h-[15%] w-full flex-row items-end justify-center">
        <Link href="/home">
          <StyledComponent
            component={SolitoImage}
            className="h-[58px] w-[187px]"
            src={logo}
            alt=""
            // fill
          />
        </Link>
      </View>
      <View className="flex h-[75%] w-full flex-col items-center justify-center py-[72px]">
        <Text className="font-poppins flex-row items-center text-[24px] font-bold">
          앗,{"\n"}페이지를 찾을 수 없어요!
        </Text>
        <StyledComponent
          component={SolitoImage}
          className="mt-[72px] h-[191px] w-[218px]"
          src={fourOhFour}
          alt=""
          // fill
        />
        <View className="mt-[50px]">
          <Text className="font-poppins text-[16px]">
            요청하신 페이지를 찾는 데 문제가 발생했어요.
          </Text>
          <View className="flex flex-row">
            <Text className="font-poppins text-[16px]">
              홈 화면으로 돌아가시겠어요?{" "}
            </Text>
            <Link href="/home">
              <Text className="font-poppins text-pupcleBlue text-[16px] font-bold">
                홈 화면 바로가기
              </Text>
            </Link>
          </View>
        </View>
      </View>
      <View className="flex h-[10%] w-full flex-row items-start justify-center">
        <Text className="font-poppins text-[14px] text-[#8F9092]">
          © 2024 PupCle. All rights reserved.
        </Text>
      </View>
    </View>
  );
}
