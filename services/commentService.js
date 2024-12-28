import * as commentDAL from '../DAL/commentDAL.js';

export const getComment = async () => {
    const rows = await commentDAL.getComment();
    return rows;
}

export const getCommentByListId = async (listId) => {
    const rows = await commentDAL.getCommentByListId(listId);
    return rows;
}