"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

type Labels = {
  form_name: string;
  form_email: string;
  form_phone: string;
  form_company: string;
  form_service: string;
  form_service_placeholder: string;
  form_message: string;
  form_send: string;
  form_sending: string;
  form_success: string;
  form_error: string;
};

export default function ContactForm({
  locale,
  labels,
  services,
  preselected = "",
}: {
  locale: Locale;
  labels: Labels;
  services: { slug: string; title: string }[];
  preselected?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    // client-side elapsed time helps the server reject instant bot submissions
    (data as Record<string, unknown>).elapsed = Date.now() - startedAt.current;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!res.ok) throw new Error("request_failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-md border border-sand bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/25";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* honeypot — hidden from users, only bots fill it */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
            {labels.form_name} *
          </label>
          <input id="cf-name" name="name" required maxLength={120} className={inputClass} />
        </div>
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
            {labels.form_email} *
          </label>
          <input id="cf-email" name="email" type="email" required maxLength={160} className={inputClass} />
        </div>
        <div>
          <label htmlFor="cf-phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
            {labels.form_phone}
          </label>
          <input id="cf-phone" name="phone" maxLength={40} className={inputClass} />
        </div>
        <div>
          <label htmlFor="cf-company" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
            {labels.form_company}
          </label>
          <input id="cf-company" name="company" maxLength={160} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="cf-service" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
          {labels.form_service}
        </label>
        <select id="cf-service" name="service" defaultValue={preselected} className={inputClass}>
          <option value="">{labels.form_service_placeholder}</option>
          {services.map((s) => (
            <option key={s.slug} value={s.title}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
          {labels.form_message} *
        </label>
        <textarea id="cf-message" name="message" required rows={5} maxLength={4000} className={inputClass} />
      </div>

      {status === "success" && (
        <p className="rounded-md border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald" role="status">
          {labels.form_success}
        </p>
      )}
      {status === "error" && (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {labels.form_error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 rounded-md bg-gold px-7 py-3.5 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory disabled:opacity-60"
      >
        {status === "sending" ? labels.form_sending : labels.form_send}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
          <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
