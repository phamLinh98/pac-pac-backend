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

export const loginUserByEmailAndPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const result = await userService.loginUserByEmailAndPassword(email, password);

        if (result) {
            res.cookie('accessToken', result.accessToken, {
                maxAge: 15000,
                httpOnly: true, // Cookie chỉ truy cập được bởi server
                signed: true,   // Ký cookie
            });
            res.cookie('refeshToken', result.refeshToken, {
                maxAge: 1500000,
                httpOnly: true, // Cookie chỉ truy cập được bởi server
                signed: true,   // Ký cookie
            });
            res.send('JWT đã được lưu vào cookie!');
        } else {
            return res.status(401).json({ error: "Invalid email or password" }); // 401 Unauthorized
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal Server Error" }); // 500 Internal Server Error
    }
}