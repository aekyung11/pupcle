import clsx from "clsx";
import Image from "next/image";
import React, { CSSProperties } from "react";

export type AspectRatioImageProps = {
  id?: string;
  imgWidth: number;
  imgHeight: number;
  style?: CSSProperties;
  alt: string;
  src: React.ComponentProps<typeof Image>["src"];
  className?: string;
};

export function AspectRatioImage({
  id,
  style,
  imgWidth,
  imgHeight,
  alt,
  src,
  className,
}: AspectRatioImageProps) {
  return (
    <div
      className={clsx({
        [className ?? ""]: className,
        relative: true,
      })}
      style={{
        aspectRatio: `${imgWidth} / ${imgHeight}`,
        ...style,
      }}
    >
      <Image id={id} src={src} fill alt={alt} />
    </div>
  );
}
