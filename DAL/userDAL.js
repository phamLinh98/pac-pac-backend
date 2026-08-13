import sql from '../configs/db.js';
import * as userModel from '../models/userModel.js';

export const finUserViaUserId = async(userId) => {
    const {query, values} = userModel.finUserViaUserId(userId);
    const rows = await sql(query, values);
    return rows;

}


export const getListFriendViaUserId = async(userId) => {
    const {query, values} = userModel.getListFriendViaUserId(userId);
    const rows = await sql(query,values);
    return rows;
}

export const getUserFriendOfLoginUser = async(userId) => {
    const {query, values} = userModel.getUserFriendOfLoginUser(userId);
    const rows = await sql(query,values);
    return rows;
}

export const searchUsers = async (keyword, loginUserId) => {
    const { query, values } = userModel.searchUsers(keyword, loginUserId);
    return sql(query, values);
}

export const updateProfileImage = async(userId, imageType, imageKey) => {
    const {query, values} = userModel.updateProfileImage(userId, imageType, imageKey);
    const rows = await sql(query, values);
    return rows;
}

export const getProfileMedia = async (userId) => {
    const { query, values } = userModel.getProfileMedia(userId);
    return sql(query, values);
}

export const userOwnsMediaKey = async (userId, imageKey) => {
    const { query, values } = userModel.userOwnsMediaKey(userId, imageKey);
    const rows = await sql(query, values);
    return rows[0]?.owns_media === true;
}

export const getListSendFriend = async(userId) => {
    const {query, values} = userModel.getListSendFriend(userId);
    const rows = await sql(query, values);
    return rows;
}

export const updateAddFriend = async(userId, userId2) => {
    const {query, values} = userModel.updateAddFriend(userId, userId2);
    const rows = await sql(query, values);
    return rows;
}

export const updateListFriend = async (userId, userId2) => {
    const { query, values } = userModel.updateListFriend(userId, userId2);
    const rows = await sql(query, values);
    return rows;
}

export const sendFriendRequest = async (userId, userId2) => {
    const { query, values } = userModel.sendFriendRequest(userId, userId2);
    const rows = await sql(query, values);
    return rows;
}

export const cancelFriendship = async (userId, friendId) => {
    const { query, values } = userModel.cancelFriendship(userId, friendId);
    return sql(query, values);
}

export const cancelFriendRequest = async (senderId, receiverId) => {
    const { query, values } = userModel.cancelFriendRequest(senderId, receiverId);
    return sql(query, values);
}

export const updateLastActive = async (userId) => {
    const { query, values } = userModel.updateLastActive(userId);
    const [row] = await sql(query, values);
    return row;
};

export const getFriendPresence = async (userId) => {
    const { query, values } = userModel.getFriendPresence(userId);
    return sql(query, values);
};
