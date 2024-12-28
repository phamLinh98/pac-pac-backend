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

export const getCommentByListId = async (req, res) => {
    try {
        const listId = req.params.id;

        // Kiểm tra xem id có hợp lệ hay không
        if (!listId) {
            return res.status(400).json({ error: "Missing id parameter" });
        }
        // Query dữ liệu từ bảng comment, sử dụng tham số
        const result = await commentService.getCommentByListId(listId);
        // Kiểm tra xem có dữ liệu trả về hay không
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "No comments found for this list id" });
        }
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};