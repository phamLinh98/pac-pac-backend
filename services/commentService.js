import * as commentDAL from '../DAL/commentDAL.js';
import * as storageService from './storageService.js';

export const getComment = async () => {
    const rows = await commentDAL.getComment();
    return rows;
}

export const getCommentByListId = async (listId, viewerUserId) => {
    const rows = await commentDAL.getCommentByListId(listId, viewerUserId);
    return Promise.all(rows.map(async (row) => ({
        ...row,
        avatar: await storageService.resolveStoredImageUrl(row.avatar),
        image_url: await storageService.resolveStoredImageUrl(row.image_key),
    })));
}

export const addComment = async (userId, listId, content, file, parentCommentId, mentionUserIds) => {
    const imageKey = file ? await storageService.uploadCommentImage(listId, userId, file) : null;
    try {
        const newComment = await commentDAL.addComment(userId, listId, content, imageKey, parentCommentId, mentionUserIds);
        return {
            ...newComment,
            image_url: await storageService.resolveStoredImageUrl(newComment?.image_key),
        };
    } catch (error) {
        if (imageKey) await storageService.deleteCommentImage(imageKey).catch(() => undefined);
        throw error;
    }
}

export const toggleCommentLike = (...args) => commentDAL.toggleCommentLike(...args);
export const updateComment = (...args) => commentDAL.updateComment(...args);
export const deleteComment = async (...args) => {
    const deleted = await commentDAL.deleteComment(...args);
    if (deleted?.image_key) await storageService.deleteCommentImage(deleted.image_key).catch((error) => {
        console.error('Không thể xóa ảnh comment:', error);
    });
    return deleted;
};
