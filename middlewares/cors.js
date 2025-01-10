import cors from "cors";

const allowedOrigins = [
    "https://pac-pac-backend.vercel.app",
    "http://localhost:5173/login",
    "http://localhost:5173",
    "http://localhost:3000"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;