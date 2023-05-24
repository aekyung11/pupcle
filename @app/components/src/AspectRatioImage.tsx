import Image from "next/image";
import React, { CSSProperties } from "react";

export type AspectRatioImageProps = {
  imgWidth: number;
  imgHeight: number;
  style: CSSProperties;
  alt: string;
  src: React.ComponentProps<typeof Image>["src"];
};

export function AspectRatioImage({
  style,
  imgWidth,
  imgHeight,
  alt,
  src,
}: AspectRatioImageProps) {
  return (
    <div
      className="relative"
      style={{
        aspectRatio: `${imgWidth} / ${imgHeight}`,
        ...style,
      }}
    >
      <Image src={src} fill alt={alt} />
    </div>
  );
}
