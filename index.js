import express from "express";
import corsMiddleware from "./middlewares/cors.js";
import router from "./routers/router.js";
import cookieParser from 'cookie-parser';
import { envConfig } from "./configs/envConfig.js";

// Tạo instance của Express
const app = express();

app.use(express.json());

app.use(corsMiddleware); // Áp dụng middleware cors

app.use(cookieParser(envConfig.accessSecretKey));

// Định nghĩa API GET /list
app.use(router);

// Lấy cổng từ biến môi trường hoặc mặc định là 3000
const PORT = process.env.PORT || 4000;

// Chạy server trên cổng được cấu hình
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});