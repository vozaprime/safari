import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function csvCell(v: string) {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const where = status && ["new", "read", "replied"].includes(status) ? { status } : {};

  const rows = await prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" } });
  const header = ["Tarih", "Ad Soyad", "E-posta", "Telefon", "Şirket", "Hizmet", "Dil", "Durum", "Mesaj", "Notlar"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.createdAt).toLocaleString("tr-TR"),
        r.name,
        r.email,
        r.phone,
        r.company,
        r.service,
        r.locale,
        r.status,
        r.message,
        r.notes,
      ]
        .map((v) => csvCell(String(v ?? "")))
        .join(",")
    );
  }
  // BOM so Excel opens Turkish characters correctly
  const body = "﻿" + lines.join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="talepler-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
