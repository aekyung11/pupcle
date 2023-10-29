import { View } from "@app/cpapp/design/view";
import { User } from "@app/graphql";
import fourOhFour from "@app/server/public/404_page.png";
import { StyledComponent } from "nativewind";
// import { Result } from "antd";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { SolitoImage } from "solito/image";

// import { ButtonLink } from "./ButtonLink";

interface FourOhFourProps {
  currentUser?: Pick<User, "id"> | null;
}
export function FourOhFour(props: FourOhFourProps) {
  const { currentUser } = props;
  return (
    <View
      data-cy="fourohfour-div"
      className="bg-lightblue-bg flex h-[calc(100vh-96px)] w-full items-center justify-center"
    >
      <View className="flex h-[633px] w-[768px] flex-col items-center justify-between">
        <Text className="font-poppins text-pupcle-48px text-center font-bold">
          Sorry, the page not found
        </Text>
        <StyledComponent
          component={SolitoImage}
          className="h-[46px] w-[44px]"
          src={fourOhFour}
          alt=""
          // fill
        />
        <Text className="font-poppins text-pupcle-30px text-center font-semibold">
          We cannot find the page you are looking for. Please check the url.
        </Text>
      </View>
    </View>
  );
}
