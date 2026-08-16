import { waitUntil } from "@vercel/functions";
import { authServiceBaseUrl, authServiceTimeoutMs } from "../configs/authServiceConfig.js";

const expiredAuthCookies = () => {
  const securityAttributes = process.env.VERCEL || process.env.NODE_ENV === "production"
    ? "SameSite=None; Secure"
    : "SameSite=Lax";

  return ["accessToken", "refreshToken"].map(
    (name) => `${name}=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${securityAttributes}`,
  );
};

const forward = (method, path) => async (req, res) => {
  try {
    const upstream = await fetch(`${authServiceBaseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json", ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}) },
      body: JSON.stringify(req.body ?? {}),
      signal: AbortSignal.timeout(authServiceTimeoutMs),
    });
    for (const cookie of upstream.headers.getSetCookie?.() ?? []) res.append("set-cookie", cookie);
    const body = await upstream.text();
    return res.status(upstream.status).type(upstream.headers.get("content-type") ?? "application/json").send(body);
  } catch (error) {
    console.error("Authentication service error:", error);
    return res.status(503).json({ message: "Authentication service is unavailable" });
  }
};

const revokeRefreshToken = async (req) => {
  const upstream = await fetch(`${authServiceBaseUrl}/api/v1/auth/logout`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}) },
    body: JSON.stringify(req.body ?? {}),
    signal: AbortSignal.timeout(authServiceTimeoutMs),
  });

  // Consume the response so the request is fully completed before Vercel
  // considers the background task finished.
  await upstream.arrayBuffer();
  if (!upstream.ok) throw new Error(`Authentication logout returned ${upstream.status}`);
};

export const login = forward("POST", "/api/v1/auth/login");
export const register = forward("POST", "/api/v1/auth/register");
export const logout = (req, res) => {
  const revocation = revokeRefreshToken(req).catch((error) => {
    console.error("Refresh token revocation error:", error);
  });

  // Keep revocation alive on Vercel without making the browser wait for Neon.
  try {
    waitUntil(revocation);
  } catch {
    // Local Express has no Vercel request context. The promise is already
    // running and may finish normally while the local process stays alive.
  }

  for (const cookie of expiredAuthCookies()) res.append("set-cookie", cookie);
  return res.status(200).json({ message: "Logout successful" });
};
export const refresh = forward("POST", "/api/v1/auth/refresh");
export const updateAccount = forward("PATCH", "/api/v1/auth/me");
