import * as listDAL from "../DAL/listDAL.js";
import * as storageService from "./storageService.js";

const attachShareDetails = async (rows) => Promise.all(rows.map(async (row) => {
  if (!row?.is_shared_post || !row.original_post_exists) return row;
  const original = await storageService.attachSignedUrlsToPost({ content: row.original_content });
  return {
    ...row,
    original_content: original.content,
    original_author_avatar: await storageService.resolveStoredImageUrl(row.original_author_avatar),
  };
}));

const preparePosts = async (rows) =>
  attachShareDetails(await storageService.attachSignedUrlsToPosts(rows));

/**
 * Lấy toàn bộ bài viết.
 */
export const getList = async (viewerUserId) => {
  const rows = await listDAL.getList(viewerUserId);

  /*
   * Chuyển object key trong content.image
   * thành signed URL trước khi trả cho frontend.
   */
  return preparePosts(rows);
};

/**
 * Lấy bài viết theo logic kiểm tra user hiện tại.
 */
export const getListStatusOfOneUser = async (
  userId,
  { cursor = null, limit = 10 } = {}
) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      "getListStatusOfOneUser: userId không hợp lệ."
    );
  }

  const rows =
    await listDAL.getListStatusOfOneUser(
      userId,
      cursor,
      limit + 1
    );

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const items = await preparePosts(pageRows);
  const last = pageRows.at(-1);

  return {
    items,
    hasMore,
    nextCursor: hasMore && last
      ? Buffer.from(JSON.stringify({ createdAt: last.created_at, id: last.id })).toString("base64url")
      : null,
  };
};

/**
 * Lấy toàn bộ bài viết của một user.
 */
export const getListUserStatusByUserId = async (
  userId,
  viewerUserId
) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      "getListUserStatusByUserId: userId không hợp lệ."
    );
  }

  const rows =
    await listDAL.getListUserStatusByUserId(
      userId,
      viewerUserId
    );

  return preparePosts(rows);
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
  content
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

  const existingRows = await listDAL.getPostByIdAndUser(postId, userId);
  if (existingRows.length === 0) return [];
  const existingImageKeys = Array.isArray(existingRows[0]?.content?.image)
    ? existingRows[0].content.image
    : [];

  const rows = await listDAL.updatePost(
    postId,
    userId,
    content
  );

  const newImageKeys = Array.isArray(content.image) ? content.image : [];
  const imagesToDelete = existingImageKeys.filter(
    (key) => typeof key === "string" && key.startsWith(`posts/${userId}/`) && !newImageKeys.includes(key)
  );
  if (rows.length > 0 && imagesToDelete.length > 0) {
    await storageService.deletePostImages(imagesToDelete);
  }

  /*
   * UPDATE RETURNING trả về object key.
   * Service chuyển key thành signed URL
   * trước khi trả response.
   */
  return storageService.attachSignedUrlsToPosts(
    rows
  );
};

/**
 * Xoá bài viết.
 * 
 * Quy trình:
 * 1. Xoá bài viết khỏi database
 * 2. Lấy danh sách ảnh từ bài vừa xoá
 * 3. Xoá tất cả ảnh khỏi S3
 */
export const deletePost = async (
  postId,
  userId
) => {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new TypeError(
      "deletePost: postId không hợp lệ."
    );
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      "deletePost: userId không hợp lệ."
    );
  }

  const rows = await listDAL.deletePost(
    postId,
    userId
  );

  // Lấy danh sách ảnh từ bài viết vừa xoá
  if (Array.isArray(rows) && rows.length > 0) {
    const deletedPost = rows[0];
    const content = deletedPost.content ?? {};
    const imageKeys = Array.isArray(content.image)
      ? content.image
      : [];

    // Xoá tất cả ảnh khỏi S3
    if (imageKeys.length > 0) {
      await storageService.deletePostImages(imageKeys);
    }
  }

  return rows;
};
