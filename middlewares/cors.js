import cors from "cors";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:4000",
  "https://pac-pac-sn.vercel.app",
  "https://master.d34r0uf6wfpt35.amplifyapp.com",
]);

const corsOptions = {
  origin(origin, callback) {
    /*
     * Cho phép request không có Origin:
     * curl, Postman, server-to-server...
     */
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(
        `Origin ${origin} is not allowed by CORS`
      )
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  exposedHeaders: [
    "Content-Length",
    "X-JSON-Response-Body",
  ],

  optionsSuccessStatus: 204,
};

const corsMiddleware =
  cors(corsOptions);

export default corsMiddleware;
