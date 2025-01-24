import { envConfig } from "../configs/envConfig.js";
import jwt, { decode } from 'jsonwebtoken';
import * as userService from '../services/userService.js';

// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
  const accessToken = req.signedCookies?.accessToken;
  const refreshToken = req.signedCookies?.refreshToken;

  if (!accessToken) {
    return res.status(401).json({ error: "Bạn chưa được cấp quyền truy cập hoặc quyền truy cập bị từ chối" });
  }

  req.userLogin = jwt.verify(accessToken, envConfig.accessSecretKey);

  const now = Date.now() / 1000;
  // if token is expired then check refresh token
  if (req.userLogin.exp < now) {
    const userLogin = jwt.verify(refreshToken, envConfig.refreshSecretKey);
    if (!userLogin.id) {
      return res.status(403).json({ error: 'User đăng nhập không hợp lệ, vui lòng kiểm tra lại' });
    }

    req.userLogin = userLogin;
    res.cookie('accessToken', result.accessToken, {
        maxAge: 60 * 60 * 1000,  // 1h
        httpOnly: true,
        signed: true,
        path: '/',
        sameSite: 'none',
        secure: true // Important when using sameSite: 'none'
    });

    return res.status(200).json({ message: 'Login successful', token: result.tokenForClient });
  }

  if (!req.userLogin.id) {
    return res.status(403).json({ error: 'User đăng nhập không hợp lệ, vui lòng kiểm tra lại' });
  }
  next();
};
