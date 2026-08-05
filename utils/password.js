import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const PREFIX = "scrypt";

const safeEqualText = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  return leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const isPasswordHash = (value) =>
  typeof value === "string" && value.startsWith(`${PREFIX}$`);

export const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(String(password), salt, KEY_LENGTH);
  return `${PREFIX}$${salt}$${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password, storedPassword) => {
  if (!isPasswordHash(storedPassword)) {
    return safeEqualText(password, storedPassword ?? "");
  }

  const [, salt, storedKeyHex] = storedPassword.split("$");
  if (!salt || !storedKeyHex) return false;

  const storedKey = Buffer.from(storedKeyHex, "hex");
  const derivedKey = await scrypt(String(password), salt, storedKey.length);

  return storedKey.length === derivedKey.length &&
    crypto.timingSafeEqual(storedKey, derivedKey);
};
