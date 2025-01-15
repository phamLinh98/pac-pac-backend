import { envConfig } from "../configs/envConfig.js";
import jwt, { decode } from 'jsonwebtoken';
import * as userService from '../services/userService.js';

// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
  const accessToken = req.signedCookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: "Bạn chưa được cấp quyền truy cập hoặc quyền truy cập bị từ chối" });
  }

  const userLogin = jwt.verify(accessToken, envConfig.accessSecretKey);

  if (!userLogin.id) {
    return res.status(403).json({ error: 'User đăng nhập không hợp lệ, vui lòng kiểm tra lại' });
  }
  next();
};
