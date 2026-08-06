import { PageHeader, EmptyState } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminIcon from "@/components/admin/icons";
import { deleteMediaAction } from "../../actions";

type Item = { url: string; name: string; size: number; date?: Date };

async function listMedia(): Promise<Item[]> {
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
    const items: Item[] = [];
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

const isVideo = (u: string) => /\.(mp4|webm|mov)$/i.test(u);
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export default async function MediaPage() {
  const items = await listMedia();

  return (
    <div>
      <PageHeader title="Medya Kütüphanesi" description="Panelden yüklenen görsel ve videolar. Kullanılmayanları buradan silebilirsiniz." />

      {items.length === 0 ? (
        <EmptyState text="Henüz yüklenmiş medya yok. Hizmet, referans veya blog görsellerini yüklediğinizde burada listelenir." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.url} className="group overflow-hidden rounded-xl border border-sand bg-white">
              <div className="relative aspect-[4/3] bg-ivory">
                {isVideo(item.url) ? (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                )}
                <form action={deleteMediaAction.bind(null, item.url)} className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <ConfirmButton confirmText="Bu medyayı silmek istediğinize emin misiniz? Kullanıldığı yerlerde görsel kaybolabilir." className="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-red-600 shadow hover:bg-white" ariaLabel="Sil">
                    <AdminIcon name="trash" className="h-4 w-4" />
                  </ConfirmButton>
                </form>
              </div>
              <div className="p-2.5">
                <p className="truncate text-[11px] text-ink" title={item.name}>{item.name}</p>
                <p className="mt-0.5 text-[10px] text-stone">{kb(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
