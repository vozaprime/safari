"use client";

import { useEffect, useRef, useState } from "react";
import AdminIcon from "./icons";

type MediaItem = { url: string; name: string; size: number };

const isVideo = (u: string) => /\.(mp4|webm|mov)$/i.test(u);

export default function MediaPicker({
  open,
  onClose,
  onSelect,
  accept = "image/*",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onlyImages = accept.includes("image") && !accept.includes("video");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- open değişince medya listesini yeniden çeken yükleme effect'i
    setLoading(true);
    setError(null);
    fetch("/api/admin/media")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((d: { items: MediaItem[] }) => setItems(d.items ?? []))
      .catch(() => setError("Medya listesi yüklenemedi."))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const visible = onlyImages ? items.filter((i) => !isVideo(i.url)) : items;

  async function handleUpload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      if (!res.ok) throw new Error("upload_failed");
      const data = (await res.json()) as { url: string };
      onSelect(data.url);
      onClose();
    } catch {
      setError("Yükleme başarısız oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-forest-deep/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-sand bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-sand px-5 py-3.5">
          <h2 className="text-sm font-semibold text-forest">Medya kütüphanesi</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-sand px-3 py-1.5 text-xs font-medium text-forest transition-colors hover:border-gold/60"
            >
              <AdminIcon name="download" className="h-4 w-4" /> Yeni yükle
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="grid h-8 w-8 place-items-center rounded-md text-stone transition-colors hover:bg-ivory"
            >
              <AdminIcon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />

        <div className="min-h-40 flex-1 overflow-y-auto p-5">
          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
          {loading ? (
            <p className="py-10 text-center text-sm text-stone/60">Yükleniyor…</p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone/60">Henüz görsel yok. “Yeni yükle” ile ekleyebilirsiniz.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {visible.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => { onSelect(item.url); onClose(); }}
                  className="group overflow-hidden rounded-lg border border-sand bg-ivory transition-colors hover:border-gold"
                  title={item.name}
                >
                  <span className="block aspect-[4/3] w-full">
                    {isVideo(item.url) ? (
                      <video src={item.url} className="h-full w-full object-cover" muted />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-left text-[10px] text-stone">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-forest">Yükleniyor…</div>
        )}
      </div>
    </div>
  );
}
