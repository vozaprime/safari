import { NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/auth";
import { listMedia } from "@/lib/media";

export async function GET() {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await listMedia();
  return NextResponse.json({ items });
}
