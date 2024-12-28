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