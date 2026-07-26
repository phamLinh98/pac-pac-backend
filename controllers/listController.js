import * as listService from "../services/listService.js";
import * as storageService from "../services/storageService.js";

/**
 * GET /list
 */
export const getList = async (req, res) => {
  try {
    const result = await listService.getList();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error querying getList:", error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

/**
 * GET /list/:id
 *
 * Logic hiện tại:
 * - Nếu user có bài viết: lấy bài viết của bạn bè user đó.
 * - Nếu user tồn tại nhưng chưa có bài viết: trả thông tin user.
 */
export const getListStatusOfOneUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        error: "Invalid id parameter",
      });
    }

    const result =
      await listService.getListStatusOfOneUser(userId);

    if (!Array.isArray(result) || result.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error querying getListStatusOfOneUser:",
      error
    );

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

/**
 * GET /list-user/:id
 *
 * Lấy toàn bộ bài viết của một user.
 */
export const getListUserStatusByUserId = async (
  req,
  res
) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        error: "Invalid id parameter",
      });
    }

    const result =
      await listService.getListUserStatusByUserId(
        userId
      );

    if (!Array.isArray(result) || result.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error querying getListUserStatusByUserId:",
      error
    );

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

/**
 * POST /add-post
 *
 * Body:
 * {
 *   "userId": 123,
 *   "content": {
 *     "text": "Hello",
 *     "image": [
 *       "posts/123/example.jpg"
 *     ]
 *   }
 * }
 */
export const createNewPost = async (req, res) => {
  try {
    /*
     * Ưu tiên userId lấy từ access token.
     * Nếu middleware hiện tại chưa gán user vào req,
     * tạm thời fallback sang req.body.userId.
     */
    const tokenUserId = Number(
      req.user?.id ??
        req.auth?.id ??
        req.data?.id
    );

    const bodyUserId = Number(req.body?.userId);

    const userId =
      Number.isInteger(tokenUserId) &&
      tokenUserId > 0
        ? tokenUserId
        : bodyUserId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "userId không hợp lệ.",
      });
    }

    const rawContent = req.body?.content;

    if (
      !rawContent ||
      typeof rawContent !== "object" ||
      Array.isArray(rawContent)
    ) {
      return res.status(400).json({
        message: "content không hợp lệ.",
      });
    }

    const text =
      typeof rawContent.text === "string"
        ? rawContent.text.trim()
        : "";

    const image = Array.isArray(rawContent.image)
      ? rawContent.image
          .filter(
            (item) =>
              typeof item === "string" &&
              item.trim() !== ""
          )
          .map((item) => item.trim())
      : [];

    if (!text && image.length === 0) {
      return res.status(400).json({
        message:
          "Bài viết phải có nội dung hoặc ít nhất một hình ảnh.",
      });
    }

    /*
     * Với ảnh mới trên Neon Storage,
     * database chỉ lưu object key:
     *
     * posts/123/file.jpg
     */
    const content = {
      text,
      image,
    };

    const createdPosts =
      await listService.createNewPost(
        userId,
        content
      );

    const createdPost =
      Array.isArray(createdPosts)
        ? createdPosts[0] ?? null
        : createdPosts;

    return res.status(201).json({
      message: "Đăng bài viết thành công.",
      post: createdPost,
    });
  } catch (error) {
    console.error("Error creating new post:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Không thể tạo bài viết.",
    });
  }
};

/**
 * POST /upload-post-images
 *
 * multipart/form-data:
 * - images: File[]
 * - userId: number
 */
export const uploadPostImages = async (req, res) => {
  try {
    const files = Array.isArray(req.files)
      ? req.files
      : [];

    if (files.length === 0) {
      return res.status(400).json({
        message:
          "Không có hình ảnh nào được upload.",
      });
    }

    const tokenUserId = Number(
      req.user?.id ??
        req.auth?.id ??
        req.data?.id
    );

    const bodyUserId = Number(req.body?.userId);

    const userId =
      Number.isInteger(tokenUserId) &&
      tokenUserId > 0
        ? tokenUserId
        : bodyUserId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "userId không hợp lệ.",
      });
    }

    /*
     * uploadPostImages trả về object key,
     * không phải signed URL.
     */
    const imageKeys =
      await storageService.uploadPostImages(
        userId,
        files
      );

    /*
     * Signed URL chỉ phục vụ preview.
     * Không lưu signedUrls vào database.
     */
    const signedUrls =
      await storageService.getPostImageSignedUrls(
        imageKeys
      );

    return res.status(201).json({
      message:
        "Upload hình ảnh thành công.",
      imageKeys,
      signedUrls,
    });
  } catch (error) {
    console.error(
      "Error uploading post images:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Upload hình ảnh thất bại.",
    });
  }
};
