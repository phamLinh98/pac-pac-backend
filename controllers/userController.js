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
        if (!email || !password || String(email).length > 254 || String(password).length > 128) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const result = await userService.loginUserByEmailAndPassword(email, password);
        if (!result) {
            return res.status(401).json({ error: "Invalid email or password" });
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

        return res.status(200).json({
            message: 'Login successful',
            token: result.tokenForClient,
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal Server Error" }); // 500 Internal Server Error
    }
};

// Logout
export const logoutAndRemoveAllToken = async (req, res) => {
    try {
        await userService.revokeRefreshToken(req.signedCookies?.refreshToken);
    } catch (error) {
        console.error('Không thể revoke refresh token khi logout:', error);
    }

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
    return res.status(200).json({ message: 'Đăng xuất thành công' });
}

export const refreshTokenWhenExpired = async (req, res) => {
    try {
        // TODO1: Kiểm tra xem refreshToken có trong cookie hay Authorization header
        let refreshToken = req.signedCookies?.refreshToken;

        if (!refreshToken) {
            return res.status(405).json({ message: 'Bạn chưa có refeshToken, yêu cầu đăng nhập lại' });
        }
        const decoded = jwt.verify(refreshToken, envConfig.refeshSecretKey);
        if (!(await userService.isRefreshTokenActive(decoded.id, refreshToken))) {
            return res.status(401).json({ message: 'Refresh token đã bị thu hồi' });
        }
            // TODO2: Cấp phát accessToken mới
            const { id, name, email, avatar, namecode, list_friend_id, iat } = decoded
            const newAccessToken = jwt.sign(
                { id, name, email, avatar, namecode, list_friend_id, iat },
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
        return res.status(200).json({ message: 'Đã cập nhật accessToken' });
    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }
};

export const getListFriendViaUserId = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ message: "User id không hợp lệ" });
        }

        const getListFriendViaUserId = await userService.getListFriendViaUserId(userId);
        return res.status(200).json(getListFriendViaUserId);
    }
    catch (error) {
        console.error('getListFriendViaUserId error:', error);
        return res.status(500).json({ message: "Không thể tải danh sách bạn bè" });
    }
}

export const getUserFriendOfLoginUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const getUserFriendOfLoginUser = await userService.getUserFriendOfLoginUser(userId);
        return res.status(200).json(getUserFriendOfLoginUser);
    } catch (error) {
        console.log('error', error);
    }
}

export const searchUsers = async (req, res) => {
    try {
        const keyword = String(req.query.q ?? '').trim().slice(0, 100);
        const loginUserId = Number(req.checkAccessToken?.id);

        if (!keyword) {
            return res.status(200).json([]);
        }

        const users = await userService.searchUsers(keyword, loginUserId);
        return res.status(200).json(users);
    } catch (error) {
        console.error('searchUsers error:', error);
        return res.status(500).json({ message: 'Không thể tìm kiếm user' });
    }
}


