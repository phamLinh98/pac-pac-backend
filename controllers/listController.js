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