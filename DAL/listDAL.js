import sql from "../configs/db.js";
import * as listModel from "../models/listModel.js";

/**
 * Chuẩn hóa field content lấy từ PostgreSQL.
 *
 * jsonb thường được Neon trả về dưới dạng object,
 * nhưng helper này vẫn hỗ trợ dữ liệu cũ dạng string.
 */
const normalizeRowContent = (row) => {
  if (!row || typeof row !== "object") {
    return row;
  }

  if (
    row.content === null ||
    row.content === undefined
  ) {
    return {
      ...row,
      content: {},
    };
  }

  if (typeof row.content === "string") {
    try {
      return {
        ...row,
        content: JSON.parse(row.content),
      };
    } catch (error) {
      console.error(
        `Invalid content JSON at list id ${row.id}:`,
        error
      );

      return {
        ...row,
        content: {},
      };
    }
  }

  return row;
};

const normalizeRowsContent = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map(normalizeRowContent);
};

const validateUserId = (userId, functionName) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      `${functionName}: userId phải là số nguyên dương. Received type: ${typeof userId}`
    );
  }
};

/**
 * Lấy toàn bộ bài viết.
 */
export const getList = async () => {
  const query = listModel.getList();

  const rows = await sql(query);

  return normalizeRowsContent(rows);
};

/**
 * Logic hiện tại:
 *
 * case 1:
 * user tồn tại và có bài viết
 * → lấy bài viết của bạn bè.
 *
 * case 2:
 * user tồn tại nhưng chưa có bài viết
 * → trả thông tin user và content rỗng.
 *
 * case 3:
 * user không tồn tại
 * → trả [].
 */
export const getListStatusOfOneUser = async (
  userId
) => {
  validateUserId(
    userId,
    "getListStatusOfOneUser"
  );

  const {
    query: checkQuery,
    values: checkValues,
  } =
    listModel.checkUserIdExistInListAndUser(
      userId
    );

  const checkRows = await sql(
    checkQuery,
    checkValues
  );

  const checkResult = Number(
    checkRows[0]?.result
  );

  switch (checkResult) {
    case 1: {
      const {
        query,
        values,
      } =
        listModel.getListStatusAllUserViaId(
          userId
        );

      const rows = await sql(query, values);

      return normalizeRowsContent(rows);
    }

    case 2: {
      const {
        query,
        values,
      } =
        listModel.getListReturnWhenUserIdNotExistInBoth(
          userId
        );

      const rows = await sql(query, values);

      return normalizeRowsContent(rows);
    }

    default:
      return [];
  }
};

/**
 * Lấy toàn bộ bài viết của một user.
 */
export const getListUserStatusByUserId = async (
  userId
) => {
  validateUserId(
    userId,
    "getListUserStatusByUserId"
  );

  const { query, values } =
    listModel.getListStatusOfOneUser(
      userId
    );

  const rows = await sql(query, values);

  return normalizeRowsContent(rows);
};

/**
 * Tạo bài viết mới.
 */
export const createNewPost = async (
  userId,
  content
) => {
  validateUserId(userId, "createNewPost");

  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    throw new TypeError(
      "createNewPost: content không hợp lệ."
    );
  }

  const { query, values } =
    listModel.createNewPost(
      userId,
      content
    );

  const rows = await sql(query, values);

  return normalizeRowsContent(rows);
};
