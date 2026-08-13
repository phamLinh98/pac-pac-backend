import * as userDAL from '../DAL/userDAL.js';
import * as storageService from './storageService.js';

export const finUserViaUserId = async (userId) => {
    const rows = await userDAL.finUserViaUserId(userId);
    return Promise.all(rows.map(storageService.attachProfileImageUrls));
}

export const getListFriendViaUserId = async (userId) => {
    try {
        const rows = await userDAL.getListFriendViaUserId(userId);
        return Promise.all(rows.map(storageService.attachProfileImageUrls));
    } catch (error) {
        console.log('error', error);
    }
}

export const getUserFriendOfLoginUser = async (userId) => {
    try {
        const rows = await userDAL.getUserFriendOfLoginUser(userId);
        return Promise.all(rows.map(storageService.attachProfileImageUrls));
    } catch (error) {
        console.log('error', error)
    }
}

export const searchUsers = async (keyword, loginUserId) => {
    const rows = await userDAL.searchUsers(keyword, loginUserId);
    return Promise.all(rows.map(storageService.attachProfileImageUrls));
}

export const getProfileMedia = async (userId) => {
    const rows = await userDAL.getProfileMedia(userId);
    return Promise.all(rows.map(async ({ image_key: imageKey }) => ({
        imageKey,
        imageUrl: await storageService.resolveStoredImageUrl(imageKey),
    })));
}

export const updateProfileImage = async (userId, imageType, imageKey) => {
    const rows = await userDAL.updateProfileImage(userId, imageType, imageKey);
    return storageService.attachProfileImageUrls(rows[0] ?? null);
}

export const userOwnsMediaKey = (userId, imageKey) =>
    userDAL.userOwnsMediaKey(userId, imageKey);

export const getListSendFriend = async (userId) => {
    const rows = await userDAL.getListSendFriend(userId);
    return Promise.all(rows.map(async (row) => ({
        ...row,
        sender_avatar: await storageService.resolveStoredImageUrl(row.sender_avatar),
        receiver_avatar: await storageService.resolveStoredImageUrl(row.receiver_avatar),
    })));
}

export const updateAddFriend = async (userId, userId2) => {
    try {
        const result = await userDAL.updateAddFriend(userId, userId2);
        return result;
    }
    catch (error) {
        console.log('error', error);
        throw error;
    }
}

export const updateListFriend = async (userId, userId2) => {
    try {
        const result = await userDAL.updateListFriend(userId, userId2);
        return result;
    }
    catch (error) {
        console.log('error', error);
        throw error;
    }
}

export const sendFriendRequest = async (userId, userId2) => {
    try {
        const result = await userDAL.sendFriendRequest(userId, userId2);
        return result;
    }
    catch (error) {
        console.log('error', error);
        throw error;
    }
}

export const cancelFriendship = async (userId, friendId) => {
    return userDAL.cancelFriendship(userId, friendId);
}

export const cancelFriendRequest = async (senderId, receiverId) => {
    return userDAL.cancelFriendRequest(senderId, receiverId);
}

export const updateLastActive = (userId) => userDAL.updateLastActive(userId);

export const getFriendPresence = async (userId) => {
    const rows = await userDAL.getFriendPresence(userId);
    return Promise.all(rows.map(storageService.attachProfileImageUrls));
};
