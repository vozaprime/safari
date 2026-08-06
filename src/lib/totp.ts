import crypto from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "SAFARI CONSULTING";
const BACKUP_CODE_COUNT = 10;

function buildTotp(secretBase32: string, email: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

/** Fresh base32 TOTP secret (160-bit). */
export function generateTwoFactorSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/** otpauth:// provisioning URI for authenticator apps. */
export function otpauthUri(secretBase32: string, email: string): string {
  return buildTotp(secretBase32, email).toString();
}

/** Renders the provisioning URI as a data-URL PNG (generated locally, secret never leaves the server). */
export function otpauthQrDataUrl(secretBase32: string, email: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri(secretBase32, email), { margin: 1, width: 220 });
}

/** Validates a 6-digit token, tolerating ±1 time-step of clock skew. */
export function verifyTwoFactorToken(secretBase32: string, token: string): boolean {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const delta = buildTotp(secretBase32, "").validate({ token: clean, window: 1 });
  return delta !== null;
}

const normalizeBackup = (code: string) => code.replace(/[\s-]/g, "").toUpperCase();
const hashBackup = (code: string) =>
  crypto.createHash("sha256").update(normalizeBackup(code)).digest("hex");

/** One-time recovery codes. Returns plaintext (shown once) and sha256 hashes (stored). */
export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // 10 hex chars → grouped as XXXXX-XXXXX for readability
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return { plain, hashed: plain.map(hashBackup) };
}

/**
 * If `code` matches an unused backup hash, returns the remaining hashes as a JSON
 * string (the used code removed). Returns null when the code is invalid.
 */
export function consumeBackupCode(hashedJson: string | null | undefined, code: string): string | null {
  if (!hashedJson) return null;
  let hashes: string[];
  try {
    hashes = JSON.parse(hashedJson);
  } catch {
    return null;
  }
  if (!Array.isArray(hashes)) return null;
  const target = hashBackup(code);
  const idx = hashes.indexOf(target);
  if (idx === -1) return null;
  hashes.splice(idx, 1);
  return JSON.stringify(hashes);
}

/** How many unused backup codes remain. */
export function backupCodesRemaining(hashedJson: string | null | undefined): number {
  if (!hashedJson) return 0;
  try {
    const arr = JSON.parse(hashedJson);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}
