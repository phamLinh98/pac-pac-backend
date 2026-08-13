const rawUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8080";
export const authServiceBaseUrl = rawUrl.replace(/\/$/, "");

const configuredTimeout = Number(process.env.AUTH_SERVICE_TIMEOUT_MS ?? 90_000);
export const authServiceTimeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : 90_000;
