import * as userService from '../services/userService.js';

export const getUser = async (req, res) => {
    try {
        // Query dữ liệu từ bảng "user"
        const result = await userService.getUser();
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}