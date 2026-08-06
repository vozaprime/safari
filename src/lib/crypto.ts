import crypto from "crypto";

function key() {
  const secret = process.env.SESSION_SECRET || "safari-consulting-fallback-secret";
  return crypto.scryptSync(secret, "sc-smtp-salt", 32);
}

/** AES-256-GCM encrypt. Returns "iv:tag:ciphertext" in base64, prefixed with enc: */
export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith("enc:")) return stored; // legacy plaintext
  try {
    const [, ivB64, tagB64, dataB64] = stored.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function isEncrypted(stored: string): boolean {
  return stored.startsWith("enc:");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
