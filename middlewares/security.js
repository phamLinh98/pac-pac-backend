const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:4000",
  "https://pac-pac-sn.vercel.app",
  "https://master.d34r0uf6wfpt35.amplifyapp.com",
]);

export const securityHeaders = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
};

export const validateRequestOrigin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.get("origin");
  if (!origin || allowedOrigins.has(origin)) return next();

  return res.status(403).json({ message: "Request origin không được phép" });
};

export const createRateLimiter = ({ windowMs, max, message }) => {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const current = requests.get(key);

    if (requests.size > 10000) {
      for (const [storedKey, value] of requests) {
        if (value.resetAt <= now) requests.delete(storedKey);
      }
      if (requests.size > 10000) requests.delete(requests.keys().next().value);
    }

    if (!current || current.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ message });
    }

    return next();
  };
};

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Bạn gửi quá nhiều request, vui lòng thử lại sau",
});

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Đăng nhập quá nhiều lần, vui lòng thử lại sau 15 phút",
});

export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Đăng ký quá nhiều tài khoản, vui lòng thử lại sau",
});

export const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Upload quá nhiều lần, vui lòng thử lại sau",
});
