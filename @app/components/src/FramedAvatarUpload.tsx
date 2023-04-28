import { CameraFilled, LoadingOutlined } from "@ant-design/icons";
import {
  AllowedUploadContentType,
  SharedLayout_UserFragment,
  useCreateUploadUrlMutation,
  useUpdateUserMutation,
} from "@app/graphql";
import { getExceptionFromError } from "@app/lib";
import { Col, message, Row, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/lib/upload/interface";
import axios from "axios";
import { UploadRequestOption } from "rc-upload/lib/interface";
import React, { useState } from "react";
import slugify from "slugify";

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
  user,
  disabled,
  onUpload,
}: {
  user: SharedLayout_UserFragment;
  disabled: boolean;
  onUpload?: () => void;
}) {
  const [updateUser] = useUpdateUserMutation();

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
        await updateUser({
          variables: {
            id: user.id,
            patch: {
              avatarUrl: response.config.url.split("?")[0],
            },
          },
        });
        if (onSuccess) {
          onSuccess(response.config);
        }
        if (onUpload) {
          onUpload();
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

  const nickname = user.nickname;

  return (
    <div
      style={{
        width: "180px",
        height: "180px",
        display: "contents",
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
          ) : user.avatarUrl ? (
            <Row>
              <Col lg={24} md={0} sm={0} xs={0}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderRadius: "75px",
                    borderWidth: "5px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    // marginTop: "60px",
                  }}
                  src={user.avatarUrl}
                  width="150px"
                  height="150px"
                  alt={nickname || "avatar"}
                />
              </Col>
              <Col lg={0} md={24} sm={0} xs={0}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderRadius: "75px",
                    borderWidth: "5px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    // marginTop: "60px",
                  }}
                  src={user.avatarUrl}
                  width="150px"
                  height="150px"
                  alt={nickname || "avatar"}
                />
              </Col>
              <Col lg={0} md={0} sm={24} xs={0}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderRadius: "55px",
                    borderWidth: "4px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    // marginTop: "60px",
                  }}
                  src={user.avatarUrl}
                  width="110px"
                  height="110px"
                  alt={nickname || "avatar"}
                />
              </Col>
              <Col lg={0} md={0} sm={0} xs={24}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderRadius: "55px",
                    borderWidth: "4px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    // marginTop: "60px",
                  }}
                  src={user.avatarUrl}
                  width="110px"
                  height="110px"
                  alt={nickname || "avatar"}
                />
              </Col>
            </Row>
          ) : (
            <Row>
              <Col lg={24} md={0} sm={0} xs={0}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderWidth: "5px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    borderRadius: "75px",
                    // marginTop: "60px",
                  }}
                  src="/profile_default.png"
                  width="150px"
                  height="150px"
                  alt={nickname || "avatar"}
                />
              </Col>
              <Col lg={0} md={24} sm={0} xs={0}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderWidth: "5px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    borderRadius: "75px",
                    // marginTop: "60px",
                  }}
                  src="/profile_default.png"
                  width="150px"
                  height="150px"
                  alt={nickname || "avatar"}
                />
              </Col>
              <Col lg={0} md={0} sm={24} xs={0}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderWidth: "4px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    borderRadius: "55px",
                    // marginTop: "60px",
                  }}
                  src="/profile_default.png"
                  width="110px"
                  height="110px"
                  alt={nickname || "avatar"}
                />
              </Col>
              <Col lg={0} md={0} sm={0} xs={24}>
                <img
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    borderWidth: "4px",
                    borderColor: "#FFD9D0",
                    borderStyle: "solid",
                    borderRadius: "55px",
                    // marginTop: "60px",
                  }}
                  src="/profile_default.png"
                  width="110px"
                  height="110px"
                  alt={nickname || "avatar"}
                />
              </Col>
            </Row>
          )}
          {!disabled && (
            <Row>
              <Col lg={24} md={0} sm={0} xs={0}>
                <CameraFilled
                  style={{
                    color: "#FF4B7D",
                    position: "absolute",
                    zIndex: 100,
                    right: "50px",
                    bottom: "55px",
                    fontSize: "50px",
                  }}
                />
              </Col>
              <Col lg={0} md={24} sm={0} xs={0}>
                <CameraFilled
                  style={{
                    color: "#FF4B7D",
                    position: "absolute",
                    zIndex: 100,
                    right: "50px",
                    bottom: "55px",
                    fontSize: "50px",
                  }}
                />
              </Col>
              <Col lg={0} md={0} sm={24} xs={0}>
                <CameraFilled
                  style={{
                    color: "#FF4B7D",
                    position: "absolute",
                    zIndex: 100,
                    right: "35px",
                    bottom: "40px",
                    fontSize: "40px",
                  }}
                />
              </Col>
              <Col lg={0} md={0} sm={0} xs={24}>
                <CameraFilled
                  style={{
                    color: "#FF4B7D",
                    position: "absolute",
                    zIndex: 100,
                    right: "35px",
                    bottom: "40px",
                    fontSize: "40px",
                  }}
                />
              </Col>
            </Row>
          )}
        </div>
      </Upload>
    </div>
  );
}
