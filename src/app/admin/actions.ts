"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  getVerifiedSession,
  createPending2FA,
  getPending2FA,
  clearPending2FA,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { encryptSecret, decryptSecret, randomToken } from "@/lib/crypto";
import {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateBackupCodes,
  consumeBackupCode,
} from "@/lib/totp";
import { sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/seo";

async function requireSession() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/admin?toast=forbidden");
  return session;
}

const normalizeText = (s: string) => s.replace(/\r\n?/g, "\n");

function slugify(input: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
  return input
    .trim()
    .toLowerCase()
    .replace(/[çğıöşüİ]/g, (m) => map[m] ?? m)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/* ---------------- Auth ---------------- */

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);

  const recentFails = await prisma.loginAttempt.count({
    where: { key: { in: [email, ip] }, success: false, createdAt: { gte: windowStart } },
  });
  if (recentFails >= 8) {
    redirect("/admin/login?error=locked");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Archived (soft-disabled) accounts cannot sign in.
  const ok = user && !user.archivedAt ? await bcrypt.compare(password, user.passwordHash) : false;

  await prisma.loginAttempt.create({ data: { key: email, success: ok } });
  if (ip !== "unknown") await prisma.loginAttempt.create({ data: { key: ip, success: ok } });

  if (!user || !ok) {
    redirect("/admin/login?error=1");
  }

  // Password verified. If the account has 2FA, defer the real session until the
  // TOTP challenge is passed — only a short-lived pending marker is issued here.
  if (user.twoFactorEnabled) {
    await createPending2FA(user.id, remember);
    redirect("/admin/2fa");
  }

  await createSession(
    { userId: user.id, email: user.email, name: user.name, role: (user.role as "admin" | "editor") ?? "admin", tv: user.tokenVersion },
    remember
  );
  await logAudit(user.email, "login", "auth");
  redirect("/admin");
}

/** Step 2 of login for 2FA accounts: verify a TOTP code or a backup code. */
export async function verifyTwoFactorLoginAction(formData: FormData) {
  const pending = await getPending2FA();
  if (!pending) redirect("/admin/login?error=1");

  const code = String(formData.get("code") ?? "").trim();

  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);
  const failKey = `2fa:${pending.uid}`;
  const recentFails = await prisma.loginAttempt.count({
    where: { key: { in: [failKey, ip] }, success: false, createdAt: { gte: windowStart } },
  });
  if (recentFails >= 8) {
    await clearPending2FA();
    redirect("/admin/login?error=locked");
  }

  const user = await prisma.user.findUnique({ where: { id: pending.uid } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    await clearPending2FA();
    redirect("/admin/login?error=1");
  }

  const secret = decryptSecret(user.twoFactorSecret);
  let ok = secret ? verifyTwoFactorToken(secret, code) : false;

  // Fall back to single-use backup codes.
  if (!ok) {
    const remaining = consumeBackupCode(user.twoFactorBackupCodes, code);
    if (remaining !== null) {
      ok = true;
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorBackupCodes: remaining } });
      await logAudit(user.email, "2fa_backup_used", "auth");
    }
  }

  await prisma.loginAttempt.create({ data: { key: failKey, success: ok } });
  if (ip !== "unknown") await prisma.loginAttempt.create({ data: { key: ip, success: ok } });

  if (!ok) {
    redirect("/admin/2fa?error=1");
  }

  await clearPending2FA();
  await createSession(
    { userId: user.id, email: user.email, name: user.name, role: (user.role as "admin" | "editor") ?? "admin", tv: user.tokenVersion },
    pending.remember
  );
  await logAudit(user.email, "login", "auth");
  redirect("/admin");
}

export async function cancelTwoFactorLoginAction() {
  await clearPending2FA();
  redirect("/admin/login");
}

export async function logoutAction() {
  const session = await getVerifiedSession();
  if (session) await logAudit(session.email, "logout", "auth");
  await destroySession();
  redirect("/admin/login");
}

