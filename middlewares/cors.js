import cors from "cors";

const allowedOrigins = ['http://localhost:5173']; // Thêm các origin được phép

const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) { // cho phép các request không có origin ( ví dụ: server to server request)
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }, 
    credentials: true, // Cần thiết khi sử dụng cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie','Origin'], // Headers được phép
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;