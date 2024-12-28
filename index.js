import express from "express";
import * as listController from './controllers/listController.js';
import sql from "./configs/db.js";
import corsMiddleware from "./middlewares/cors.js";
import router from "./routers/router.js";

// Tạo instance của Express
const app = express();

app.use(corsMiddleware); // Áp dụng middleware cors

// Định nghĩa API GET /list
app.use(router);

app.get("/comment", async (req, res) => {
    try {
        // Query dữ liệu từ bảng comment
        const result = await sql(`SELECT * FROM comment`);

        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/user", async (req, res) => {
    try {
        // Query dữ liệu từ bảng user
        const result = await sql(`SELECT * FROM "public"."user"`);

        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/comment/:id", async (req, res) => {
    try {
        const listId = req.params.id;

        // Kiểm tra xem id có hợp lệ hay không
        if (!listId) {
            return res.status(400).json({ error: "Missing id parameter" });
        }
        // Query dữ liệu từ bảng comment, sử dụng tham số
        const result = await sql(`
          SELECT c.*
          FROM comment c
          JOIN list l ON c.post_id = l.id
          WHERE l.id = ${listId};
        `);
        // Kiểm tra xem có dữ liệu trả về hay không
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "No comments found for this list id" });
        }
        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Chạy server trên port 3000
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
