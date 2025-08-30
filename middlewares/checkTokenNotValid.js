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

  try {
    // Thử verify accessToken
    const checkAccessToken = jwt.verify(accessToken, envConfig.accessSecretKey);
    req.checkAccessToken = checkAccessToken;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // AccessToken hết hạn, thử sử dụng refreshToken để cấp token mới
      try {
        // Xác thực refreshToken và lấy thông tin user
        const decoded = jwt.verify(refreshToken, envConfig.refeshSecretKey);
        
        // Cấp phát accessToken mới
        const { id, name, email, avatar, namecode, friends } = decoded;
        const newAccessToken = jwt.sign(
          { id, name, email, avatar, namecode, friends },
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
        
        // Cập nhật token mới cho request hiện tại
        req.checkAccessToken = jwt.verify(newAccessToken, envConfig.accessSecretKey);
      } catch (refreshError) {
        if (refreshError.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'RefreshToken đã hết hạn, vui lòng đăng nhập lại' });
        }
        return res.status(500).json({ message: 'Lỗi xử lý refreshToken: ' + refreshError.message });
      }
    } else {
      return res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
  }

  // Kiểm tra xem token có chứa thông tin user id không
  if (!req.checkAccessToken || !req.checkAccessToken.id) {
    return res.status(403).json({ error: 'User đăng nhập không hợp lệ, vui lòng kiểm tra lại' });
  }
  next();
};
