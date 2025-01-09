// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
    const accessToken = req.signedCookies?.accessToken;
  
    if (!accessToken) {
      return res.status(401).json({ error: "Không có AccessToken, quyền truy cập bị từ chối" });
    }
    next();
  };