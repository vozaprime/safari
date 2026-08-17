"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Toast = { id: number; kind: "success" | "error"; text: string };

const MESSAGES: Record<string, { kind: "success" | "error"; text: string }> = {
  saved: { kind: "success", text: "Değişiklikler kaydedildi." },
  created: { kind: "success", text: "Kayıt oluşturuldu." },
  deleted: { kind: "success", text: "Kayıt silindi." },
  archived: { kind: "success", text: "Arşive alındı." },
  restored: { kind: "success", text: "Arşivden çıkarıldı." },
  sent: { kind: "success", text: "Test e-postası gönderildi." },
  pwsaved: { kind: "success", text: "Şifre güncellendi." },
  uploaded: { kind: "success", text: "Dosya yüklendi." },
  error: { kind: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." },
  smtpfail: { kind: "error", text: "E-posta gönderilemedi. SMTP ayarlarını kontrol edin." },
  pwwrong: { kind: "error", text: "Mevcut şifre hatalı." },
  pwshort: { kind: "error", text: "Yeni şifre en az 8 karakter olmalı." },
  forbidden: { kind: "error", text: "Bu işlem için yetkiniz yok." },
  "2fa_setup": { kind: "success", text: "Kurulum başladı — QR'ı taratın ve kodu doğrulayın." },
  "2fa_on": { kind: "success", text: "İki aşamalı doğrulama etkinleştirildi." },
  "2fa_off": { kind: "success", text: "İki aşamalı doğrulama kapatıldı." },
  "2fa_bad": { kind: "error", text: "Kod doğrulanamadı. Tekrar deneyin." },
  "2fa_pw": { kind: "error", text: "Şifre hatalı." },
  "2fa_reset": { kind: "success", text: "Kullanıcının iki aşamalı doğrulaması sıfırlandı." },
};

export default function Toaster() {
  const router = useRouter();
  const params = useSearchParams();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const key = params.get("toast");
    if (!key) return;
    const found = MESSAGES[key];
    const msg = params.get("msg");
    const toast: Toast = {
      id: Date.now(),
      kind: found?.kind ?? (key === "error" ? "error" : "success"),
      text: msg ?? found?.text ?? "İşlem tamamlandı.",
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL toast paramına tepki veren yan-etkili effect (ardından router.replace + timer)
    setToasts((t) => [...t, toast]);

    // strip the toast params from the URL without adding history
    const url = new URL(window.location.href);
    url.searchParams.delete("toast");
    url.searchParams.delete("msg");
    router.replace(url.pathname + url.search, { scroll: false });

    const timer = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== toast.id));
    }, 3800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            t.kind === "success"
              ? "border-emerald/30 bg-white text-emerald"
              : "border-red-300 bg-white text-red-700"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
            {t.kind === "success" ? (
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M12 8v5M12 16.5v.5M10.3 3.9 2.4 18a1.9 1.9 0 0 0 1.7 2.9h15.8a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {t.text}
        </div>
      ))}
    </div>
  );
}
