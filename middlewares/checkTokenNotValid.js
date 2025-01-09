// tokenMiddleware.js
export const checkTokenMiddleware = (req, res, next) => {
    const accessToken = req.signedCookies?.accessToken;
  
    if (!accessToken) {
      return res.status(401).json({ error: "No access token, authorization denied" });
    }
    next();
  };