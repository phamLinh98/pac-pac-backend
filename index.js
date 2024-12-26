import express from "express";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

// Load environment variables
config();

// Tạo instance của Express
const app = express();
const sql = neon(process.env.DATABASE_URL);

// Định nghĩa API GET /list
app.get("/api/list", async (req, res) => {
    try {
        // Query dữ liệu từ bảng "list"
        const result = await sql`SELECT * FROM list`;

        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/api/story", async (req, res) => {
    try {
        // Query dữ liệu từ bảng story
        const result = await sql`SELECT * FROM story`;

        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/api/comment", async (req, res) => {
    try {
        // Query dữ liệu từ bảng comment
        const result = await sql`SELECT * FROM comment`;

        // Trả về dữ liệu dưới dạng JSON
        res.status(200).json(result);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error("Error querying the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/api/user", async (req, res) => {
    try {
        // Query dữ liệu từ bảng user
        const result = await sql`select * from "public"."user"`;

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
