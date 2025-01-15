import cors from "cors";

const allowedOrigins = 'http://localhost:5173'

const corsOptions = {
    origin: allowedOrigins,
    credentials: true
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;