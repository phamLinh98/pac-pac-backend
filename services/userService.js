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
        
        if (newUser && newUser.length > 0) {
            const userId = newUser[0].user_id;
            
            // Sau đó tạo list cho user đó
            try {
                const newList = await userDAL.createUserList(userId);
                
                // Trả về thông tin user kèm list
                return {
                    user: newUser[0],
                    list: newList[0] || null,
                    success: true
                };
            } catch (listError) {
                console.log('Lỗi khi tạo list cho user:', listError);
                // Vẫn trả về user nếu tạo list thất bại
                return {
                    user: newUser[0],
                    list: null,
                    success: true,
                    warning: 'User được tạo nhưng list không được tạo'
                };
            }
        } else {
            throw new Error('Không thể tạo user');
        }
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