export async function signOutEverywhereAction() {
  const session = await requireSession();
  await prisma.user.update({ where: { id: session.userId }, data: { tokenVersion: { increment: 1 } } });
  await logAudit(session.email, "signout_all", "auth");
  await destroySession();
  redirect("/admin/login");
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireSession();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");

  if (next.length < 8) redirect("/admin/settings?toast=pwshort");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    redirect("/admin/settings?toast=pwwrong");
  }
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: await bcrypt.hash(next, 10), tokenVersion: { increment: 1 } },
  });
  await logAudit(session.email, "change_password", "user");
  // current session's tv is now stale; force re-login
  await destroySession();
  redirect("/admin/login?reset=1");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomToken(24);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await sendMail({
      to: email,
      subject: "SAFARI CONSULTING — Şifre sıfırlama",
      text: `Şifrenizi sıfırlamak için (1 saat geçerli):\n\n${SITE_URL}/admin/reset/${token}\n\nBu isteği siz yapmadıysanız yok sayabilirsiniz.`,
    });
    await logAudit(email, "reset_request", "auth");
  }
  // always report success (no user enumeration)
  redirect("/admin/login?reset=sent");
}

export async function performPasswordResetAction(token: string, formData: FormData) {
  const next = String(formData.get("new_password") ?? "");
  if (next.length < 8) redirect(`/admin/reset/${token}?toast=pwshort`);

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) redirect("/admin/login?reset=invalid");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(next, 10),
      resetToken: null,
      resetTokenExpiry: null,
      tokenVersion: { increment: 1 },
    },
  });
  await logAudit(user.email, "reset_complete", "auth");
  redirect("/admin/login?reset=done");
}

/* ---------------- Two-factor (TOTP) enrollment ---------------- */

const TWOFA_CODES_COOKIE = "sc_2fa_codes";

/** Stores freshly-generated plaintext backup codes in a short-lived encrypted
 * cookie so the settings page can display them exactly once. */
async function stashBackupCodes(plain: string[]) {
  const store = await cookies();
  store.set(TWOFA_CODES_COOKIE, encryptSecret(JSON.stringify(plain)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 15,
    path: "/",
  });
}

/** Reads and clears the one-time backup-code display cookie. */
export async function readStashedBackupCodes(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(TWOFA_CODES_COOKIE)?.value;
  if (!raw) return [];
  try {
    const codes = JSON.parse(decryptSecret(raw));
    return Array.isArray(codes) ? codes : [];
  } catch {
    return [];
  }
}

/** Begins enrollment: generates a secret + backup codes, stores them (disabled
 * until confirmed) and shows the QR. Regenerating overwrites any pending setup. */
export async function startTwoFactorSetupAction() {
  const session = await requireSession();
  const secret = generateTwoFactorSecret();
  const { plain, hashed } = generateBackupCodes();
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      twoFactorSecret: encryptSecret(secret),
      twoFactorBackupCodes: JSON.stringify(hashed),
      twoFactorEnabled: false,
    },
  });
  await stashBackupCodes(plain);
  redirect("/admin/settings?toast=2fa_setup#twofa");
}

/** Confirms enrollment by validating a code against the pending secret. */
export async function confirmTwoFactorAction(formData: FormData) {
  const session = await requireSession();
  const code = String(formData.get("code") ?? "").trim();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.twoFactorSecret) redirect("/admin/settings?toast=2fa_bad#twofa");

  const secret = decryptSecret(user.twoFactorSecret);
  if (!secret || !verifyTwoFactorToken(secret, code)) {
    redirect("/admin/settings?toast=2fa_bad#twofa");
  }

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  const store = await cookies();
  store.delete(TWOFA_CODES_COOKIE);
  await logAudit(user.email, "2fa_enabled", "user");
  redirect("/admin/settings?toast=2fa_on#twofa");
}

/** Disables 2FA on the current account (password required). */
export async function disableTwoFactorAction(formData: FormData) {
  const session = await requireSession();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/admin/settings?toast=2fa_pw#twofa");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null },
  });
  const store = await cookies();
  store.delete(TWOFA_CODES_COOKIE);
  await logAudit(user.email, "2fa_disabled", "user");
  redirect("/admin/settings?toast=2fa_off#twofa");
}

