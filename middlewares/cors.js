import cors from "cors";

const allowedOrigins = ['http://localhost:5173']; // Thêm các origin được phép

const corsOptions = {
    origin: allowedOrigins, // Cho phép các origin cụ thể
    credentials: true, // Cần thiết khi sử dụng cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie','Origin'], // Headers được phép
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
