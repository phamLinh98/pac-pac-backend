import * as listDAL from "../DAL/listDAL.js";
import * as storageService from "./storageService.js";

/**
 * Lấy toàn bộ bài viết.
 */
export const getList = async () => {
  const rows = await listDAL.getList();

  /*
   * Chuyển object key trong content.image
   * thành signed URL trước khi trả cho frontend.
   */
  return storageService.attachSignedUrlsToPosts(
    rows
  );
};

/**
 * Lấy bài viết theo logic kiểm tra user hiện tại.
 */
export const getListStatusOfOneUser = async (
  userId
) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      "getListStatusOfOneUser: userId không hợp lệ."
    );
  }

  const rows =
    await listDAL.getListStatusOfOneUser(
      userId
    );

  return storageService.attachSignedUrlsToPosts(
    rows
  );
};

/**
 * Lấy toàn bộ bài viết của một user.
 */
export const getListUserStatusByUserId = async (
  userId
) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      "getListUserStatusByUserId: userId không hợp lệ."
    );
  }

  const rows =
    await listDAL.getListUserStatusByUserId(
      userId
    );

  return storageService.attachSignedUrlsToPosts(
    rows
  );
};

/**
 * Tạo bài viết.
 */
export const createNewPost = async (
  userId,
  content
) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      "createNewPost: userId không hợp lệ."
    );
  }

  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    throw new TypeError(
      "createNewPost: content không hợp lệ."
    );
  }

  const rows = await listDAL.createNewPost(
    userId,
    content
  );

  /*
   * INSERT RETURNING trả về object key.
   * Service chuyển key thành signed URL
   * trước khi trả response.
   */
  return storageService.attachSignedUrlsToPosts(
    rows
  );
};

/**
 * Cập nhật bài viết.
 * 
 * Quy trình:
 * 1. Lấy bài viết cũ để có danh sách ảnh cũ
 * 2. Xóa những ảnh không còn trong bài viết mới khỏi S3
 * 3. Cập nhật bài viết trong database
 * 4. Gắn signed URL cho ảnh mới
 */
export const updatePost = async (
  postId,
  userId,
  content,
  oldImageKeys = []
) => {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new TypeError(
      "updatePost: postId không hợp lệ."
    );
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      "updatePost: userId không hợp lệ."
    );
  }

  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    throw new TypeError(
      "updatePost: content không hợp lệ."
    );
  }

  // Xóa ảnh cũ không còn sử dụng
  if (Array.isArray(oldImageKeys) && oldImageKeys.length > 0) {
    const newImageKeys = 
      Array.isArray(content.image) 
        ? content.image 
        : [];
    
    const imagesToDelete = oldImageKeys.filter(
      (oldKey) => !newImageKeys.includes(oldKey)
    );

    if (imagesToDelete.length > 0) {
      await storageService.deletePostImages(imagesToDelete);
    }
  }

  const rows = await listDAL.updatePost(
    postId,
    userId,
    content
  );

  /*
   * UPDATE RETURNING trả về object key.
   * Service chuyển key thành signed URL
   * trước khi trả response.
   */
  return storageService.attachSignedUrlsToPosts(
    rows
  );
};
