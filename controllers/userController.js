import * as userService from '../services/userService.js';
import * as storageService from '../services/storageService.js';
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
        const updatedUser = await userService.updateProfileImage(userId, 'avatar', avatar);
        return res.status(200).json({ message: "Update avatar successfully", updatedUser });
    } catch (error) {
        console.log('error', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getProfileMedia = async (req, res) => {
    try {
        const userId = Number(req.checkAccessToken?.id);
        const media = await userService.getProfileMedia(userId);
        return res.status(200).json(media);
    } catch (error) {
        console.error('getProfileMedia error:', error);
        return res.status(500).json({ message: 'Không thể tải kho ảnh' });
    }
};

export const updateProfileImage = async (req, res) => {
    const userId = Number(req.checkAccessToken?.id);
    const imageType = String(req.body?.imageType ?? '').trim().toLowerCase();
    let uploadedKey = null;

    try {
        if (!["avatar", "background"].includes(imageType)) {
            return res.status(400).json({ message: 'Loại ảnh profile không hợp lệ' });
        }

        let imageKey = typeof req.body?.imageKey === 'string' ? req.body.imageKey.trim() : '';
        if (req.file) {
            uploadedKey = await storageService.uploadProfileImage(userId, imageType, req.file);
            imageKey = uploadedKey;
        } else if (!imageKey || !(await userService.userOwnsMediaKey(userId, imageKey))) {
            return res.status(403).json({ message: 'Ảnh không thuộc kho ảnh của bạn' });
        }

        const user = await userService.updateProfileImage(userId, imageType, imageKey);
        if (!user) throw new Error('Không tìm thấy user');

        return res.status(200).json({ message: 'Cập nhật ảnh profile thành công', user });
    } catch (error) {
        if (uploadedKey) await storageService.deletePostImages([uploadedKey]).catch(() => undefined);
        console.error('updateProfileImage error:', error);
        return res.status(500).json({ message: 'Không thể cập nhật ảnh profile' });
    }
};

export const updateProfileInfo = async (req, res) => {
    try {
        const userId = Number(req.checkAccessToken?.id);
        const fields = {
            address: req.body?.address,
            education: req.body?.education,
            bios: req.body?.bios,
        };

        if (Object.values(fields).some((value) => typeof value !== 'string')) {
            return res.status(400).json({ message: 'Thông tin profile không hợp lệ' });
        }

        const profileInfo = {
            address: fields.address.trim(),
            education: fields.education.trim(),
            bios: fields.bios.trim(),
        };
        if (profileInfo.address.length > 500 || profileInfo.education.length > 255 || profileInfo.bios.length > 2000) {
            return res.status(400).json({ message: 'Thông tin profile vượt quá độ dài cho phép' });
        }

        const updatedProfileInfo = await userService.updateProfileInfo(userId, profileInfo);
        return res.status(200).json({ message: 'Cập nhật thông tin profile thành công', profileInfo: updatedProfileInfo });
    } catch (error) {
        console.error('updateProfileInfo error:', error);
        return res.status(500).json({ message: 'Không thể cập nhật thông tin profile' });
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

export const getMyFriendRequests = async (req, res) => {
    try {
        const userId = Number(req.checkAccessToken?.id);
        const requests = await userService.getListSendFriend(userId);
        return res.status(200).json(Array.isArray(requests) ? requests : []);
    } catch (error) {
        console.error('getMyFriendRequests error:', error);
        return res.status(500).json({ message: 'Không thể tải lời mời kết bạn' });
    }
};

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

export const heartbeat = async (req, res) => {
    try {
        const result = await userService.updateLastActive(Number(req.checkAccessToken?.id));
        return res.status(200).json(result);
    } catch (error) {
        console.error('presence heartbeat error:', error);
        return res.status(500).json({ message: 'Không thể cập nhật trạng thái hoạt động' });
    }
};

export const getFriendPresence = async (req, res) => {
    try {
        const result = await userService.getFriendPresence(Number(req.checkAccessToken?.id));
        return res.status(200).json(result);
    } catch (error) {
        console.error('friend presence error:', error);
        return res.status(500).json({ message: 'Không thể tải trạng thái bạn bè' });
    }
};
