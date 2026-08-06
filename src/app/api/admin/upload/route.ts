import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const maxBytes = (isVideo ? 50 : 8) * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }
  if (!file.type.startsWith("image/") && !isVideo) {
    return NextResponse.json({ error: "bad_type" }, { status: 415 });
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const stamp = Date.now().toString(36) + Math.round(Math.random() * 1e6).toString(36);
  const safeBase = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40) || "file";
  const filename = `uploads/${safeBase}-${stamp}.${ext}`;

  // Production: Vercel Blob (persistent). Falls back to local FS in dev.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(filename, file, { access: "public", addRandomSuffix: false });
      return NextResponse.json({ url: blob.url });
    } catch (err) {
      console.error("Blob upload failed:", err);
      return NextResponse.json({ error: "upload_failed" }, { status: 500 });
    }
  }

  // Local dev fallback: write into /public/uploads
  try {
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const local = `${safeBase}-${stamp}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, local), bytes);
    return NextResponse.json({ url: `/uploads/${local}` });
  } catch (err) {
    console.error("Local upload failed:", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
