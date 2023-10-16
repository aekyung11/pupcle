import { LoadingOutlined } from "@ant-design/icons";
import {
  AllowedUploadContentType,
  useCreateUploadUrlMutation,
} from "@app/graphql";
import { getExceptionFromError } from "@app/lib";
import { Col, message, Row, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/lib/upload/interface";
import axios from "axios";
import { cva, type VariantProps } from "class-variance-authority";
import { UploadRequestOption } from "rc-upload/lib/interface";
import React, { useState } from "react";
import slugify from "slugify";

export function getUid(name: string) {
  const randomHex = () => Math.floor(Math.random() * 16777215).toString(16);
  const fileNameSlug = slugify(name);
  return randomHex() + "-" + fileNameSlug;
}

export const ALLOWED_UPLOAD_CONTENT_TYPES = {
  "image/apng": "ImageApng",
  "image/bmp": "ImageBmp",
  "image/gif": "ImageGif",
  "image/jpeg": "ImageJpeg",
  "image/png": "ImagePng",
  "image/svg+xml": "ImageSvgXml",
  "image/tiff": "ImageTiff",
  "image/webp": "ImageWebp",
};
const ALLOWED_UPLOAD_CONTENT_TYPES_STRING = Object.keys(
  ALLOWED_UPLOAD_CONTENT_TYPES
).join(",");

const cvaFramedAvatarUpload = cva("framed-avatar-upload", {
  variants: {
    size: {
      small: [],
      medium: [],
    },
    mode: {
      avatar: [],
      gallery: [],
    },
  },
  defaultVariants: {
    size: "small",
    mode: "avatar",
  },
});

const cvaAvatarImage = cva("avatar-image object-cover object-top border-none", {
  variants: {
    size: {
      small: ["w-[140px] h-[140px]"],
      medium: ["w-[200px] h-[200px]"],
    },
    mode: {
      avatar: ["rounded-full"],
      gallery: ["rounded-[30px]"],
    },
  },
  defaultVariants: {
    size: "small",
    mode: "avatar",
  },
});

const cvaPlusIcon = cva(["absolute", "z-10", "w-[60px]"], {
  variants: {
    size: {
      small: ["right-10 bottom-10"],
      medium: ["right-[70px] bottom-[70px]"],
    },
    mode: {
      avatar: [],
      gallery: [],
    },
  },
  defaultVariants: {
    size: "small",
    mode: "avatar",
  },
});

export interface FramedAvatarUploadProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cvaFramedAvatarUpload> {
  avatarUrl: string | null | undefined;
  disabled: boolean;
  onUpload?: (avatarUrl: string) => Promise<void>;
}

export function FramedAvatarUpload({
  avatarUrl,
  disabled,
  onUpload,
  className,
  size,
  mode,
  ...props
}: FramedAvatarUploadProps) {
  const beforeUpload = (file: any) => {
    file.uid = getUid(file.name);
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG or PNG images.");
      file.status = "error";
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("Image must smaller than 10MB.");
      file.status = "error";
    }
    return isJpgOrPng && isLt10M;
  };

  const [createUploadUrl] = useCreateUploadUrlMutation();

  const [loading, setLoading] = useState(false);

  const customRequest = async (
    option: UploadRequestOption & { file: File }
  ) => {
    const { onSuccess, onError, file, onProgress } = option;
    try {
      const contentType =
        file.type as unknown as keyof typeof ALLOWED_UPLOAD_CONTENT_TYPES;
      const allowedUploadContentType = ALLOWED_UPLOAD_CONTENT_TYPES[
        contentType
      ] as unknown as keyof typeof AllowedUploadContentType;
      const { data } = await createUploadUrl({
        variables: {
          input: {
            contentType: AllowedUploadContentType[allowedUploadContentType],
          },
        },
      });
      const uploadUrl = data?.createUploadUrl?.uploadUrl;

      if (!uploadUrl) {
        throw new Error("Failed to generate upload URL");
      }
      const response = await axios.put(uploadUrl, file, {
        onUploadProgress: (e) => {
          const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          if (onProgress) {
            onProgress({ percent: progress });
          }
        },
        headers: {
          "Content-Type": contentType,
        },
      });
      if (response.config.url) {
        if (onSuccess) {
          onSuccess(response.config);
        }
        if (onUpload) {
          await onUpload(response.config.url.split("?")[0]);
        }
      }
    } catch (e) {
      if (onError) {
        // @ts-ignore
        onError(e);
      }
    }
  };
  const onChange = (info: UploadChangeParam<UploadFile<any>>) => {
    switch (info.file.status) {
      case "uploading": {
        setLoading(true);
        break;
      }
      case "removed":
      case "success":
      case "done": {
        setLoading(false);
        break;
      }
      case "error": {
        const error: any = getExceptionFromError(info.file.error);
        message.error(
          typeof error === "string"
            ? error
            : error?.message ??
                "Unknown error occurred" +
                  (error?.code ? ` (${error.code})` : "")
        );
        setLoading(false);
        break;
      }
    }
  };

  return (
    <div
      className={cvaFramedAvatarUpload({ size, mode, className })}
      {...props}
    >
      <Upload
        accept={ALLOWED_UPLOAD_CONTENT_TYPES_STRING}
        name="avatar"
        showUploadList={false}
        beforeUpload={beforeUpload}
        // @ts-ignore
        customRequest={customRequest}
        onChange={onChange}
        disabled={disabled}
      >
        <div style={{ position: "relative" }}>
          {loading ? (
            <LoadingOutlined />
          ) : avatarUrl ? (
            <Row>
              <Col span={24}>
                <img
                  className={
                    "framed-uploaded-image " + cvaAvatarImage({ size, mode })
                  }
                  src={avatarUrl}
                  alt={"avatar"}
                  crossOrigin="anonymous"
                />
              </Col>
            </Row>
          ) : (
            <Row>
              <Col span={24}>
                <img
                  className={cvaAvatarImage({ size, mode })}
                  src={
                    mode === "gallery"
                      ? "/gallery_button.png"
                      : "/profile_default_avatar.png"
                  }
                  alt={"image"}
                />
              </Col>
            </Row>
          )}
          {!disabled && mode !== "gallery" && (
            <Row>
              <Col span={24}>
                <img
                  className={cvaPlusIcon({ size, mode })}
                  src="/plus_icon.png"
                  alt="plus"
                />
              </Col>
            </Row>
          )}
        </div>
      </Upload>
    </div>
  );
}
