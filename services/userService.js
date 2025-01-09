import { envConfig } from '../configs/envConfig.js';
import * as userDAL from '../DAL/userDAL.js';
import { signAccessToken, signRefeshToken } from '../utils/signTokenAuthorization.js';

export const getUser = async () => {
    const rows = await userDAL.getUser();
    return rows;
}

export const loginUserByEmailAndPassword = async (email, password) => {
    try {
        const rows = await userDAL.loginUserByEmailAndPassword(email, password);
        const userLogin = rows[0];
        const accessToken = signAccessToken(userLogin, envConfig.accessSecretKey, { expiresIn: '1h' })
        const refreshToken = signRefeshToken(userLogin, envConfig.refeshSecretKey,{ expiresIn: '7day' })
        await userDAL.saveRefeshToken(userLogin.id, refreshToken);
        return {
            userLogin,
            accessToken,
            refreshToken
        }
    } catch (error) {
        console.log('Khong tim thay user', error);
    }
}
