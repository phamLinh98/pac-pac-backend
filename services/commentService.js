import * as commentDAL from '../DAL/commentDAL.js';

export const getComment = async () => {
    const rows = await commentDAL.getComment();
    return rows;
}

export const getCommentByListId = async (listId) => {
    const rows = await commentDAL.getCommentByListId(listId);
    return rows;
}

export const addComment = async (userId, listId, content) => {
    const newComment = await commentDAL.addComment(userId, listId, content);
    return newComment;
}