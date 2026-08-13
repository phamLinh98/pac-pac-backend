import {
  uploadImages,
  createSignedUrls,
  deleteImages,
} from "./imageServiceClient.js";

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

export const uploadCommentImage = async (postId, userId, file) => {
  if (!Number.isInteger(Number(postId)) || !Number.isInteger(Number(userId)) || !file?.buffer) {
    throw new Error("Thông tin ảnh bình luận không hợp lệ");
  }
  return (await uploadImages({ files: [file], category: "comments", ownerId: userId, resourceId: postId }))[0];
};

export const deleteCommentImage = (key) => deleteImages([key]);

export const uploadChatImage = async (chatId, userId, file) => {
  if (!Number.isInteger(Number(chatId)) || !Number.isInteger(Number(userId)) || !file?.buffer) {
    throw new Error("Thông tin ảnh chat không hợp lệ");
  }
  return (await uploadImages({ files: [file], category: "chats", ownerId: userId, resourceId: chatId }))[0];
};

export const deleteChatImage = (key) => deleteImages([key]);

export const uploadProfileImage = async (userId, imageType, file) => {
  if (!Number.isInteger(Number(userId)) || !["avatar", "background"].includes(imageType)) {
    throw new Error("Thông tin ảnh profile không hợp lệ");
  }
  if (!file?.buffer) throw new Error("Không có dữ liệu ảnh profile");

  return (await uploadImages({ files: [file], category: "profiles", ownerId: userId, imageType }))[0];
};

export const resolveStoredImageUrl = async (value) => {
  if (!value || typeof value !== "string") return value ?? null;
  if (!isStorageObjectKey(value)) return value;
  const urls = await createSignedUrls([value], 7 * 24 * 60 * 60);
  return urls[value] ?? value;
};

export const attachProfileImageUrls = async (record) => {
  if (!record || typeof record !== "object") return record;
  const avatarKey = record.avatar;
  const backgroundKey = record.background ?? record.background_image;
  return {
    ...record,
    avatar_key: avatarKey,
    background_key: backgroundKey,
    avatar: await resolveStoredImageUrl(avatarKey),
    background: await resolveStoredImageUrl(backgroundKey),
  };
};

export const uploadStoryImage = async (
  userId,
  file
) => {
  if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
    throw new Error("userId không hợp lệ.");
  }

  if (!file?.buffer) {
    throw new Error("Không có dữ liệu ảnh story.");
  }

  return (await uploadImages({ files: [file], category: "stories", ownerId: userId }))[0];
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

    return uploadImages({ files, category: "posts", ownerId: userId });
  };

export const getPostImageSignedUrls =
  async (images) => {
    if (!Array.isArray(images)) {
      return [];
    }

    const normalized = images
      .map((image) => typeof image === "string" ? image.trim() : "")
      .filter(Boolean);
    const storageKeys = normalized.filter(isStorageObjectKey);
    const signedUrls = storageKeys.length ? await createSignedUrls(storageKeys) : {};
    return normalized
      .map((image) => isPublicUrl(image) ? image : signedUrls[image] ?? null)
      .filter(Boolean);
  };

export const attachSignedUrlsToPost =
  async (post) => {
    if (
      !post ||
      typeof post !== "object"
    ) {
      return post;
    }

    const rawContent = post.content;

    if (
      rawContent &&
      typeof rawContent === "object" &&
      !Array.isArray(rawContent) &&
      Object.keys(rawContent).length === 0
    ) {
      return attachProfileImageUrls({
        ...post,
        content: {},
        imageKeys: [],
      });
    }

    const normalizedContent =
      normalizeContent(rawContent);

    const originalImageKeys =
      normalizedContent.image;

    if (
      originalImageKeys.length === 0
    ) {
      /*
       * Không biến content thành format lạ.
       * Vẫn trả object chuẩn cho frontend.
       */
      return attachProfileImageUrls({
        ...post,
        content: {
          text:
            normalizedContent.text,
          image: [],
        },
        imageKeys: [],
      });
    }

    const signedImageUrls =
      await getPostImageSignedUrls(
        originalImageKeys
      );

    return attachProfileImageUrls({
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
    });
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

    await deleteImages(storageKeys);
  };
