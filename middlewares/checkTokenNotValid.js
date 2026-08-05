import jwt from "jsonwebtoken";
import { envConfig } from "../configs/envConfig.js";
import { isRefreshTokenActive } from "../services/userService.js";

const cookieOptions = {
  maxAge: 60 * 60 * 1000,
  httpOnly: true,
  signed: true,
  path: "/",
  sameSite: "none",
  secure: true,
};

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
};

const createAccessToken = (decoded) => {
  const { id, name, email, avatar, namecode, list_friend_id } = decoded;
  return jwt.sign(
    { id, name, email, avatar, namecode, list_friend_id },
    envConfig.accessSecretKey,
    { expiresIn: "1h" }
  );
};

export const checkTokenMiddleware = async (req, res, next) => {
  const accessToken = req.signedCookies?.accessToken ?? getBearerToken(req);
  if (!accessToken) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập" });
  }

  try {
    req.checkAccessToken = jwt.verify(accessToken, envConfig.accessSecretKey);
  } catch (error) {
    if (error?.name !== "TokenExpiredError") {
      return res.status(401).json({ message: "Access token không hợp lệ" });
    }

    const refreshToken = req.signedCookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn" });
    }

    try {
      const decoded = jwt.verify(refreshToken, envConfig.refeshSecretKey);
      if (!(await isRefreshTokenActive(decoded.id, refreshToken))) {
        return res.status(401).json({ message: "Refresh token đã bị thu hồi" });
      }

      const newAccessToken = createAccessToken(decoded);
      res.cookie("accessToken", newAccessToken, cookieOptions);
      req.checkAccessToken = jwt.verify(newAccessToken, envConfig.accessSecretKey);
    } catch {
      return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
  }

  if (!Number.isInteger(Number(req.checkAccessToken?.id))) {
    return res.status(401).json({ message: "User đăng nhập không hợp lệ" });
  }

  return next();
};
