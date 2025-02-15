import { envConfig } from '../configs/envConfig.js';
import * as userService from '../services/userService.js';
import jwt from 'jsonwebtoken';
// get All User 
export const getUser = async (req, res) => {
    try {
        // Query dữ liệu từ bảng "user"
        const idRequest = req.params.id;
        const result = await userService.getUser(idRequest);
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Login by Password and email
export const loginUserByEmailAndPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const result = await userService.loginUserByEmailAndPassword(email, password);
        if (!result) {
            return res.status(402).json({ error: "Invalid email or password" }); // 402 Unauthorized
        }

        res.cookie('accessToken', result.accessToken, {
            maxAge: 60 * 60 * 1000,  // 1h
            httpOnly: true,
            signed: true,
            path: '/',
            sameSite: 'none',
            secure: true // Important when using sameSite: 'none'
        });

        res.cookie('refreshToken', result.refreshToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000,  // 7d
            httpOnly: true,
            signed: true,
            path: '/',
            sameSite: 'none',
            secure: true // Important when using sameSite: 'none'
        });

        return res.status(200).json({ message: 'Login successful', token: result.tokenForClient });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal Server Error" }); // 500 Internal Server Error
    }
};

// Logout
export const logoutAndRemoveAllToken = async (req, res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        signed: true,
        path: '/',
        sameSite: 'none',
        secure: true // Important when using sameSite: 'none'
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        signed: true,
        path: '/',
        sameSite: 'none',
        secure: true // Important when using sameSite: 'none'
    });
    res.send('Cookie đã được xóa!');
}

export const refreshTokenWhenExpired = async (req, res) => {
    try {
        // TODO1: Kiểm tra xem refreshToken có trong cookie hay không
        const refreshToken = req.signedCookies.refreshToken;
        if (!refreshToken) {
            return res.status(405).json({ message: 'Bạn chưa có refeshToken, yêu cầu đăng nhập lại' });
        }
        // Xác thực refreshToken và lấy thông tin user
        jwt.verify(refreshToken, envConfig.refeshSecretKey, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Refresh token không hợp lệ' });
            }
            // TODO2: Cấp phát accessToken mới
            const { id, name, email, avatar, namecode, friends, iat } = decoded
            const newAccessToken = jwt.sign(
                { id, name, email, avatar, namecode, friends, iat },
                envConfig.accessSecretKey,
                { expiresIn: '1h' } // Access token có thời gian sống 1h
            );

            // Lưu accessToken mới vào cookie
            res.cookie('accessToken', newAccessToken, {
                maxAge: 60 * 60 * 1000,  // 1h
                httpOnly: true,
                signed: true,
                path: '/',
                sameSite: 'none',
                secure: true // Important when using sameSite: 'none'
            });

            // Trả về thành công
            return res.status(200).json({
                message: 'Đã cập nhật accessToken',
                accessToken: newAccessToken,
            });
        });
    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const getListFriendViaUserId = async (req, res) => {
    try {
        const userId = req.params.id;
        const getListFriendViaUserId = await userService.getListFriendViaUserId(userId);
        res.status(200).json(getListFriendViaUserId);
    }
    catch (error) {
        console.log('error', error);
    }
}

export const getUserFriendOfLoginUser = async(req,res) => {
    try {
       const userId = req.params.id;
       const getUserFriendOfLoginUser = await userService.getUserFriendOfLoginUser(userId);
        res.status(200).json(getUserFriendOfLoginUser); 
    }catch(error){
        console.log('error', error);
    }
}