export const createNewUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedName = String(name ?? '').trim();
        const normalizedEmail = String(email ?? '').trim().toLowerCase();
        if (
            normalizedName.length < 2 || normalizedName.length > 100 ||
            normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
            typeof password !== 'string' || password.length < 8 || password.length > 128
        ) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }
        const createNewUser = await userService.createNewUser(normalizedName, normalizedEmail, password);
        return res.status(200).json({ message: "Create new user successfully", createNewUser });
    } catch (error) {
        console.log('error', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateAvatarOfUser = async (req, res) => {
    try {
        const userId = Number(req.checkAccessToken?.id);
        const routeUserId = Number(req.params.id);
        const { avatar } = req.body;
        if (userId !== routeUserId) {
            return res.status(403).json({ message: "Không có quyền sửa avatar của user khác" });
        }
        try {
            const avatarUrl = new URL(String(avatar));
            if (!['http:', 'https:'].includes(avatarUrl.protocol) || String(avatar).length > 2048) {
                throw new Error('invalid avatar');
            }
        } catch {
            return res.status(400).json({ message: "Avatar URL không hợp lệ" });
        }
        const updatedUser = await userService.updateAvatarOfUser(userId, avatar);
        return res.status(200).json({ message: "Update avatar successfully", updatedUser });
    } catch (error) {
        console.log('error', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getListSendFriend = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const loginUserId = Number(req.checkAccessToken?.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ message: "User id không hợp lệ" });
        }

        if (userId !== loginUserId) {
            return res.status(403).json({ message: "Không có quyền xem lời mời kết bạn của user khác" });
        }

        const listSendFriend = await userService.getListSendFriend(userId);
        return res.status(200).json(listSendFriend);
    } catch (error) {
        console.log('error', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const updateAddFriend = async (req, res) => {
    try {
        const userIdSecond = req.params.id;
        const userIdFirst = req.params.id2;
        if (Number(userIdFirst) !== Number(req.checkAccessToken?.id)) {
            return res.status(403).json({ message: "Không có quyền cập nhật quan hệ của user khác" });
        }
        const result = await userService.updateAddFriend(userIdFirst, userIdSecond);
        return res.status(200).json({ message: "Yêu cầu kết bạn đã được gửi", result });
    } catch (error) {
        console.log('error', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const sendFriendRequest = async (req, res) => {
    try {
        const { userIdFirst, userIdSecond } = req.body ?? {};

        if (
            userIdFirst === undefined ||
            userIdSecond === undefined
        ) {
            return res.status(400).json({
                message: "Thiếu userIdFirst hoặc userIdSecond",
                receivedBody: req.body,
            });
        }

        const firstId = Number(userIdFirst);
        const secondId = Number(userIdSecond);
        const loginUserId = Number(req.checkAccessToken?.id);

        if (
            !Number.isInteger(firstId) ||
            !Number.isInteger(secondId) ||
            firstId <= 0 ||
            secondId <= 0
        ) {
            return res.status(400).json({
                message:
                    "userIdFirst và userIdSecond phải là số nguyên dương",
            });
        }

        if (firstId === secondId) {
            return res.status(400).json({
                message:
                    "Không thể gửi lời mời kết bạn cho chính mình",
            });
        }

        if (firstId !== loginUserId) {
            return res.status(403).json({
                message: "Không thể gửi lời mời dưới danh nghĩa user khác",
            });
        }

        const result =
            await userService.sendFriendRequest(
                firstId,
                secondId
            );

        const friendRequest =
            Array.isArray(result)
                ? result[0] ?? null
                : result ?? null;

        if (!friendRequest) {
            return res.status(500).json({
                message:
                    "Không nhận được kết quả lời mời kết bạn",
            });
        }

        const status =
            typeof friendRequest.status === "string"
                ? friendRequest.status
                    .trim()
                    .toLowerCase()
                : null;

        let updateFriendResult = null;

        if (status === "accepted") {
            updateFriendResult =
                await userService.updateListFriend(
                    firstId,
                    secondId
                );
        }

        return res.status(200).json({
            message:
                status === "accepted"
                    ? "Hai người đã trở thành bạn bè"
                    : "Yêu cầu kết bạn đã được gửi",
            result,
            updateFriendResult,
        });
    } catch (error) {
        console.error(
            "sendFriendRequest error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

export const cancelFriendship = async (req, res) => {
    try {
        const userId = Number(req.checkAccessToken?.id);
        const friendId = Number(req.params.id);

        if (
            !Number.isInteger(userId) ||
            !Number.isInteger(friendId) ||
            userId <= 0 ||
            friendId <= 0 ||
            userId === friendId
        ) {
            return res.status(400).json({ message: "User id không hợp lệ" });
        }

        const result = await userService.cancelFriendship(userId, friendId);

        if (!Array.isArray(result) || result.length === 0) {
            return res.status(409).json({ message: "Hai user hiện không phải bạn bè" });
        }

        return res.status(200).json({
            message: "Đã hủy kết bạn",
            result,
        });
    } catch (error) {
        console.error("cancelFriendship error:", error);
        return res.status(500).json({ message: "Không thể hủy kết bạn" });
    }
};

export const cancelFriendRequest = async (req, res) => {
    try {
        const senderId = Number(req.checkAccessToken?.id);
        const receiverId = Number(req.params.id);

        if (
            !Number.isInteger(senderId) ||
            !Number.isInteger(receiverId) ||
            senderId <= 0 ||
            receiverId <= 0 ||
            senderId === receiverId
        ) {
            return res.status(400).json({ message: "User id không hợp lệ" });
        }

        const result = await userService.cancelFriendRequest(
            senderId,
            receiverId
        );

        if (!Array.isArray(result) || result.length === 0) {
            return res.status(409).json({
                message: "Không tìm thấy lời mời đang chờ do bạn gửi",
            });
        }

        return res.status(200).json({
            message: "Đã hủy yêu cầu kết bạn",
            result,
        });
    } catch (error) {
        console.error("cancelFriendRequest error:", error);
        return res.status(500).json({
            message: "Không thể hủy yêu cầu kết bạn",
        });
    }
};
