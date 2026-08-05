import express from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";

import corsMiddleware from "./middlewares/cors.js";
import router from "./routers/router.js";
import { envConfig } from "./configs/envConfig.js";
import { apiLimiter, securityHeaders, validateRequestOrigin } from "./middlewares/security.js";

const app = express();

/*
 * CORS nên được đặt trước parser và router để tất cả response,
 * bao gồm preflight OPTIONS và error response, đều có CORS header.
 */
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(validateRequestOrigin);
app.use(apiLimiter);

/*
 * cors() đã tự xử lý OPTIONS khi dùng app.use().
 * Có thể thêm dòng này để thể hiện rõ preflight.
 */
app.options("*", corsMiddleware);

app.use(express.json({ limit: "100kb" }));

app.use(
  express.urlencoded({
    extended: false,
    limit: "100kb",
  })
);

app.use(
  cookieParser(
    envConfig.accessSecretKey
  )
);

/*
 * Route API
 */
app.use("/", router);

/*
 * Chỉ cần giữ route này nếu vẫn còn ảnh local cũ.
 * Ảnh Neon Storage mới không cần route /uploads.
 */
app.use(
  "/uploads",
  express.static(
    path.resolve(
      process.cwd(),
      "uploads"
    )
  )
);

/*
 * Xử lý Multer error
 */
app.use((error, _req, res, _next) => {
  console.error("Application error:", error);

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

  /*
   * Không nên trả 400 cho toàn bộ error.
   * Các lỗi không xác định là lỗi server 500.
   */
  return res.status(
    error?.statusCode ?? 500
  ).json({
    message:
      error?.message ||
      "Internal Server Error",
  });
});

/*
 * Vercel cần export Express app.
 */
export default app;

/*
 * Chỉ listen khi chạy local.
 *
 * Không nên dựa vào NODE_ENV vì bạn đang đặt
 * NODE_ENV=production trong file .env local.
 */
if (!process.env.VERCEL) {
  const PORT =
    process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(
      `Server running at http://localhost:${PORT}`
    );
  });
}
