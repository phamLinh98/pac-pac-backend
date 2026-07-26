import * as listService from '../services/listService.js'
import * as storageService from "../services/storageService.js";

export const getList = async (req, res) => {
    try {
        // Query dữ liệu từ bảng "list"
        const result = await listService.getList();
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getListStatusOfOneUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Kiểm tra xem id có hợp lệ hay không
        if (!userId) {
            return res.status(400).json({ error: "Missing id parameter" });
        }
        // Query dữ liệu từ bảng comment, sử dụng tham số
        const result = await listService.getListStatusOfOneUser(userId);
        // Kiểm tra xem có dữ liệu trả về hay không
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getListUserStatusByUserId = async(req,res) => {
    try {
        const userId = req.params.id;

        // Kiểm tra xem id có hợp lệ hay không
        if (!userId) {
            return res.status(400).json({ error: "Missing id parameter" });
        }
        // Query dữ liệu từ bảng comment, sử dụng tham số
        const result = await listService.getListUserStatusByUserId(userId);
        // Kiểm tra xem có dữ liệu trả về hay không
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createNewPost = (
  userId,
  content
) => {
  const query = `
    INSERT INTO list (
      user_id,
      content,
      "like",
      shared,
      comment,
      created_at
    )
    VALUES (
      $1,
      $2::jsonb,
      0,
      0,
      0,
      NOW()
    )
    RETURNING *;
  `;

  const values = [
    userId,
    JSON.stringify(content),
  ];

  return {
    query,
    values,
  };
};

export const uploadPostImages = async (
  req,
  res
) => {
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

    const bodyUserId = Number(
      req.body?.userId
    );

    const userId =
      Number.isFinite(tokenUserId) &&
      tokenUserId > 0
        ? tokenUserId
        : bodyUserId;

    if (
      !Number.isFinite(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        message: "userId không hợp lệ.",
      });
    }

    const imageKeys =
      await storageService.uploadPostImages(
        userId,
        files
      );

    /*
     * signed URL chỉ dùng để preview ngay sau upload.
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
