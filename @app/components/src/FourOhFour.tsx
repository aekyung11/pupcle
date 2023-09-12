import { User } from "@app/graphql";
import { Result } from "antd";
import React from "react";

import { ButtonLink } from "./ButtonLink";

interface FourOhFourProps {
  currentUser?: Pick<User, "id"> | null;
}
export function FourOhFour(props: FourOhFourProps) {
  const { currentUser } = props;
  return (
    <div
      data-cy="fourohfour-div"
      className="bg-lightblue-bg flex h-[calc(100vh-96px)] w-full items-center justify-center"
    >
      <div className="flex h-[633px] w-[768px] flex-col items-center justify-between">
        <span className="font-poppins text-pupcle-48px text-center font-bold">
          Sorry, the page not found
        </span>
        <img src="/404_page.png" className="h-[354px] w-[404px]" />
        <span className="font-poppins text-pupcle-30px text-center font-semibold">
          We cannot find the page you are looking for.
          <br />
          Please check the url.
        </span>
      </div>
    </div>
  );
}
