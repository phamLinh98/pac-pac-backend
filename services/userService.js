import { envConfig } from '../configs/envConfig.js';
import * as userDAL from '../DAL/userDAL.js';
import { signAccessToken, signRefeshToken } from '../utils/signTokenAuthorization.js';

export const getUser = async () => {
    const rows = await userDAL.getUser();
    return rows;
}

export const finUserViaUserId = async (userId) => {
    const rows = await userDAL.finUserViaUserId(userId);
    return rows;
}

export const loginUserByEmailAndPassword = async (email, password) => {
    try {
        const rows = await userDAL.loginUserByEmailAndPassword(email, password);
        const userLogin = rows[0];
        const accessToken = signAccessToken(userLogin, envConfig.accessSecretKey, { expiresIn: '1h' })
        const refreshToken = signRefeshToken(userLogin, envConfig.refeshSecretKey, { expiresIn: '7day' })
        const tokenForClient = signRefeshToken(userLogin, envConfig.accessSecretKey, { expiresIn: '1h' });
        await userDAL.saveRefeshToken(userLogin.id, refreshToken);
        return {
            userLogin,
            accessToken,
            refreshToken,
            tokenForClient
        }
    } catch (error) {
        console.log('Khong tim thay user', error);
    }
}

export const getListFriendViaUserId = async (userId) => {
    try {
        const rows = await userDAL.getListFriendViaUserId(userId);
        return rows;
    } catch (error) {
        console.log('error', error);
    }
}

export const getUserFriendOfLoginUser = async (userId) => {
    try {
        const rows = await userDAL.getUserFriendOfLoginUser(userId);
        return rows;
    } catch (error) {
        console.log('error', error)
    }
}

export const createNewUser = async (name, email, password) => {
    try {
        // Tạo user trước
        const newUser = await userDAL.createNewUser(name, email, password);
        //await userDAL.createUserList(userId);
        return newUser;
       
    } catch (error) {
        console.log('Lỗi khi tạo user:', error);
        throw error;
    }
}

export const updateAvatarOfUser = async (userId, avatarUrl) => {
    try {
        const updatedUser = await userDAL.updateAvatar(userId, avatarUrl);
        return updatedUser;
    } catch (error) {
        console.log('error', error);
        throw error;
    }
}

export const getListSendFriend = async (userId) => {
    try {
        const rows = await userDAL.getListSendFriend(userId);
        return rows;
    } catch (error) {
        console.log('error', error);
    }
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