/** Admin recovery: clears another user's 2FA so they can sign in again. */
export async function disableUserTwoFactorAction(userId: number) {
  const session = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) redirect("/admin/users");
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null },
  });
  await logAudit(session.email, `2fa_reset:${target.email}`, "user");
  redirect("/admin/users?toast=2fa_reset");
}

/**
 * The per-locale URL name submitted for one language tab, normalised.
 *
 * Returns null when the field is left empty — that is the documented "fall back
 * to the record's shared slug" state, and null is also what keeps the
 * `@@unique([locale, slug])` index happy when several records have no name of
 * their own. A slug already taken by another record in the same language is
 * rejected (kept as-is) rather than allowed to blow up the save.
 */
async function localeSlugFor(
  entity: "service" | "post",
  formData: FormData,
  locale: string,
  ownerId: number
): Promise<string | null> {
  const raw = String(formData.get(`${locale}_slug`) ?? "").trim();
  if (!raw) return null;
  const slug = slugify(raw);
  if (!slug) return null;

  const clash =
    entity === "service"
      ? await prisma.serviceTranslation.findFirst({
          where: { locale, slug, NOT: { serviceId: ownerId } },
          select: { id: true },
        })
      : await prisma.postTranslation.findFirst({
          where: { locale, slug, NOT: { postId: ownerId } },
          select: { id: true },
        });
  if (clash) {
    const current =
      entity === "service"
        ? await prisma.serviceTranslation.findUnique({
            where: { serviceId_locale: { serviceId: ownerId, locale } },
            select: { slug: true },
          })
        : await prisma.postTranslation.findUnique({
            where: { postId_locale: { postId: ownerId, locale } },
            select: { slug: true },
          });
    return current?.slug ?? null;
  }
  return slug;
}

/* ---------------- Services ---------------- */

export async function updateServiceAction(serviceId: number, formData: FormData) {
  const session = await requireSession();

  const icon = String(formData.get("icon") ?? "finance");
  const image = String(formData.get("image") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);
  const visible = formData.get("visible") === "on";

  await prisma.service.update({
    where: { id: serviceId },
    data: { icon, image, order: Number.isFinite(order) ? order : 0, visible },
  });

  for (const locale of ["tr", "en", "ru"]) {
    const title = String(formData.get(`${locale}_title`) ?? "").trim();
    const summary = String(formData.get(`${locale}_summary`) ?? "").trim();
    const description = normalizeText(String(formData.get(`${locale}_description`) ?? "")).trim();
    const scopeRaw = String(formData.get(`${locale}_scope`) ?? "");
    const scope = JSON.stringify(scopeRaw.split("\n").map((l) => l.trim()).filter(Boolean));
    if (!title) continue;
    const slug = await localeSlugFor("service", formData, locale, serviceId);
    await prisma.serviceTranslation.upsert({
      where: { serviceId_locale: { serviceId, locale } },
      update: { title, summary, description, scope, slug },
      create: { serviceId, locale, title, summary, description, scope, slug },
    });
  }

  await logAudit(session.email, "update", "service", `#${serviceId}`);
  revalidatePath("/", "layout");
  redirect(`/admin/services/${serviceId}?toast=saved`);
}

