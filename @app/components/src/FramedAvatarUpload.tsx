import { LoadingOutlined } from "@ant-design/icons";
import {
  AllowedUploadContentType,
  useCreateUploadUrlMutation,
} from "@app/graphql";
import { getExceptionFromError } from "@app/lib";
import plus from "@app/server/public/plus_icon.png";
import profileDefaultAvatar from "@app/server/public/profile_default_avatar.png";
import { Col, message, Row, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/lib/upload/interface";
import axios from "axios";
import { UploadRequestOption } from "rc-upload/lib/interface";
import React, { useState } from "react";
import slugify from "slugify";

import { AspectRatioImage } from ".";

const isDev = process.env.NODE_ENV !== "production";

export function getUid(name: string) {
  const randomHex = () => Math.floor(Math.random() * 16777215).toString(16);
  const fileNameSlug = slugify(name);
  return randomHex() + "-" + fileNameSlug;
}

const ALLOWED_UPLOAD_CONTENT_TYPES = {
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

export function FramedAvatarUpload({
  avatarUrl,
  disabled,
  onUpload,
}: {
  avatarUrl: string | null | undefined;
  disabled: boolean;
  onUpload?: (avatarUrl: string) => Promise<void>;
}) {
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
        headers: isDev
          ? {
              "Content-Type": contentType,
            }
          : {
              "x-amz-acl": "public-read",
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
      style={{
        height: "180px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "32px",
      }}
      className="framed-avatar-upload"
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderRadius: "70px",
                    borderStyle: "none",
                    width: "140px",
                    height: "140px",
                    // marginTop: "60px",
                  }}
                  src={avatarUrl}
                  alt={"avatar"}
                />
              </Col>
            </Row>
          ) : (
            <Row>
              <Col span={24}>
                <AspectRatioImage
                  src={profileDefaultAvatar}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderStyle: "none",
                    borderRadius: "70px",
                    width: "140px",
                    height: "140px",
                    // marginTop: "60px",
                  }}
                  alt={"avatar"}
                  imgWidth={276}
                  imgHeight={276}
                />
              </Col>
            </Row>
          )}
          {!disabled && (
            <Row>
              <Col span={24}>
                <AspectRatioImage
                  src={plus}
                  style={{
                    position: "absolute",
                    zIndex: 100,
                    right: "40px",
                    bottom: "40px",
                    width: "60px",
                  }}
                  alt="upload"
                  imgWidth={124}
                  imgHeight={126}
                />
              </Col>
            </Row>
          )}
        </div>
      </Upload>
    </div>
  );
}
