import { timingSafeEqual } from "node:crypto";

const safeEqual = (left, right) => {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length === b.length && timingSafeEqual(a, b);
};

export const checkInternalService = (req, res, next) => {
  const bearer = req.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const supplied = req.get("x-service-api-key") || bearer;
  const expectedSecrets = [process.env.INTERNAL_SERVICE_API_KEY, process.env.CRON_SECRET].filter(Boolean);
  if (!expectedSecrets.some((secret) => safeEqual(supplied, secret))) {
    return res.status(401).json({ message: "Unauthorized service" });
  }
  return next();
};
