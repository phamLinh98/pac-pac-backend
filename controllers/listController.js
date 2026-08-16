import * as listService from "../services/listService.js";
import * as storageService from "../services/storageService.js";

/**
 * GET /list
 */
export const getList = async (req, res) => {
  try {
    const result = await listService.getList(Number(req.checkAccessToken?.id));

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
 * Nếu user tồn tại, lấy bài viết của bạn bè user đó,
 * bất kể user hiện tại đã có bài viết hay chưa.
 */
export const getListStatusOfOneUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const loginUserId = Number(req.checkAccessToken?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        error: "Invalid id parameter",
      });
    }

    if (userId !== loginUserId) {
      return res.status(403).json({ error: "Không có quyền xem bảng tin của user khác" });
    }

    const requestedLimit = Number(req.query.limit ?? 10);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10;
    let cursor = null;
    if (req.query.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(String(req.query.cursor), "base64url").toString("utf8"));
        const cursorId = Number(decoded.id);
        const cursorDate = new Date(decoded.createdAt);
        if (!Number.isInteger(cursorId) || cursorId <= 0 || Number.isNaN(cursorDate.getTime())) {
          throw new Error("Invalid cursor values");
        }
        cursor = { id: cursorId, createdAt: cursorDate.toISOString() };
      } catch {
        return res.status(400).json({ error: "Invalid cursor" });
      }
    }

    const result = await listService.getListStatusOfOneUser(userId, { cursor, limit });

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
        userId,
        Number(req.checkAccessToken?.id)
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
    const userId = Number(req.checkAccessToken?.id);

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

    if (text.length > 10000 || image.length > 10) {
      return res.status(400).json({ message: "Nội dung hoặc số lượng ảnh vượt giới hạn" });
    }

    if (image.some((key) => !key.startsWith(`posts/${userId}/`))) {
      return res.status(400).json({ message: "Ảnh bài viết không thuộc user đăng nhập" });
    }

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

    const userId = Number(req.checkAccessToken?.id);

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

/**
 * PUT /update-post/:id
 *
 * multipart/form-data:
 * - images: File[] (optional)
 * - text: string (optional)
 * - existingImages: JSON string (optional) - existing image keys to keep
 * - oldImageKeys: JSON string (optional) - images to delete
 *
 * Quy trình:
 * 1. Upload file mới (nếu có)
 * 2. Xoá ảnh cũ không còn dùng
 * 3. Cập nhật nội dung bài viết
 * 4. Trả về bài viết cập nhật với signed URLs
 */
export const updatePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "postId không hợp lệ.",
      });
    }

    const tokenUserId = Number(
      req.user?.id ??
        req.auth?.id ??
        req.data?.id ??
        req.checkAccessToken?.id
    );

    const userId = tokenUserId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "userId không hợp lệ.",
      });
    }

    // Xử lý file uploads nếu có
    const files = Array.isArray(req.files)
      ? req.files
      : [];

    let newImageKeys = [];
    if (files.length > 0) {
      newImageKeys =
        await storageService.uploadPostImages(
          userId,
          files
        );
    }

    // Lấy ảnh hiện có từ body (JSON string)
    let existingImages = [];
    if (req.body?.existingImages) {
      try {
        const parsed = JSON.parse(
          req.body.existingImages
        );
        existingImages = Array.isArray(parsed)
          ? parsed.filter((key) => typeof key === "string" && key.startsWith(`posts/${userId}/`))
          : [];
      } catch (error) {
        console.error(
          "Error parsing existingImages:",
          error
        );
      }
    }

    // Kết hợp ảnh mới + ảnh hiện có
    const allImages = [
      ...existingImages,
      ...newImageKeys,
    ];

    // Lấy text
    const text =
      typeof req.body?.text === "string"
        ? req.body.text.trim()
        : "";

    if (text.length > 10000 || allImages.length > 10) {
      return res.status(400).json({ message: "Nội dung hoặc số lượng ảnh vượt giới hạn" });
    }

    // Cho phép update chỉ text (không yêu cầu ảnh)
    if (!text && allImages.length === 0) {
      return res.status(400).json({
        message:
          "Bài viết phải có nội dung hoặc ít nhất một hình ảnh.",
      });
    }

    const content = {
      text,
      image: allImages,
    };

    const updatedPosts =
      await listService.updatePost(
        postId,
        userId,
        content
      );

    const updatedPost =
      Array.isArray(updatedPosts)
        ? updatedPosts[0] ?? null
        : updatedPosts;

    if (!updatedPost) {
      if (newImageKeys.length > 0) {
        await storageService.deletePostImages(newImageKeys);
      }
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    return res.status(200).json({
      message: "Cập nhật bài viết thành công.",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Không thể cập nhật bài viết.",
    });
  }
};

/**
 * DELETE /delete-post/:id
 *
 * Xoá bài viết và tất cả ảnh liên quan khỏi S3.
 */
export const deletePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);

    if (
      !Number.isInteger(postId) ||
      postId <= 0
    ) {
      return res.status(400).json({
        message: "postId không hợp lệ.",
      });
    }

    const tokenUserId = Number(
      req.user?.id ??
        req.auth?.id ??
        req.data?.id ??
        req.checkAccessToken?.id
    );

    const userId = tokenUserId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "userId không hợp lệ.",
      });
    }

    const deletedPosts =
      await listService.deletePost(
        postId,
        userId
      );

    const deletedPost =
      Array.isArray(deletedPosts)
        ? deletedPosts[0] ?? null
        : deletedPosts;

    if (!deletedPost) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết.",
      });
    }

    return res.status(200).json({
      message: "Xoá bài viết thành công.",
      post: deletedPost,
    });
  } catch (error) {
    console.error("Error deleting post:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Không thể xoá bài viết.",
    });
  }
};
