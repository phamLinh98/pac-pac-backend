import { timingSafeEqual } from "node:crypto";

const safeEqual = (left, right) => {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length === b.length && timingSafeEqual(a, b);
};

export const checkInternalService = (req, res, next) => {
  const bearer = req.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const supplied = req.get("x-service-api-key") || bearer;
  const expected = process.env.INTERNAL_SERVICE_API_KEY || process.env.CRON_SECRET || "";
  if (!expected || !safeEqual(supplied, expected)) return res.status(401).json({ message: "Unauthorized service" });
  return next();
};
