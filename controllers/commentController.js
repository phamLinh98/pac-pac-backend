import * as commentService from '../services/commentService.js'

export const getComment = async (req, res) => {
    try {
        // Query dữ liệu từ bảng "comment"
        const result = await commentService.getComment();
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}