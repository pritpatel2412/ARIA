import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env["SESSION_SECRET"] ?? "aria-saas-secret-key-change-in-prod";
const KEY = scryptSync(SECRET, "aria-api-keys-v1", 32);

export function encryptKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptKey(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted key format");
  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}

export function maskKey(plaintext: string): string {
  if (plaintext.length <= 8) return "sk-" + "•".repeat(8);
  return plaintext.slice(0, 6) + "•".repeat(8) + plaintext.slice(-4);
}
