// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
  const accessToken = req.signedCookies ? req.signedCookies.accessToken : undefined;
  console.log('accessToken', req.signedCookies.accessToken);
  if (!accessToken) {
    return res.status(404).json({ error: "AccessToken không tồn tại, quyền truy cập bị từ chối" });
  }
  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      console.error('Token không hợp lệ:', err.message);
      return res.status(403).json({ error: "Token không hợp lệ, quyền truy cập bị từ chối" });
    }
    // Nếu token hợp lệ, thêm thông tin user vào req
    req.user = decoded; // decoded chứa payload từ token
    next(); // Tiếp tục xử lý request
  });
};
