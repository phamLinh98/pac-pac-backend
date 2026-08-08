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
        const result = await commentService.getCommentByListId(listId, Number(req.checkAccessToken?.id));
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
        const parentCommentId = Number(req.body?.parentCommentId) || null;
        let mentionUserIds = [];
        try { mentionUserIds = JSON.parse(req.body?.mentionUserIds || '[]'); } catch { mentionUserIds = []; }
        mentionUserIds = [...new Set((Array.isArray(mentionUserIds) ? mentionUserIds : []).map(Number)
            .filter((id) => Number.isInteger(id) && id > 0))].slice(0, 20);

        if (!Number.isInteger(userId) || !Number.isInteger(listId) || listId <= 0) {
            return res.status(400).json({ message: 'User hoặc bài viết không hợp lệ' });
        }
        if ((!content && !req.file) || content.length > 2000) {
            return res.status(400).json({ message: 'Bình luận cần nội dung hoặc ảnh và tối đa 2000 ký tự' });
        }

        // Thêm comment vào cơ sở dữ liệu
        const newComment = await commentService.addComment(userId, listId, content, req.file, parentCommentId, mentionUserIds);

        // Trả về dữ liệu comment mới dưới dạng JSON
        res.status(200).json(newComment);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error adding comment to the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const toggleCommentLike = async (req, res) => {
    try {
        const result = await commentService.toggleCommentLike(Number(req.params.id), Number(req.checkAccessToken?.id));
        return result ? res.json(result) : res.status(404).json({ message: 'Không tìm thấy bình luận' });
    } catch (error) { console.error(error); return res.status(500).json({ message: 'Không thể thích bình luận' }); }
};

export const updateComment = async (req, res) => {
    try {
        const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
        if (content.length > 2000) return res.status(400).json({ message: 'Bình luận tối đa 2000 ký tự' });
        const result = await commentService.updateComment(Number(req.params.id), Number(req.checkAccessToken?.id), content);
        return result ? res.json(result) : res.status(404).json({ message: 'Không tìm thấy hoặc không có quyền sửa bình luận' });
    } catch (error) { console.error(error); return res.status(500).json({ message: 'Không thể sửa bình luận' }); }
};

export const deleteComment = async (req, res) => {
    try {
        const result = await commentService.deleteComment(Number(req.params.id), Number(req.checkAccessToken?.id));
        return result ? res.json({ message: 'Đã xóa bình luận', id: result.id }) : res.status(404).json({ message: 'Không tìm thấy hoặc không có quyền xóa bình luận' });
    } catch (error) { console.error(error); return res.status(500).json({ message: 'Không thể xóa bình luận' }); }
};
