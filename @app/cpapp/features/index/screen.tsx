import { Row } from "@app/cpapp/design/layout";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import { useSharedQuery } from "@app/graphql";
import mobilePupcleDog from "@app/server/public/mobile_pupcle_dog.png";
import { useFonts } from "expo-font";
import React from "react";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
// import { MotiLink } from "solito/moti";
import { Button, Image, useTheme } from "tamagui";

export function IndexScreen() {
  const theme = useTheme();
  const query = useSharedQuery();
  return (
    <SharedLayout title="" query={query}>
      {/* <View className="flex h-full items-center justify-between bg-white"> */}
      <View className="flex items-center justify-between bg-white">
        <Row className="mt-[207px] flex flex-col">
          <View className="flex h-[235px] w-[131.63px] items-center justify-center">
            <SolitoImage src={mobilePupcleDog} alt="" fill />
          </View>
          {/* <Image
          className="h-[235px]"
          source={{
            uri: "/@app/server/public/mobile_pupcle_dog.png",
            width: "fit-content",
            height: 235,
          }}
        /> */}

          <Text className="text-14px text-pupcleBlue tracking-widest">
            www.pupcle.com
          </Text>
        </Row>

        <Row className="mb-[87px] flex flex-col">
          <Row className="mb-2 space-x-8">
            <Link href="/onboarding/pet-profile">
              <View
                className="border-pupcleBlue font-poppins h-12 items-center justify-center rounded-full border-[1px] bg-transparent"
                // theme="light"
              >
                <Text className="text-14px text-pupcleBlue font-{poppins} font-bold">
                  pet-profile
                </Text>
              </View>
            </Link>
            <Link href="/onboarding/social-info">
              <View
                className="border-pupcleBlue font-poppins h-12 items-center justify-center rounded-full border-[1px] bg-transparent"
                // theme="light"
              >
                <Text className="text-14px text-pupcleBlue font-{poppins} font-bold">
                  social-info
                </Text>
              </View>
            </Link>
          </Row>

          <Row className="space-x-8">
            <Link href="/login">
              <View
                className="border-pupcleBlue font-poppins h-12 w-[310px] items-center justify-center rounded-full border-[1px] bg-transparent"
                // theme="light"
              >
                <Text className="text-14px text-pupcleBlue font-{poppins} font-bold">
                  이메일로 로그인하기
                </Text>
              </View>
            </Link>
          </Row>
          <Row className="mt-[14px] space-x-8">
            <Link href="/register">
              <View className="font-poppins bg-pupcleBlue h-12 w-[310px] items-center justify-center rounded-full border-none">
                <Text className="text-14px font-{poppins} font-bold text-white">
                  계정 만들기
                </Text>
              </View>
            </Link>
          </Row>
        </Row>
      </View>
    </SharedLayout>
  );
}
