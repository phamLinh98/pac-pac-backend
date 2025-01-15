import cors from "cors";

const allowedOrigins = ['http://localhost:5173', 'https://pac-pac-backend.vercel.app']; // Thêm các origin được phép

const corsOptions = {
    origin: allowedOrigins, // Cho phép các origin cụ thể
    credentials: true, // Cần thiết khi sử dụng cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'], // Headers được phép
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
