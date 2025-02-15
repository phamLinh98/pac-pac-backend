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
