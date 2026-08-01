import * as storyService from '../services/storyService.js'

export const getStory = async (req, res) => {
    try {
        // Query dữ liệu từ bảng "story"
        const result = await storyService.getStory();
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const getLoginUserId = (req) => Number(req.checkAccessToken?.id);

export const createStory = async (req, res) => {
    try {
        const userId = getLoginUserId(req);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ message: 'User đăng nhập không hợp lệ' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Bạn cần chọn một ảnh story' });
        }

        const story = await storyService.createStory(userId, req.file);
        return res.status(201).json({ message: 'Đăng story thành công', story });
    } catch (error) {
        console.error('Error creating story:', error);
        return res.status(500).json({ message: error.message || 'Không thể đăng story' });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const storyId = Number(req.params.id);
        const userId = getLoginUserId(req);

        if (!Number.isInteger(storyId) || storyId <= 0) {
            return res.status(400).json({ message: 'Story id không hợp lệ' });
        }

        const story = await storyService.deleteStory(storyId, userId);

        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy story hoặc bạn không có quyền xóa' });
        }

        return res.status(200).json({ message: 'Đã xóa story', story });
    } catch (error) {
        console.error('Error deleting story:', error);
        return res.status(500).json({ message: error.message || 'Không thể xóa story' });
    }
};

export const deleteExpiredStories = async (_req, res) => {
    try {
        const stories = await storyService.deleteExpiredStories();
        return res.status(200).json({ deletedCount: stories.length });
    } catch (error) {
        console.error('Error deleting expired stories:', error);
        return res.status(500).json({ message: error.message || 'Không thể dọn story hết hạn' });
    }
};
