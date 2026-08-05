import { envConfig } from '../configs/envConfig.js';
import * as userDAL from '../DAL/userDAL.js';
import { signAccessToken, signRefeshToken } from '../utils/signTokenAuthorization.js';
import { hashPassword, isPasswordHash, verifyPassword } from '../utils/password.js';

export const getUser = async () => {
    const rows = await userDAL.getUser();
    return rows;
}

export const finUserViaUserId = async (userId) => {
    const rows = await userDAL.finUserViaUserId(userId);
    return rows;
}

export const loginUserByEmailAndPassword = async (email, password) => {
        const rows = await userDAL.findUserForLogin(email);
        const databaseUser = rows[0];
        if (!databaseUser || !(await verifyPassword(password, databaseUser.password))) {
            return null;
        }

        if (!isPasswordHash(databaseUser.password)) {
            await userDAL.updatePasswordHash(databaseUser.id, await hashPassword(password));
        }

        const { password: _password, ...userLogin } = databaseUser;
        const accessToken = signAccessToken(userLogin, envConfig.accessSecretKey, { expiresIn: '1h' })
        const refreshToken = signRefeshToken(userLogin, envConfig.refeshSecretKey, { expiresIn: '7day' })
        const tokenForClient = signRefeshToken(
            { ...userLogin, token_use: 'client-display' },
            envConfig.refeshSecretKey,
            { expiresIn: '7day', audience: 'pac-pac-frontend' }
        );
        await userDAL.saveRefeshToken(userLogin.id, refreshToken);
        return {
            userLogin,
            accessToken,
            refreshToken,
            tokenForClient
        }
}

export const isRefreshTokenActive = async (userId, token) => {
    const rows = await userDAL.findValidRefreshToken(userId, token);
    return Array.isArray(rows) && rows.length > 0;
}

export const revokeRefreshToken = async (token) => {
    if (token) await userDAL.revokeRefreshToken(token);
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

export const searchUsers = async (keyword, loginUserId) => {
    return userDAL.searchUsers(keyword, loginUserId);
}

export const createNewUser = async (name, email, password) => {
    try {
        // Tạo user trước
        const passwordHash = await hashPassword(password);
        const newUser = await userDAL.createNewUser(name, email, passwordHash);
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
