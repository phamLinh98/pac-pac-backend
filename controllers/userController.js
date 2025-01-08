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
                maxAge: 15 * 60 * 1000,  // 15 phút cho accessToken
                httpOnly: true,
                signed: true,
                sameSite: 'None', // Để sử dụng cookie ở môi trường khác domain
                secure: true // Chỉ gửi cookie qua HTTPS

            });
            res.cookie('refeshToken', result.refeshToken, {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày cho refresh token
                httpOnly: true,
                signed: true,
                sameSite: 'None',
                secure: true
            });
            return res.status(200).json({ message: 'Login successful' });
        } else {
            return res.status(401).json({ error: "Invalid email or password" }); // 401 Unauthorized
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal Server Error" }); // 500 Internal Server Error
    }
}

export const logoutAndRemoveAllToken = async (req, res) => {
    res.clearCookie('accessToken', {
        httpOnly: true, // Phù hợp với cách cookie được thiết lập
        signed: true,   // Đảm bảo rằng đây là cookie đã ký
    });
    res.clearCookie('refeshToken', {
        httpOnly: true, // Phù hợp với cách cookie được thiết lập
        signed: true,   // Đảm bảo rằng đây là cookie đã ký
    });
    res.send('Cookie đã được xóa!');
}