import { authServiceBaseUrl, authServiceTimeoutMs } from "../configs/authServiceConfig.js";

const expiredAuthCookies = () => [
  "accessToken=; Path=/; HttpOnly; Max-Age=0; SameSite=None; Secure",
  "refreshToken=; Path=/; HttpOnly; Max-Age=0; SameSite=None; Secure",
];

const forward = (method, path, { clearCookies = false } = {}) => async (req, res) => {
  try {
    const upstream = await fetch(`${authServiceBaseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json", ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}) },
      body: JSON.stringify(req.body ?? {}),
      signal: AbortSignal.timeout(authServiceTimeoutMs),
    });
    for (const cookie of upstream.headers.getSetCookie?.() ?? []) res.append("set-cookie", cookie);
    if (clearCookies) for (const cookie of expiredAuthCookies()) res.append("set-cookie", cookie);
    const body = await upstream.text();
    return res.status(upstream.status).type(upstream.headers.get("content-type") ?? "application/json").send(body);
  } catch (error) {
    console.error("Authentication service error:", error);
    if (clearCookies) for (const cookie of expiredAuthCookies()) res.append("set-cookie", cookie);
    return res.status(503).json({ message: "Authentication service is unavailable" });
  }
};

export const login = forward("POST", "/api/v1/auth/login");
export const register = forward("POST", "/api/v1/auth/register");
export const logout = forward("POST", "/api/v1/auth/logout", { clearCookies: true });
export const refresh = forward("POST", "/api/v1/auth/refresh");
export const updateAccount = forward("PATCH", "/api/v1/auth/me");
