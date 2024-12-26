import express from "express";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import cors from "cors"; // Import middleware cors

// Load environment variables
config();

// Tạo instance của Express
const app = express();
const sql = neon(process.env.DATABASE_URL);

// Cấu hình CORS cho hai domain cụ thể
const allowedOrigins = [
  "https://pac-pac-backend.vercel.app",
  "http://localhost:5173"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};

app.use(cors(corsOptions)); // Áp dụng middleware cors

// Định nghĩa API GET /list
app.get("/list", async (req, res) => {
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

app.get("/story", async (req, res) => {
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

app.get("/comment", async (req, res) => {
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

app.get("/user", async (req, res) => {
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
