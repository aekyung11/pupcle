import { Row } from "@app/cpapp/design/layout";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { useSharedQuery } from "@app/graphql";
import bgGradient from "@app/server/public/bg_gradient.png";
import indexSplash from "@app/server/public/index_splash.png";
import mobilePupcleDog from "@app/server/public/mobile_pupcle_dog.png";
import { useFonts } from "expo-font";
import { StyledComponent } from "nativewind";
import React from "react";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
// import { MotiLink } from "solito/moti";
import { Button, Image, useTheme } from "tamagui";

export function IndexScreen() {
  const theme = useTheme();
  const query = useSharedQuery();
  return (
    <SharedLayout title="index" query={query}>
      {/* <View className="flex h-full items-center justify-between bg-white"> */}
      <View className="flex h-full items-center justify-between">
        <View className="h-[63%]">
          <Row className="mt-[45%] flex flex-col items-center">
            <View className="flex h-[160px] w-[160px] items-center justify-center">
              <SolitoImage src={indexSplash} alt="" fill />
            </View>
            {/* <Image
          className="h-[235px]"
          source={{
            uri: "/@app/server/public/mobile_pupcle_dog.png",
            width: "fit-content",
            height: 235,
          }}
        /> */}

            <Text className="mt-6 text-[14px] tracking-[1.2] text-white">
              www.pupcle.com
            </Text>
          </Row>
        </View>

        <View className="h-[37%] w-full rounded-t-[50px] bg-white">
          <View className="mt-[20%] flex h-full w-full items-center">
            <Link href="/login">
              <View
                className="border-pupcleBlue font-poppins h-12 w-[310px] items-center justify-center rounded-full border-[1px] bg-transparent"
                // theme="light"
              >
                <Text className="text-16px text-pupcleBlue font-{poppins} font-bold">
                  이메일로 로그인하기
                </Text>
              </View>
            </Link>
            <Link href="/onboarding/register">
              <View className="bg-pupcleBlue mt-[6%] h-12 w-[310px] items-center justify-center rounded-full border-none">
                <Text className="text-16px font-poppins font-bold text-white">
                  계정 만들기
                </Text>
              </View>
            </Link>
            <Text className="font-poppins mt-[14%] text-center font-[14px] text-[#8F9092]">
              © 2024 PupCle. All rights reserved.
            </Text>
          </View>
        </View>
      </View>
      <View className="absolute top-0 -z-10 h-full w-full object-cover">
        <StyledComponent
          component={SolitoImage}
          resizeMode="cover"
          className="h-full w-full"
          src={bgGradient}
          alt=""
          // fill
        />
      </View>
    </SharedLayout>
  );
}
