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

const PUBLIC_URL_PREFIXES = [
  "http://",
  "https://",
  "blob:",
  "data:",
];

const isPublicUrl = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue =
    value.trim().toLowerCase();

  return PUBLIC_URL_PREFIXES.some(
    (prefix) =>
      normalizedValue.startsWith(prefix)
  );
};

const isStorageObjectKey = (value) => {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    !isPublicUrl(value)
  );
};

const normalizeContent = (
  rawContent
) => {
  if (
    rawContent === null ||
    rawContent === undefined
  ) {
    return {
      text: "",
      image: [],
    };
  }

  let content = rawContent;

  if (
    typeof rawContent === "string"
  ) {
    const trimmedContent =
      rawContent.trim();

    if (!trimmedContent) {
      return {
        text: "",
        image: [],
      };
    }

    try {
      content =
        JSON.parse(trimmedContent);
    } catch {
      /*
       * Trường hợp dữ liệu cũ chỉ là text.
       */
      return {
        text: trimmedContent,
        image: [],
      };
    }
  }

  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    return {
      text: "",
      image: [],
    };
  }

  const rawImages =
    content.image ??
    content.images ??
    [];

  const normalizedImages =
    Array.isArray(rawImages)
      ? rawImages
          .flat(Infinity)
          .filter(
            (image) =>
              typeof image ===
                "string" &&
              image.trim() !== ""
          )
          .map((image) =>
            image.trim()
          )
      : typeof rawImages ===
          "string" &&
        rawImages.trim() !== ""
        ? [rawImages.trim()]
        : [];

  return {
    text:
      typeof content.text ===
      "string"
        ? content.text
        : typeof content.title ===
            "string"
          ? content.title
          : "",

    image: normalizedImages,
  };
};

const getFileExtension = (file) => {
  const originalExtension = path
    .extname(
      file.originalname ?? ""
    )
    .toLowerCase();

  const allowedExtensions =
    new Set([
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
    ]);

  if (
    allowedExtensions.has(
      originalExtension
    )
  ) {
    return originalExtension ===
      ".jpeg"
      ? ".jpg"
      : originalExtension;
  }

  return (
    extensionByMimeType[
      file.mimetype
    ] ?? ""
  );
};

const createPostImageKey = (
  userId,
  file
) => {
  const extension =
    getFileExtension(file);

  return [
    "posts",
    userId,
    `${Date.now()}-${crypto.randomUUID()}${extension}`,
  ].join("/");
};

export const uploadPostImages =
  async (userId, files) => {
    if (
      !Number.isFinite(
        Number(userId)
      ) ||
      Number(userId) <= 0
    ) {
      throw new Error(
        "userId không hợp lệ."
      );
    }

    if (
      !Array.isArray(files) ||
      files.length === 0
    ) {
      return [];
    }

    const uploadedKeys = [];

    try {
      for (const file of files) {
        if (!file?.buffer) {
          throw new Error(
            `Không có buffer của file ${
              file?.originalname ?? ""
            }.`
          );
        }

        const key =
          createPostImageKey(
            userId,
            file
          );

        await uploadObjectToStorage({
          key,
          body: file.buffer,
          contentType:
            file.mimetype,
          metadata: {
            userId:
              String(userId),
          },
        });

        uploadedKeys.push(key);
      }

      return uploadedKeys;
    } catch (error) {
      await Promise.allSettled(
        uploadedKeys.map((key) =>
          deleteObjectFromStorage(
            key
          )
        )
      );

      throw error;
    }
  };

export const getPostImageSignedUrls =
  async (images) => {
    if (!Array.isArray(images)) {
      return [];
    }

    return Promise.all(
      images.map(async (image) => {
        const normalizedImage =
          typeof image === "string"
            ? image.trim()
            : "";

        if (!normalizedImage) {
          return null;
        }

        /*
         * Ảnh cũ đã là URL thì trả nguyên trạng.
         */
        if (
          isPublicUrl(
            normalizedImage
          )
        ) {
          return normalizedImage;
        }

        /*
         * Chỉ object key mới cần signed URL.
         */
        if (
          isStorageObjectKey(
            normalizedImage
          )
        ) {
          return createSignedObjectUrl(
            normalizedImage
          );
        }

        return null;
      })
    ).then((results) =>
      results.filter(Boolean)
    );
  };

export const attachSignedUrlsToPost =
  async (post) => {
    if (
      !post ||
      typeof post !== "object"
    ) {
      return post;
    }

    const normalizedContent =
      normalizeContent(
        post.content
      );

    const originalImageKeys =
      normalizedContent.image;

    if (
      originalImageKeys.length === 0
    ) {
      /*
       * Không biến content thành format lạ.
       * Vẫn trả object chuẩn cho frontend.
       */
      return {
        ...post,
        content: {
          text:
            normalizedContent.text,
          image: [],
        },
        imageKeys: [],
      };
    }

    const signedImageUrls =
      await getPostImageSignedUrls(
        originalImageKeys
      );

    return {
      ...post,

      /*
       * Frontend sử dụng field này để render.
       */
      content: {
        text:
          normalizedContent.text,
        image:
          signedImageUrls,
      },

      /*
       * Giữ key gốc để dùng khi xóa hoặc chỉnh sửa.
       *
       * Với ảnh cũ là HTTP URL thì giá trị đó
       * vẫn được giữ nguyên trong array này.
       */
      imageKeys:
        originalImageKeys,
    };
  };

export const attachSignedUrlsToPosts =
  async (posts) => {
    if (!Array.isArray(posts)) {
      return [];
    }

    return Promise.all(
      posts.map((post) =>
        attachSignedUrlsToPost(
          post
        )
      )
    );
  };

export const deletePostImages =
  async (imageKeys) => {
    if (!Array.isArray(imageKeys)) {
      return;
    }

    const storageKeys =
      imageKeys.filter(
        isStorageObjectKey
      );

    await Promise.allSettled(
      storageKeys.map((key) =>
        deleteObjectFromStorage(
          key
        )
      )
    );
  };
