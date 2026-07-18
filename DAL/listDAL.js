import sql from "../configs/db.js";
import * as listModel from "../models/listModel.js";

export const getList = async () => {
  const queryObject = listModel.getList();
  const rows = await sql(queryObject);
  // Kiểm tra và thay thế trường content là null bằng {}
  const processedRows = rows.map((row) => {
    if (row.content === null || row.content === undefined) {
      return { ...row, content: {} }; // Tạo một object mới với content là {}
    } else {
      return row; // Trả về row ban đầu nếu content không null
    }
  });

  return processedRows;
};

export const getListStatusOfOneUser = async (userId) => {
  const { query, values } = listModel.checkUserIdExistInListAndUser(userId);
  const rows = await sql(query, values);
  const checkUserIdExistInListAndUser = rows[0].result;
  switch (checkUserIdExistInListAndUser) {
    case 1: {
      const { query, values } = listModel.getListStatusAllUserViaId(userId);
      const rows = await sql(query, values);
      const processedRows = rows.map((row) => {
        if (row.content === null || row.content === undefined) {
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
            console.error(`Invalid content JSON at list id ${row.id}:`, error);

            return {
              ...row,
              content: {},
            };
          }
        }

        return row;
      });

      return processedRows;
    }
    case 2: {
      const { query, values } =
        listModel.getListReturnWhenUserIdNotExistInBoth(userId);
      const rows = await sql(query, values);
      const processedRows = rows.map((row) => {
        if (row.content === null || row.content === undefined) {
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
            console.error(`Invalid content JSON at list id ${row.id}:`, error);

            return {
              ...row,
              content: {},
            };
          }
        }

        return row;
      });

      return processedRows;
    }
    default:
      return [];
  }
};

export const getListUserStatusByUserId = async (userId) => {
  const { query, values } = listModel.getListStatusOfOneUser(userId);
  const rows = await sql(query, values);
  const processedRows = rows.map((row) => {
    if (row.content === null || row.content === undefined) {
      return { ...row, content: {} }; // Tạo một object mới với content là {}
    } else {
      return row; // Trả về row ban đầu nếu content không null
    }
  });

  return processedRows;
};

export const createNewPost = async(userId, content) => {
    const { query, values } = listModel.createNewPost(userId, content);
    const rows = await sql(query, values);
    return rows;
}
