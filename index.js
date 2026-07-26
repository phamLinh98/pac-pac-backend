import express from "express";
import corsMiddleware from "./middlewares/cors.js";
import router from "./routers/router.js";
import cookieParser from 'cookie-parser';
import { envConfig } from "./configs/envConfig.js";
import multer from "multer";
import path from "path";

// Tạo instance của Express
const app = express();

app.use(express.json());

app.use(corsMiddleware); // Áp dụng middleware cors

app.use(cookieParser(envConfig.accessSecretKey));

// Định nghĩa API GET /list
app.use(router);

app.use(
  "/uploads",
  express.static(
    path.resolve(process.cwd(), "uploads")
  )
);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message:
          "Dung lượng mỗi ảnh không được vượt quá 5 MB.",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message:
          "Mỗi bài viết chỉ được upload tối đa 10 ảnh.",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message:
        error.message ||
        "Upload hình ảnh thất bại.",
    });
  }
});

// Lấy cổng từ biến môi trường hoặc mặc định là 3000
const PORT = process.env.PORT || 4000;

// Chạy server trên cổng được cấu hình
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