export async function createServiceAction(formData: FormData) {
  const session = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  const icon = String(formData.get("icon") ?? "finance");
  if (!title) redirect("/admin/services?toast=error");

  const base = slugify(title) || "hizmet";
  let slug = base;
  let n = 1;
  while (await prisma.service.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

  const max = await prisma.service.aggregate({ _max: { order: true } });
  const service = await prisma.service.create({
    data: {
      slug,
      icon,
      order: (max._max.order ?? 0) + 1,
      visible: false,
      translations: {
        create: ["tr", "en", "ru"].map((locale) => ({
          locale,
          title,
          summary: "",
          description: "",
          scope: "[]",
        })),
      },
    },
  });
  await logAudit(session.email, "create", "service", title);
  revalidatePath("/", "layout");
  redirect(`/admin/services/${service.id}?toast=created`);
}

export async function deleteServiceAction(id: number) {
  const session = await requireSession();
  const svc = await prisma.service.findUnique({ where: { id }, include: { translations: { where: { locale: "tr" } } } });
  await prisma.service.delete({ where: { id } });
  await logAudit(session.email, "delete", "service", svc?.translations[0]?.title ?? `#${id}`);
  revalidatePath("/", "layout");
  redirect("/admin/services?toast=deleted");
}

export async function moveServiceAction(id: number, dir: "up" | "down") {
  await requireSession();
  const all = await prisma.service.findMany({ orderBy: { order: "asc" } });
  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) redirect("/admin/services");
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= all.length) redirect("/admin/services");
  const a = all[idx];
  const b = all[swapWith];
  await prisma.$transaction([
    prisma.service.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.service.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath("/", "layout");
  redirect("/admin/services");
}

/* ---------------- Content ---------------- */

export async function updateContentAction(formData: FormData) {
  const session = await requireSession();
  for (const [name, raw] of formData.entries()) {
    if (typeof raw !== "string") continue;
    const match = name.match(/^content__(.+)__(tr|en|ru)$/);
    if (!match) continue;
    const [, key, locale] = match;
    let value = normalizeText(raw).trim();
    if (key.endsWith("_json")) {
      try {
        value = JSON.stringify(JSON.parse(value));
      } catch {
        continue;
      }
    }
    await prisma.pageContent.upsert({
      where: { key_locale: { key, locale } },
      update: { value },
      create: { key, locale, value },
    });
  }
  await logAudit(session.email, "update", "content");
  revalidatePath("/", "layout");
  redirect("/admin/content?toast=saved");
}

/* ---------------- References ---------------- */

export async function addReferenceAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/references?toast=error");
  const max = await prisma.reference.aggregate({ _max: { order: true } });
  const ref = await prisma.reference.create({ data: { name, order: (max._max.order ?? 0) + 1 } });
  await logAudit(session.email, "create", "reference", name);
  revalidatePath("/", "layout");
  redirect(`/admin/references/${ref.id}?toast=created`);
}

