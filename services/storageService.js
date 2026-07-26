import crypto from "crypto";
import path from "path";

import {
  uploadObjectToStorage,
  createSignedObjectUrl,
  deleteObjectFromStorage,
} from "../configs/s3Config.js";

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const sanitizeFileExtension = (file) => {
  const originalExtension = path
    .extname(file.originalname ?? "")
    .toLowerCase();

  const allowedExtensions = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
  ]);

  if (allowedExtensions.has(originalExtension)) {
    return originalExtension === ".jpeg"
      ? ".jpg"
      : originalExtension;
  }

  return extensionByMimeType[file.mimetype] ?? "";
};

const createPostImageKey = (
  userId,
  file
) => {
  const extension =
    sanitizeFileExtension(file);

  const uniqueFileName =
    `${Date.now()}-${crypto.randomUUID()}${extension}`;

  /*
   * S3 không có folder thật.
   * "posts/123/..." chỉ là prefix của object key.
   */
  return `posts/${userId}/${uniqueFileName}`;
};

export const uploadPostImages = async (
  userId,
  files
) => {
  if (
    !Number.isFinite(Number(userId)) ||
    Number(userId) <= 0
  ) {
    throw new Error("userId không hợp lệ.");
  }

  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploadedKeys = [];

  try {
    for (const file of files) {
      if (!file?.buffer) {
        throw new Error(
          `Không tìm thấy buffer của file ${file?.originalname ?? ""}.`
        );
      }

      const key = createPostImageKey(
        userId,
        file
      );

      await uploadObjectToStorage({
        key,
        body: file.buffer,
        contentType: file.mimetype,
        metadata: {
          userId: String(userId),
          originalName: encodeURIComponent(
            file.originalname ?? ""
          ),
        },
      });

      uploadedKeys.push(key);
    }

    return uploadedKeys;
  } catch (error) {
    /*
     * Nếu upload ảnh thứ 3 lỗi sau khi ảnh 1, 2 đã thành công,
     * xóa các ảnh đã upload để tránh file rác.
     */
    await Promise.allSettled(
      uploadedKeys.map((key) =>
        deleteObjectFromStorage(key)
      )
    );

    throw error;
  }
};

export const getPostImageSignedUrls = async (
  imageKeys
) => {
  if (!Array.isArray(imageKeys)) {
    return [];
  }

  const validKeys = imageKeys.filter(
    (key) =>
      typeof key === "string" &&
      key.trim() !== ""
  );

  return Promise.all(
    validKeys.map((key) =>
      createSignedObjectUrl(key)
    )
  );
};

const normalizeContent = (
  rawContent
) => {
  if (!rawContent) {
    return {
      text: "",
      image: [],
    };
  }

  let content = rawContent;

  if (typeof rawContent === "string") {
    try {
      content =
        JSON.parse(rawContent);
    } catch {
      return {
        text: rawContent,
        image: [],
      };
    }
  }

  return {
    text:
      typeof content?.text ===
      "string"
        ? content.text
        : "",

    image: Array.isArray(
      content?.image
    )
      ? content.image
      : [],
  };
};

export const attachSignedUrlsToPosts =
  async (posts) => {
    if (!Array.isArray(posts)) {
      return [];
    }

    return Promise.all(
      posts.map(async (post) => {
        const content =
          normalizeContent(
            post.content
          );

        const signedImageUrls =
          await getPostImageSignedUrls(
            content.image
          );

        return {
          ...post,

          /*
           * Trả URL cho frontend để không cần sửa
           * ProfileComponent và FriendStatusListComponent.
           */
          content: {
            text: content.text,
            image:
              signedImageUrls,
          },

          /*
           * Có thể giữ key riêng nếu cần xóa hoặc quản lý ảnh.
           */
          imageKeys:
            content.image,
        };
      })
    );
  };
