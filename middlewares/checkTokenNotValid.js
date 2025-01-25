import { envConfig } from "../configs/envConfig.js";
import jwt from 'jsonwebtoken';

// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
  const accessToken = req.signedCookies?.accessToken;
  const refreshToken = req.signedCookies?.refreshToken;

  if (!accessToken) {
    return res.status(401).json({ error: "Bạn chưa được cấp quyền truy cập hoặc quyền truy cập bị từ chối" });
  }

  if (!refreshToken) {
    return res.status(402).json({ message: 'Bạn chưa có refeshToken, yêu cầu đăng nhập lại' });
  }

  const checkAccessToken = jwt.verify(accessToken, envConfig.accessSecretKey);

  req.checkAccessToken = checkAccessToken;

  if (checkAccessToken.exp < Math.floor(Date.now() / 1000)); {
    try {
      // TODO1: Kiểm tra xem refreshToken có trong cookie hay không
      const refreshToken = req.signedCookies.refreshToken;
      if (!refreshToken) {
        return res.status(405).json({ message: 'Bạn chưa có refeshToken, yêu cầu đăng nhập lại' });
      }
      // Xác thực refreshToken và lấy thông tin user
      jwt.verify(refreshToken, envConfig.refeshSecretKey, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: 'Refresh token không hợp lệ' });
        }
        // TODO2: Cấp phát accessToken mới
        const { id, name, email, avatar, namecode, friends, iat } = decoded
        const newAccessToken = jwt.sign(
          { id, name, email, avatar, namecode, friends, iat },
          envConfig.accessSecretKey,
          { expiresIn: '1h' } // Access token có thời gian sống 1h
        );

        // Lưu accessToken mới vào cookie
        res.cookie('accessToken', newAccessToken, {
          maxAge: 60 * 60 * 1000,  // 1h
          httpOnly: true,
          signed: true,
          path: '/',
          sameSite: 'none',
          secure: true // Important when using sameSite: 'none'
        });
      });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
  }

  if (!checkAccessToken.id) {
    return res.status(403).json({ error: 'User đăng nhập không hợp lệ, vui lòng kiểm tra lại' });
  }
  next();
};