export async function updateReferenceFullAction(id: number, formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const logo = String(formData.get("logo") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);
  const visible = formData.get("visible") === "on";
  if (name) {
    await prisma.reference.update({
      where: { id },
      data: { name, logo, order: Number.isFinite(order) ? order : 0, visible },
    });
    await logAudit(session.email, "update", "reference", name);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/references/${id}?toast=saved`);
}

export async function moveReferenceAction(id: number, dir: "up" | "down") {
  await requireSession();
  const all = await prisma.reference.findMany({ orderBy: { order: "asc" } });
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) redirect("/admin/references");
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) redirect("/admin/references");
  await prisma.$transaction([
    prisma.reference.update({ where: { id: all[idx].id }, data: { order: all[swap].order } }),
    prisma.reference.update({ where: { id: all[swap].id }, data: { order: all[idx].order } }),
  ]);
  revalidatePath("/", "layout");
  redirect("/admin/references");
}

export async function updateReferenceAction(id: number, formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const logo = String(formData.get("logo") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);
  const visible = formData.get("visible") === "on";
  if (name) {
    await prisma.reference.update({
      where: { id },
      data: { name, logo, order: Number.isFinite(order) ? order : 0, visible },
    });
    await logAudit(session.email, "update", "reference", name);
  }
  revalidatePath("/", "layout");
  redirect("/admin/references?toast=saved");
}

export async function deleteReferenceAction(id: number) {
  const session = await requireSession();
  await prisma.reference.delete({ where: { id } });
  await logAudit(session.email, "delete", "reference", `#${id}`);
  revalidatePath("/", "layout");
  redirect("/admin/references?toast=deleted");
}

/* ---------------- Settings ---------------- */

export async function updateSettingsAction(formData: FormData) {
  const session = await requireAdmin();
  const plainKeys = [
    "contact_email",
    "notify_email",
    "contact_phone",
    "contact_address",
    "linkedin_url",
    "instagram_url",
    "twitter_url",
    "facebook_url",
    "youtube_url",
    "whatsapp_url",
    "site_logo",
    "site_favicon",
    "logo_height",
    "seo_title",
    "seo_description",
    "ga_id",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_from",
  ];
  for (const key of plainKeys) {
    const value = formData.get(key);
    if (typeof value !== "string") continue;
    await prisma.setting.upsert({
      where: { key },
      update: { value: value.trim() },
      create: { key, value: value.trim() },
    });
  }
  // SMTP password: only overwrite when a new value is supplied; store encrypted
  const smtpPass = formData.get("smtp_pass");
  if (typeof smtpPass === "string" && smtpPass.length > 0 && smtpPass !== "********") {
    await prisma.setting.upsert({
      where: { key: "smtp_pass" },
      update: { value: encryptSecret(smtpPass) },
      create: { key: "smtp_pass", value: encryptSecret(smtpPass) },
    });
  }
  await logAudit(session.email, "update", "settings");
  revalidatePath("/", "layout");
  redirect("/admin/settings?toast=saved");
}

export async function testSmtpAction() {
  const session = await requireAdmin();
  const { getSettings } = await import("@/lib/content");
  const s = await getSettings();
  const to = s.notify_email || s.contact_email || session.email;
  const res = await sendMail({
    to,
    subject: "SAFARI CONSULTING — SMTP test e-postası",
    text: "Bu bir test e-postasıdır. Bu mesajı aldıysanız SMTP ayarlarınız çalışıyor.",
  });
  redirect(`/admin/settings?toast=${res.sent ? "sent" : "smtpfail"}`);
}

/* ---------------- Messages ---------------- */

export async function setMessageStatusAction(id: number, status: string) {
  await requireSession();
  if (["new", "read", "replied"].includes(status)) {
    await prisma.contactMessage.update({ where: { id }, data: { status } });
  }
  redirect("/admin/messages");
}

export async function updateMessageNotesAction(id: number, formData: FormData) {
  await requireSession();
  const notes = String(formData.get("notes") ?? "").slice(0, 4000);
  await prisma.contactMessage.update({ where: { id }, data: { notes } });
  redirect(`/admin/messages/${id}?toast=saved`);
}

export async function deleteMessageAction(id: number) {
  const session = await requireSession();
  await prisma.contactMessage.delete({ where: { id } });
  await logAudit(session.email, "delete", "message", `#${id}`);
  redirect("/admin/messages?toast=deleted");
}

export async function bulkMessageAction(formData: FormData) {
  await requireSession();
  const op = String(formData.get("op") ?? "");
  const ids = formData
    .getAll("ids")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  if (ids.length === 0) return;
  if (op === "delete") {
    await prisma.contactMessage.deleteMany({ where: { id: { in: ids } } });
  } else if (op === "archive") {
    await prisma.contactMessage.updateMany({ where: { id: { in: ids } }, data: { archivedAt: new Date() } });
  } else if (op === "restore") {
    await prisma.contactMessage.updateMany({ where: { id: { in: ids } }, data: { archivedAt: null } });
  } else if (["new", "read", "replied"].includes(op)) {
    await prisma.contactMessage.updateMany({ where: { id: { in: ids } }, data: { status: op } });
  }
  revalidatePath("/", "layout");
}

/* ---------------- Users ---------------- */

export async function createUserAction(formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "editor") === "admin" ? "admin" : "editor";
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 8) redirect("/admin/users?toast=error");
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) redirect("/admin/users?toast=error&msg=" + encodeURIComponent("Bu e-posta zaten kayıtlı."));
  await prisma.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  await logAudit(session.email, "create", "user", email);
  redirect("/admin/users?toast=created");
}

export async function updateUserAction(id: number, formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "editor") === "admin" ? "admin" : "editor";
  if (!name) redirect("/admin/users?toast=error");
  await prisma.user.update({ where: { id }, data: { name, role } });
  await logAudit(session.email, "update", "user", `#${id}`);
  redirect("/admin/users?toast=saved");
}

export async function resetUserPasswordAction(id: number, formData: FormData) {
  const session = await requireAdmin();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect("/admin/users?toast=pwshort");
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10), tokenVersion: { increment: 1 } },
  });
  await logAudit(session.email, "reset_password", "user", `#${id}`);
  redirect("/admin/users?toast=saved");
}

/* ---------------- Media ---------------- */

