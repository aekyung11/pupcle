import "fastestsmallesttextencoderdecoder";

import { FormFile } from "@app/componentlib";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import {
  AllowedUploadContentType,
  useCreateUploadUrlMutation,
  UserAssetKind,
} from "@app/graphql";
import { getExceptionFromError } from "@app/lib";
import galleryButton from "@app/server/public/gallery_button.png";
import plusIcon from "@app/server/public/plus_icon.png";
import profileDefaultAvatar from "@app/server/public/profile_default_avatar.png";
import { Loader2 } from "@tamagui/lucide-icons";
// @ts-ignore
import AwsS3 from "@uppy/aws-s3";
// @ts-ignore
import Uppy from "@uppy/core";
// @ts-ignore
import type { UppyEventMap } from "@uppy/core/types";
import axios from "axios";
import { cva, type VariantProps } from "class-variance-authority";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import slugify from "slugify";
import { SolitoImage } from "solito/image";
import { Button, Square } from "tamagui";

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
const ALLOWED_UPLOAD_CONTENT_TYPES_ARRAY = Object.keys(
  ALLOWED_UPLOAD_CONTENT_TYPES
);

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
  const onFilesChange = useCallback(
    (formFiles: FormFile[]) => {
      if (onUpload && formFiles.length > 0) {
        console.log(`calling upload with ${formFiles[0].assetUrl}`);
        onUpload(formFiles[0].assetUrl);
      }
    },
    [onUpload]
  );

  const {
    uppy,
    isLoading: uppyIsLoading,
    isUploading,
  } = useUppy({
    initialFiles: avatarUrl
      ? [
          {
            assetUrl: avatarUrl,
            kind: UserAssetKind.Image,
            metadata: {
              name: "avatar",
              type: "", // unknown
              size: 0, // unknown
            },
            assetId: "avatar",
          },
        ]
      : [],
    onFilesChange,
    singleFileMode: true,
  });

  const onSelectImage = useCallback(async () => {
    if (!uppy) {
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    };

    const result = await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      const img = result.assets[0];

      const fetchResponse = await fetch(img.uri);
      const blob = await fetchResponse.blob();

      const isJpgOrPng =
        blob.type === "image/jpeg" || blob.type === "image/png";
      if (!isJpgOrPng) {
        // TODO: show error
        // message.error("You can only upload JPG or PNG images.");
        return;
      }
      const isLt10M = blob.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        // TODO: show error
        // message.error("Image must smaller than 10MB.");
        return;
      }

      // reset uppy to no files
      uppy.cancelAll();

      uppy.addFile({
        name: img.fileName ?? `${new Date().getTime()}.${blob.type.slice(6)}`,
        type: blob.type,
        data: blob,
        size: blob.size,
      });
    }
  }, [uppy]);

  return (
    // @ts-ignore
    <View
      className={cvaFramedAvatarUpload({ size, mode, className })}
      {...props}
    >
      <View style={{ position: "relative" }}>
        {uppyIsLoading || isUploading ? (
          <Loader2 />
        ) : avatarUrl ? (
          <Square
            className={
              "framed-uploaded-image " + cvaAvatarImage({ size, mode })
            }
            size="$10"
          >
            <SolitoImage
              src={avatarUrl}
              alt="avatar"
              crossOrigin="anonymous"
              fill
            />
          </Square>
        ) : (
          <Square className={cvaAvatarImage({ size, mode })} size="$10">
            <SolitoImage
              src={mode === "gallery" ? galleryButton : profileDefaultAvatar}
              alt="image"
              fill
            />
          </Square>
        )}
        {!disabled && mode !== "gallery" && (
          <Square className={cvaPlusIcon({ size, mode })} size="$10">
            <SolitoImage src={plusIcon} alt="plus" fill />
          </Square>
        )}
      </View>
      {!disabled && uppy && (
        <Button unstyled className="mt-2 mb-[16px]" onPress={onSelectImage}>
          <Text className="font-poppins text-pupcleBlue text-[14px]">
            사진 수정
          </Text>
        </Button>
      )}
    </View>
  );
}

type UseUppyProps = {
  // files that have previously been uploaded to the server. only read on initialization
  initialFiles: FormFile[];

  // no files value, this is uncontrolled

  // validation: check progress.uploadComplete on uppy.getFiles()

  onFilesChange?: (formFiles: FormFile[]) => Promise<void> | void;

  singleFileMode?: boolean;
};

