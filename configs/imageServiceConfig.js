import "dotenv/config";

const rawUrl = process.env.IMAGE_SERVICE_URL || "http://localhost:8000";
const timeout = Number(process.env.IMAGE_SERVICE_TIMEOUT_MS ?? 90_000);

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET là bắt buộc để gọi image service");
}

export const imageServiceConfig = {
  baseUrl: rawUrl.replace(/\/$/, ""),
  internalToken: process.env.JWT_ACCESS_SECRET,
  timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 90_000,
};
