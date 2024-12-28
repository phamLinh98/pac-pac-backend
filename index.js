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

// Chạy server trên port 3000
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
