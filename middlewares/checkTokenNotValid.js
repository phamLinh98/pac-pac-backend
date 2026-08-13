import jwt from "jsonwebtoken";
import { tokenVerificationConfig } from "../configs/tokenVerificationConfig.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
};

export const checkTokenMiddleware = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken ?? getBearerToken(req);
  if (!accessToken) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập" });
  }

  try {
    req.checkAccessToken = jwt.verify(accessToken, tokenVerificationConfig.accessSecret);
  } catch (error) {
    return res.status(401).json({
      message: error?.name === "TokenExpiredError" ? "Phiên đăng nhập đã hết hạn" : "Access token không hợp lệ",
    });
  }

  if (!Number.isInteger(Number(req.checkAccessToken?.id))) {
    return res.status(401).json({ message: "User đăng nhập không hợp lệ" });
  }

  return next();
};
