import * as listService from '../services/listService.js'

export const getList = async (req, res) => {
    try {
        // Query dữ liệu từ bảng "list"
        const result = await listService.getList();
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getListStatusOfOneUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Kiểm tra xem id có hợp lệ hay không
        if (!userId) {
            return res.status(400).json({ error: "Missing id parameter" });
        }
        // Query dữ liệu từ bảng comment, sử dụng tham số
        const result = await listService.getListStatusOfOneUser(userId);
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

export const getListUserStatusByUserId = async(req,res) => {
    try {
        const userId = req.params.id;

        // Kiểm tra xem id có hợp lệ hay không
        if (!userId) {
            return res.status(400).json({ error: "Missing id parameter" });
        }
        // Query dữ liệu từ bảng comment, sử dụng tham số
        const result = await listService.getListUserStatusByUserId(userId);
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

export const createNewPost = async (req, res) => {
    try {
        const { userId, content } = req.body;
        // Gọi hàm dịch vụ để tạo mới danh sách
        const newList = await listService.createNewPost(userId, content);

        // Trả về phản hồi thành công
        res.status(201).json({ message: "New list created successfully", list: newList });
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error creating new list:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}