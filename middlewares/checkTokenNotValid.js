import { envConfig } from "../configs/envConfig.js";
import jwt from 'jsonwebtoken';

// tokenMiddleware.js
// Helper function to extract token from Authorization header
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7); // Remove 'Bearer ' prefix
  }
  return null;
};

export const checkTokenMiddleware = (req, res, next) => {
  // Try to get accessToken from cookies first, then from Authorization header
  let accessToken = req.signedCookies?.accessToken;
  let refreshToken = req.signedCookies?.refreshToken;
  
  if (!accessToken) {
    accessToken = getTokenFromHeader(req);
  }

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
          { expiresIn: '1h' }
        );

        // Lưu accessToken mới vào cookie
        res.cookie('accessToken', newAccessToken, {
          maxAge: 60 * 60 * 1000,  // 1 giờ
          httpOnly: true,
          signed: true,
          path: '/',
          sameSite: 'none',
          secure: true // Important when using sameSite: 'none'
        });
        
        // Cập nhật token mới cho request hiện tại
        req.checkAccessToken = jwt.verify(newAccessToken, envConfig.accessSecretKey);
        return next();
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
