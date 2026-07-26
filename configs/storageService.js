import {
  createSignedObjectUrl,
} from "../configs/s3Config.js";

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

  if (
    typeof rawContent ===
    "string"
  ) {
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

  if (
    !content ||
    typeof content !==
      "object" ||
    Array.isArray(content)
  ) {
    return {
      text: "",
      image: [],
    };
  }

  return {
    text:
      typeof content.text ===
      "string"
        ? content.text
        : "",

    image: Array.isArray(
      content.image
    )
      ? content.image.filter(
          (key) =>
            typeof key ===
              "string" &&
            key.trim() !== ""
        )
      : [],
  };
};

export const attachSignedUrlsToPost =
  async (post) => {
    if (!post) {
      return post;
    }

    const content =
      normalizeContent(
        post.content
      );

    const imageKeys =
      content.image;

    const signedImageUrls =
      await Promise.all(
        imageKeys.map((key) =>
          createSignedObjectUrl(
            key
          )
        )
      );

    return {
      ...post,

      content: {
        text: content.text,
        image:
          signedImageUrls,
      },

      /*
       * Giữ lại key nếu sau này
       * cần xóa hoặc sửa ảnh.
       */
      imageKeys,
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
