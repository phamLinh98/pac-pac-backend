import sql from '../configs/db.js';
import * as commentModel from '../models/commentModel.js';
import { scheduleNotificationPipeline } from '../services/notificationPipeline.js';

export const getComment = async() => {
    const queryObject = commentModel.getComment();
    const rows = await sql(queryObject);
    return rows;
}

export const getCommentByListId = async (listId, viewerUserId) => {
    const {query,values} = commentModel.getCommentByListId(listId, viewerUserId);
    const rows = await sql(query,values);
    return rows;
}

export const addComment = async (userId, listId, content, imageKey, parentCommentId, mentionUserIds) => {
    const { query, values } = commentModel.addComment(userId, listId, content, imageKey, parentCommentId, mentionUserIds);
    const [newComment] = await sql(query, values);
    scheduleNotificationPipeline();
    return newComment;
}

const one = async (queryObject) => {
    const [row] = await sql(queryObject.query, queryObject.values);
    return row;
};

export const toggleCommentLike = async (commentId, userId) => {
    const result = await one(commentModel.toggleCommentLike(commentId, userId));
    scheduleNotificationPipeline();
    return result;
};
export const updateComment = (commentId, userId, content) => one(commentModel.updateComment(commentId, userId, content));
export const deleteComment = (commentId, userId) => one(commentModel.deleteComment(commentId, userId));
