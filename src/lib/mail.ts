import nodemailer from "nodemailer";
import { getSettings } from "./content";
import { decryptSecret } from "./crypto";

async function buildTransport() {
  const s = await getSettings();
  const host = s.smtp_host;
  if (!host) return null;
  const transporter = nodemailer.createTransport({
    host,
    port: Number(s.smtp_port || 587),
    secure: Number(s.smtp_port) === 465,
    auth: s.smtp_user ? { user: s.smtp_user, pass: decryptSecret(s.smtp_pass || "") } : undefined,
  });
  const from = s.smtp_from || s.smtp_user || `no-reply@${host}`;
  return { transporter, from, settings: s };
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const t = await buildTransport();
  if (!t) return { sent: false, reason: "smtp_not_configured" };
  try {
    await t.transporter.sendMail({
      from: t.from,
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
    });
    return { sent: true };
  } catch (err) {
    console.error("Mail send failed:", err);
    return { sent: false, reason: "send_failed" };
  }
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
}) {
  const t = await buildTransport();
  const to = t?.settings.notify_email || t?.settings.contact_email;
  if (!t || !to) return { sent: false, reason: "smtp_not_configured" };
  return sendMail({
    to,
    replyTo: data.email,
    subject: `SAFARI CONSULTING — Yeni iletişim talebi: ${data.name}`,
    text: [
      `Ad Soyad: ${data.name}`,
      `E-posta: ${data.email}`,
      `Telefon: ${data.phone || "-"}`,
      `Şirket: ${data.company || "-"}`,
      `İlgilenilen hizmet: ${data.service || "-"}`,
      "",
      "Mesaj:",
      data.message,
    ].join("\n"),
  });
}
