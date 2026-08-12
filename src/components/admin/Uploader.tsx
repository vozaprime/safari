"use client";

import { useRef, useState } from "react";
import AdminIcon from "./icons";
import MediaPicker from "./MediaPicker";

export default function Uploader({
  name,
  defaultValue = "",
  accept = "image/*",
  label = "Görsel",
  aspect = "aspect-[16/9]",
}: {
  name: string;
  defaultValue?: string;
  accept?: string;
  label?: string;
  aspect?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video") || /\.(mp4|webm|mov)$/i.test(value);

  async function handleFile(file: File) {
    setError(null);
    const maxMb = accept.includes("video") ? 50 : 8;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Dosya çok büyük (en fazla ${maxMb} MB).`);
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      if (!res.ok) throw new Error("upload_failed");
      const data = (await res.json()) as { url: string };
      setValue(data.url);
    } catch {
      setError("Yükleme başarısız oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-start gap-4">
        <div className={`relative ${aspect} w-40 shrink-0 overflow-hidden rounded-lg border border-sand bg-ivory`}>
          {value ? (
            isVideo ? (
              <video src={value} className="h-full w-full object-cover" muted loop playsInline autoPlay />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center text-stone/40">
              <AdminIcon name="image" className="h-8 w-8" />
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-forest-deep/50 text-ivory">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-sand px-3.5 py-2 text-xs font-medium text-forest transition-colors hover:border-gold/60"
            >
              <AdminIcon name="download" className="h-4 w-4" />
              {value ? `${label} değiştir` : `${label} yükle`}
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-sand px-3.5 py-2 text-xs font-medium text-forest transition-colors hover:border-gold/60"
            >
              <AdminIcon name="grid" className="h-4 w-4" /> Kütüphaneden seç
            </button>
            {value && (
              <button type="button" onClick={() => setValue("")} className="text-xs text-red-500 hover:underline">
                Kaldır
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {value && <p className="mt-2 break-all text-[11px] text-stone/70">{value}</p>}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <p className="mt-2 text-[11px] text-stone/60">Veya doğrudan bir URL yapıştırabilirsiniz:</p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/images/... veya https://..."
            className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2 text-xs text-ink outline-none focus:border-gold"
          />
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => setValue(url)}
        accept={accept}
      />
    </div>
  );
}
