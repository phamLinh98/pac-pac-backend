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
            return res.status(200).json([]);
        }
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const addComment = async (req, res) => {
    try {
        const userId = Number(req.checkAccessToken?.id);
        const listId = Number(req.params.listId);
        const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

        if (!Number.isInteger(userId) || !Number.isInteger(listId) || listId <= 0) {
            return res.status(400).json({ message: 'User hoặc bài viết không hợp lệ' });
        }
        if (!content || content.length > 2000) {
            return res.status(400).json({ message: 'Bình luận phải từ 1 đến 2000 ký tự' });
        }

        // Thêm comment vào cơ sở dữ liệu
        const newComment = await commentService.addComment(userId, listId, content);

        // Trả về dữ liệu comment mới dưới dạng JSON
        res.status(200).json(newComment);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error adding comment to the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

