const rawUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8080";
export const authServiceBaseUrl = rawUrl.replace(/\/$/, "");
