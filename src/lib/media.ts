export type MediaItem = { url: string; name: string; size: number; date?: Date };

/** Lists uploaded media. Uses Vercel Blob in production, local FS in dev. */
export async function listMedia(): Promise<MediaItem[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: "uploads/", limit: 200 });
      return blobs
        .map((b) => ({ url: b.url, name: b.pathname.split("/").pop() ?? b.pathname, size: b.size, date: b.uploadedAt }))
        .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
    } catch {
      return [];
    }
  }
  // local dev fallback
  try {
    const { readdir, stat } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads");
    const files = await readdir(dir).catch(() => [] as string[]);
    const items: MediaItem[] = [];
    for (const f of files) {
      if (f.startsWith(".")) continue;
      const s = await stat(path.join(dir, f));
      items.push({ url: `/uploads/${f}`, name: f, size: s.size, date: s.mtime });
    }
    return items.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  } catch {
    return [];
  }
}
