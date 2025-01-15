import { envConfig } from "../configs/envConfig";

// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
  const accessToken = req.signedCookies ? req.signedCookies.accessToken : undefined;
  console.log('accessToken', req.signedCookies.accessToken);
  if (!accessToken) {
    return res.status(401).json({ error: "AccessToken không tồn tại, quyền truy cập bị từ chối" });
  }
  // jwt.verify(accessToken, envConfig.accessToken, async (err, decoded) => {
  //   if (err) {
  //     return res.status(403).json({ error: 'Token không hợp lệ, quyền truy cập bị từ chối' });
  //   }
  //   // // Kiểm tra userId có tồn tại trong database
  //   // const user = await User.findById(decoded.userId);
  //   // if (!user) {
  //   //   return res.status(403).json({ error: 'User không tồn tại, quyền truy cập bị từ chối' });
  //   // }
  //   req.user = decoded; // Gắn user vào req để sử dụng ở controller
  //   next();
  // });
  next();
};
