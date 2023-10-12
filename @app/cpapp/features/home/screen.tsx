import { Row } from "@app/cpapp/design/layout";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import mobilePupcleDog from "@app/server/public/mobile_pupcle_dog.png";
import { useFonts } from "expo-font";
import React from "react";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
// import { MotiLink } from "solito/moti";
import { Button, Image, useTheme } from "tamagui";

export function HomeScreen() {
  const theme = useTheme();
  return (
    <View className="flex h-full items-center justify-between bg-white">
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
        <Row className="space-x-8">
          <Link href="/login">
            <View
              className="border-pupcleBlue font-poppins h-12 w-[310px] items-center justify-center rounded-full border-[1px] bg-transparent"
              // theme="light"
            >
              <Text className="text-14px text-pupcleBlue font-{poppins} font-bold">
                Sign in with E-mail
              </Text>
            </View>
          </Link>
        </Row>
        <Row className="mt-[14px] space-x-8">
          <Link href="/register">
            <View className="font-poppins bg-pupcleBlue h-12 w-[310px] items-center justify-center rounded-full border-none">
              <Text className="text-14px font-{poppins} font-bold text-white">
                Create an account
              </Text>
            </View>
          </Link>
        </Row>
      </Row>
    </View>
  );
}
