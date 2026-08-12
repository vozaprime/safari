"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminIcon from "./icons";

type Status = "pending" | "uploading" | "done" | "error";
type Job = { name: string; status: Status };

export default function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragOver, setDragOver] = useState(false);

  async function uploadOne(file: File, idx: number) {
    setJobs((j) => j.map((x, i) => (i === idx ? { ...x, status: "uploading" } : x)));
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      if (!res.ok) throw new Error("upload_failed");
      setJobs((j) => j.map((x, i) => (i === idx ? { ...x, status: "done" } : x)));
    } catch {
      setJobs((j) => j.map((x, i) => (i === idx ? { ...x, status: "error" } : x)));
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const startIdx = jobs.length;
    setJobs((j) => [...j, ...arr.map((f) => ({ name: f.name, status: "pending" as Status }))]);
    await Promise.all(arr.map((f, k) => uploadOne(f, startIdx + k)));
    router.refresh();
  }

  return (
    <div className="mb-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors ${
          dragOver ? "border-gold bg-gold/5" : "border-sand bg-white hover:border-gold/50"
        }`}
      >
        <AdminIcon name="download" className="h-6 w-6 text-forest" />
        <p className="mt-2 text-sm text-ink">Dosyaları buraya sürükleyin ya da tıklayıp seçin</p>
        <p className="mt-1 text-[11px] text-stone/60">Aynı anda birden çok görsel/video yüklenebilir (görsel ≤ 8 MB, video ≤ 50 MB).</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {jobs.map((j, i) => (
            <li key={`${j.name}-${i}`} className="flex items-center justify-between rounded-md border border-sand bg-white px-3 py-1.5 text-xs">
              <span className="truncate text-ink">{j.name}</span>
              <span
                className={
                  j.status === "done"
                    ? "text-emerald"
                    : j.status === "error"
                    ? "text-red-600"
                    : "text-stone"
                }
              >
                {j.status === "done"
                  ? "Yüklendi"
                  : j.status === "error"
                  ? "Hata"
                  : j.status === "uploading"
                  ? "Yükleniyor…"
                  : "Bekliyor"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
