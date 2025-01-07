import { envConfig } from '../configs/envConfig.js';
import * as userDAL from '../DAL/userDAL.js';
import jwt from 'jsonwebtoken';

export const getUser = async () => {
    const rows = await userDAL.getUser();
    return rows;
}

export const loginUserByEmailAndPassword = async (email, password) => {
    try {
        const rows = await userDAL.loginUserByEmailAndPassword(email, password);
        const userLogin = rows[0];
        const options = { expiresIn: '1h' };
        const accessToken = jwt.sign(userLogin, envConfig.accessSecretKey, options);
        const refeshToken = jwt.sign(userLogin, envConfig.refeshSecretKey, options);
        await userDAL.saveRefeshToken(userLogin.id, refeshToken);
        return {
            userLogin,
            accessToken,
            refeshToken
        }
    } catch (error) {
        console.log('Khong tim thay user', error);
    }
}