export async function deleteMediaAction(url: string) {
  const session = await requireSession();
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN && /blob\.vercel-storage\.com/.test(url)) {
      const { del } = await import("@vercel/blob");
      await del(url);
    } else if (url.startsWith("/uploads/")) {
      const { unlink } = await import("fs/promises");
      const path = await import("path");
      await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
    }
    await logAudit(session.email, "delete", "media", url.split("/").pop() ?? "");
  } catch (err) {
    console.error("media delete failed", err);
  }
  redirect("/admin/media?toast=deleted");
}

/* ---------------- Blog / Posts ---------------- */

export async function createPostAction(formData: FormData) {
  const session = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/admin/posts?toast=error");

  const base = slugify(title) || "yazi";
  let slug = base;
  let n = 1;
  while (await prisma.post.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

  const post = await prisma.post.create({
    data: {
      slug,
      published: false,
      translations: {
        create: ["tr", "en", "ru"].map((locale) => ({ locale, title, excerpt: "", body: "" })),
      },
    },
  });
  await logAudit(session.email, "create", "post", title);
  revalidatePath("/", "layout");
  redirect(`/admin/posts/${post.id}?toast=created`);
}

export async function updatePostAction(id: number, formData: FormData) {
  const session = await requireSession();
  const cover = String(formData.get("cover") ?? "").trim();
  const published = formData.get("published") === "on";
  const slugInput = String(formData.get("slug") ?? "").trim();

  const data: { cover: string; published: boolean; slug?: string } = { cover, published };
  if (slugInput) {
    const s = slugify(slugInput);
    const clash = await prisma.post.findFirst({ where: { slug: s, NOT: { id } } });
    if (!clash && s) data.slug = s;
  }

  await prisma.post.update({ where: { id }, data });

  for (const locale of ["tr", "en", "ru"]) {
    const title = String(formData.get(`${locale}_title`) ?? "").trim();
    const excerpt = String(formData.get(`${locale}_excerpt`) ?? "").trim();
    const body = normalizeText(String(formData.get(`${locale}_body`) ?? "")).trim();
    if (!title) continue;
    const slug = await localeSlugFor("post", formData, locale, id);
    await prisma.postTranslation.upsert({
      where: { postId_locale: { postId: id, locale } },
      update: { title, excerpt, body, slug },
      create: { postId: id, locale, title, excerpt, body, slug },
    });
  }
  await logAudit(session.email, "update", "post", `#${id}`);
  revalidatePath("/", "layout");
  redirect(`/admin/posts/${id}?toast=saved`);
}

export async function deletePostAction(id: number) {
  const session = await requireSession();
  await prisma.post.delete({ where: { id } });
  await logAudit(session.email, "delete", "post", `#${id}`);
  revalidatePath("/", "layout");
  redirect("/admin/posts?toast=deleted");
}

export async function deleteUserAction(id: number) {
  const session = await requireAdmin();
  if (id === session.userId) redirect("/admin/users?toast=error&msg=" + encodeURIComponent("Kendi hesabınızı silemezsiniz."));
  const count = await prisma.user.count();
  if (count <= 1) redirect("/admin/users?toast=error");
  await prisma.user.delete({ where: { id } });
  await logAudit(session.email, "delete", "user", `#${id}`);
  redirect("/admin/users?toast=deleted");
}

/* ---------------- List views: status toggles & archive/restore ----------------
 * In-place updates for the shared list/kanban row actions. These mutate and
 * return WITHOUT redirecting, so the current view (list vs kanban, active vs
 * archive) is preserved and the affected row/card simply updates, moves lane,
 * or drops out on the automatic re-render. Errors still redirect with a toast.
 * `revalidatePath("/", "layout")` also refreshes the public site + sidebar. */

// Services
export async function setServiceVisibleAction(id: number, visible: boolean) {
  const session = await requireSession();
  await prisma.service.update({ where: { id }, data: { visible } });
  await logAudit(session.email, visible ? "show" : "hide", "service", `#${id}`);
  revalidatePath("/", "layout");
}
export async function archiveServiceAction(id: number) {
  const session = await requireSession();
  await prisma.service.update({ where: { id }, data: { archivedAt: new Date() } });
  await logAudit(session.email, "archive", "service", `#${id}`);
  revalidatePath("/", "layout");
}
export async function restoreServiceAction(id: number) {
  const session = await requireSession();
  await prisma.service.update({ where: { id }, data: { archivedAt: null } });
  await logAudit(session.email, "restore", "service", `#${id}`);
  revalidatePath("/", "layout");
}

// References
export async function setReferenceVisibleAction(id: number, visible: boolean) {
  const session = await requireSession();
  await prisma.reference.update({ where: { id }, data: { visible } });
  await logAudit(session.email, visible ? "show" : "hide", "reference", `#${id}`);
  revalidatePath("/", "layout");
}
export async function archiveReferenceAction(id: number) {
  const session = await requireSession();
  await prisma.reference.update({ where: { id }, data: { archivedAt: new Date() } });
  await logAudit(session.email, "archive", "reference", `#${id}`);
  revalidatePath("/", "layout");
}
export async function restoreReferenceAction(id: number) {
  const session = await requireSession();
  await prisma.reference.update({ where: { id }, data: { archivedAt: null } });
  await logAudit(session.email, "restore", "reference", `#${id}`);
  revalidatePath("/", "layout");
}

// Posts
export async function setPostPublishedAction(id: number, published: boolean) {
  const session = await requireSession();
  await prisma.post.update({ where: { id }, data: { published } });
  await logAudit(session.email, published ? "publish" : "unpublish", "post", `#${id}`);
  revalidatePath("/", "layout");
}
export async function archivePostAction(id: number) {
  const session = await requireSession();
  await prisma.post.update({ where: { id }, data: { archivedAt: new Date() } });
  await logAudit(session.email, "archive", "post", `#${id}`);
  revalidatePath("/", "layout");
}
export async function restorePostAction(id: number) {
  const session = await requireSession();
  await prisma.post.update({ where: { id }, data: { archivedAt: null } });
  await logAudit(session.email, "restore", "post", `#${id}`);
  revalidatePath("/", "layout");
}

// Messages
export async function moveMessageStatusAction(id: number, status: string) {
  const session = await requireSession();
  if (["new", "read", "replied"].includes(status)) {
    await prisma.contactMessage.update({ where: { id }, data: { status } });
    await logAudit(session.email, `status:${status}`, "message", `#${id}`);
  }
  revalidatePath("/", "layout");
}
export async function archiveMessageAction(id: number) {
  const session = await requireSession();
  await prisma.contactMessage.update({ where: { id }, data: { archivedAt: new Date() } });
  await logAudit(session.email, "archive", "message", `#${id}`);
  revalidatePath("/", "layout");
}
export async function restoreMessageAction(id: number) {
  const session = await requireSession();
  await prisma.contactMessage.update({ where: { id }, data: { archivedAt: null } });
  await logAudit(session.email, "restore", "message", `#${id}`);
  revalidatePath("/", "layout");
}

// Users
export async function setUserRoleAction(id: number, role: string) {
  const session = await requireAdmin();
  if (id === session.userId) redirect("/admin/users?toast=error&msg=" + encodeURIComponent("Kendi rolünüzü değiştiremezsiniz."));
  const next = role === "admin" ? "admin" : "editor";
  await prisma.user.update({ where: { id }, data: { role: next } });
  await logAudit(session.email, "update", "user", `#${id} role=${next}`);
}
export async function archiveUserAction(id: number) {
  const session = await requireAdmin();
  if (id === session.userId) redirect("/admin/users?toast=error&msg=" + encodeURIComponent("Kendi hesabınızı arşivleyemezsiniz."));
  const activeCount = await prisma.user.count({ where: { archivedAt: null } });
  if (activeCount <= 1) redirect("/admin/users?toast=error&msg=" + encodeURIComponent("Son aktif kullanıcı arşivlenemez."));
  await prisma.user.update({ where: { id }, data: { archivedAt: new Date(), tokenVersion: { increment: 1 } } });
  await logAudit(session.email, "archive", "user", `#${id}`);
  revalidatePath("/", "layout");
}
export async function restoreUserAction(id: number) {
  const session = await requireAdmin();
  await prisma.user.update({ where: { id }, data: { archivedAt: null } });
  await logAudit(session.email, "restore", "user", `#${id}`);
  revalidatePath("/", "layout");
}