const useUppy = ({
  initialFiles,
  onFilesChange,
  singleFileMode,
}: UseUppyProps) => {
  const [createUploadUrl] = useCreateUploadUrlMutation();
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const [files, setFiles] = useState<FormFile[]>(initialFiles);
  const [isLoading, setIsLoading] = useState(true);
  // only works for singleFileMode
  const [isUploading, setIsUploading] = useState(false);

  const resetUppy = useCallback(() => {
    const newUppy = async () => {
      const uppy = new Uppy({
        autoProceed: false,
        // to customize strings: see https://uppy.io/docs/dashboard/#locale
        locale: {
          strings: {
            uploadComplete: "사진이 정상적으로 업로드 되었습니다.",
            browseFiles: "browseFiles placeholder",
            uploadingXFiles: {
              0: "**Uploading %{smart_count} file**",
              1: "**Uploading %{smart_count} files**",
            },
            dropPasteImportFiles: "",
            addMoreFiles: "Add more files (hover text)",
            myDevice: "",
            pluginNameCamera: " ",
          },
        },
        restrictions: {
          allowedFileTypes: ALLOWED_UPLOAD_CONTENT_TYPES_ARRAY,
          ...(singleFileMode && {
            maxNumberOfFiles: 1, // single file
          }),
        },
      })
        // .use(Webcam)
        .use(AwsS3, {
          async getUploadParameters(file) {
            const contentType =
              file.type as unknown as keyof typeof ALLOWED_UPLOAD_CONTENT_TYPES;
            const allowedUploadContentType = ALLOWED_UPLOAD_CONTENT_TYPES[
              contentType
            ] as unknown as keyof typeof AllowedUploadContentType;
            const { data } = await createUploadUrl({
              variables: {
                input: {
                  contentType:
                    AllowedUploadContentType[allowedUploadContentType],
                },
              },
            });
            const uploadUrl = data?.createUploadUrl?.uploadUrl;
            if (!uploadUrl) {
              throw new Error("Failed to generate upload URL");
            }
            return {
              method: "PUT",
              url: uploadUrl,
              headers: {
                "Content-Type": contentType,
              },
              fields: {},
            };
          },
        });
      setUppy(uppy);
    };
    newUppy();
  }, [createUploadUrl, singleFileMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      resetUppy();
    }
    // NOTE: depend on exam results id?
    // do not depend on anything, only initialize once
  }, []);

  useEffect(() => {
    if (uppy) {
      const fileAddedHandler: UppyEventMap["file-added"] = (file) => {
        if (file.meta["existingFile"] === true) {
          // this file was previously uploaded
          uppy.setFileState(file.id, {
            progress: {
              uploadComplete: true,
              uploadStarted: true,
            },
          });
        } else if (singleFileMode) {
          setIsUploading(true);
        }
        console.log(`file-added`);
      };
      uppy.on("file-added", fileAddedHandler);

      const fileRemovedHandler: UppyEventMap["file-removed"] = (file) => {
        setFiles((files) =>
          files.filter((f) => {
            return file.id !== f.uppyFileId;
          })
        );
        console.log("file-removed");
        // NOTE: could remove uploaded files upon form submit
      };
      uppy.on("file-removed", fileRemovedHandler);

      const getFormFilesFromUppyFiles = () => {
        setFiles(
          uppy
            .getFiles()
            .filter((f) => f.response?.uploadURL || f.meta["existingFile"])
            .map((f) => ({
              assetId: f.meta["assetId"] as string | undefined,
              assetUrl: f.meta["existingFile"]
                ? (f.meta["assetUrl"] as unknown as string)
                : f.response?.uploadURL!,
              kind: UserAssetKind.Image, // TODO: hardcoded
              metadata: {
                name: f.name,
                size: f.size,
                type: f.type ?? "",
              },
              uppyFileId: f.id,
              uppyPreview: f.preview,
            }))
        );
      };

      uppy.on("upload-success", getFormFilesFromUppyFiles);
      // uppy.on("thumbnail:generated", getFormFilesFromUppyFiles);

      uppy.on("complete", () => {
        setIsUploading(false);
      });

      return () => {
        uppy.off("file-added", fileAddedHandler);
        uppy.off("file-removed", fileRemovedHandler);
        uppy.off("upload-success", getFormFilesFromUppyFiles);
        // uppy.off("thumbnail:generated", getFormFilesFromUppyFiles);
      };
    }
  }, [uppy, files, singleFileMode]);

  useEffect(() => {
    setIsLoading(true);
    if (uppy) {
      // initialize - load files and add them to uppy
      const initializeFiles = async () => {
        const initializedFiles = await Promise.all(
          files.map(async (f) => {
            return axios
              .get(f.assetUrl, { responseType: "blob" })
              .then((response) => {
                const uppyFileId = uppy.addFile({
                  name: f.metadata.name,
                  type: response.data.type, // blob type
                  data: response.data,
                  // NOTE: it doesn't look like uppy saves this, so stick it in the meta
                  response: {
                    body: {},
                    status: 200,
                    uploadURL: f.assetUrl,
                  },
                  meta: {
                    existingFile: true,
                    assetId: f.assetId,
                    assetUrl: f.assetUrl,
                  },
                });
                return {
                  ...f,
                  uppyFileId,
                };
              });
          })
        );
        setFiles(initializedFiles);

        // after initialization, auto-upload files
        uppy.setOptions({
          autoProceed: true,
        });

        setIsLoading(false);
      };

      console.log("initializing files");
      initializeFiles();
    }
    // do not include files here. only initialize once (per uppy instance)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uppy]);

  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(files);
    }
  }, [files, onFilesChange]);

  return {
    uppy,
    isLoading,
    isUploading,
    resetUppy,
  };
};
