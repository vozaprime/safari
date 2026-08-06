import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "sc_session";
const PENDING_2FA_COOKIE = "sc_2fa";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type Role = "admin" | "editor";
export type SessionPayload = { userId: number; email: string; name: string; role: Role; tv: number };

export async function createSession(payload: SessionPayload, remember = false) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 2;
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(remember ? "30d" : "2d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
}

/** Reads the cookie and validates the signature only (cheap, no DB). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Validates the signature AND that the token version still matches the user
 * (so "sign out everywhere" and role changes take effect immediately). */
export async function getVerifiedSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.tokenVersion !== session.tv) return null;
  // reflect current role/name from DB
  return { ...session, role: (user.role as Role) ?? "admin", name: user.name, email: user.email };
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/* ---------------- Pending two-factor challenge ----------------
 * After a correct password, users with 2FA enabled get a short-lived
 * marker cookie (NOT a real session) while they enter their TOTP code. */

type Pending2FA = { uid: number; remember: boolean };

export async function createPending2FA(uid: number, remember: boolean) {
  const token = await new SignJWT({ uid, remember, purpose: "2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(PENDING_2FA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
}

export async function getPending2FA(): Promise<Pending2FA | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_2FA_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "2fa" || typeof payload.uid !== "number") return null;
    return { uid: payload.uid, remember: Boolean(payload.remember) };
  } catch {
    return null;
  }
}

export async function clearPending2FA() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_2FA_COOKIE);
}

export const SESSION_COOKIE = COOKIE_NAME;
