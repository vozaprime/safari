"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getVerifiedSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { encryptSecret, randomToken } from "@/lib/crypto";
import { sendMail } from "@/lib/mail";

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
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  await prisma.loginAttempt.create({ data: { key: email, success: ok } });
  if (ip !== "unknown") await prisma.loginAttempt.create({ data: { key: ip, success: ok } });

  if (!user || !ok) {
    redirect("/admin/login?error=1");
  }

  await createSession(
    { userId: user.id, email: user.email, name: user.name, role: (user.role as "admin" | "editor") ?? "admin", tv: user.tokenVersion },
    remember
  );
  await logAudit(user.email, "login", "auth");
  redirect("/admin");
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
    const base = process.env.SITE_URL || "http://localhost:3000";
    await sendMail({
      to: email,
      subject: "SAFARI CONSULTING — Şifre sıfırlama",
      text: `Şifrenizi sıfırlamak için (1 saat geçerli):\n\n${base}/admin/reset/${token}\n\nBu isteği siz yapmadıysanız yok sayabilirsiniz.`,
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
    await prisma.serviceTranslation.upsert({
      where: { serviceId_locale: { serviceId, locale } },
      update: { title, summary, description, scope },
      create: { serviceId, locale, title, summary, description, scope },
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

  let base = slugify(title) || "hizmet";
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
    "site_logo",
    "site_favicon",
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
  if (ids.length === 0) redirect("/admin/messages");
  if (op === "delete") {
    await prisma.contactMessage.deleteMany({ where: { id: { in: ids } } });
  } else if (["new", "read", "replied"].includes(op)) {
    await prisma.contactMessage.updateMany({ where: { id: { in: ids } }, data: { status: op } });
  }
  redirect("/admin/messages?toast=saved");
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

  let base = slugify(title) || "yazi";
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
    await prisma.postTranslation.upsert({
      where: { postId_locale: { postId: id, locale } },
      update: { title, excerpt, body },
      create: { postId: id, locale, title, excerpt, body },
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
