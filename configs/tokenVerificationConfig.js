import dotenv from "dotenv";

dotenv.config();

const accessSecret = process.env.JWT_ACCESS_SECRET;

if (!accessSecret) throw new Error("JWT_ACCESS_SECRET là bắt buộc để xác minh access token");
if (process.env.NODE_ENV === "production" && accessSecret.length < 32) {
  throw new Error("JWT_ACCESS_SECRET production phải dài ít nhất 32 ký tự");
}

export const tokenVerificationConfig = { accessSecret };
