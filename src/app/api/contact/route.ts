import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendContactNotification } from "@/lib/mail";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // --- spam protection ---
  // 1) honeypot: real users never fill this hidden field
  if (String(body.website ?? "").trim() !== "") {
    return NextResponse.json({ ok: true }); // silently accept & drop
  }
  // 2) too fast: bots submit almost instantly
  const elapsed = Number(body.elapsed ?? 0);
  if (elapsed > 0 && elapsed < 1500) {
    return NextResponse.json({ ok: true }); // silently drop
  }
  // 3) per-IP rate limit: max 3 submissions / 10 min
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (ip !== "unknown") {
    const recent = await prisma.contactMessage.count({
      where: { ip, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
    });
    if (recent >= 3) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const company = String(body.company ?? "").trim();
  const service = String(body.service ?? "").trim();
  const locale = String(body.locale ?? "tr").slice(0, 2);

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!email || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const record = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone.slice(0, 40),
      company: company.slice(0, 160),
      service: service.slice(0, 200),
      message,
      locale,
      ip: ip.slice(0, 60),
    },
  });

  const mail = await sendContactNotification({ name, email, phone, company, service, message });

  return NextResponse.json({ ok: true, id: record.id, mailSent: mail.sent });
}
