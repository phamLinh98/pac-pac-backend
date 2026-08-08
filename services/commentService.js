import * as commentDAL from '../DAL/commentDAL.js';
import * as storageService from './storageService.js';

export const getComment = async () => {
    const rows = await commentDAL.getComment();
    return rows;
}

export const getCommentByListId = async (listId) => {
    const rows = await commentDAL.getCommentByListId(listId);
    return Promise.all(rows.map(async (row) => ({
        ...row,
        avatar: await storageService.resolveStoredImageUrl(row.avatar),
        image_url: await storageService.resolveStoredImageUrl(row.image_key),
    })));
}

export const addComment = async (userId, listId, content, file) => {
    const imageKey = file ? await storageService.uploadCommentImage(listId, userId, file) : null;
    try {
        const newComment = await commentDAL.addComment(userId, listId, content, imageKey);
        return {
            ...newComment,
            image_url: await storageService.resolveStoredImageUrl(newComment?.image_key),
        };
    } catch (error) {
        if (imageKey) await storageService.deleteCommentImage(imageKey).catch(() => undefined);
        throw error;
    }
}
