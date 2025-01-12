// tokenMiddleware.js
import jwt from 'jsonwebtoken';
import { envConfig } from '../configs/envConfig.js';

export const checkTokenMiddleware = (req, res, next) => {
  const accessToken = req.signedCookies?.accessToken;
  console.log('accessToken', accessToken)
  if (!accessToken) {
    return res.status(401).json({ error: "Không có AccessToken, quyền truy cập bị từ chối" });
  }

  jwt.verify(accessToken, envConfig.accessSecretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Access token không hợp lệ' });
    }
    req.user = decoded; // Lưu thông tin user vào req.user
    next();
  });
};