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

// Chạy server trên port 3000
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
