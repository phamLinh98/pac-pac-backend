// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.status(404).json({ error: "AccessToken không tồn tại, quyền truy cập bị từ chối" });
  }
  next(); // Nếu có accessToken, cho phép request tiếp tục
};
