"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary for the admin panel (Turkish-only). Keeps an unexpected failure
 * inside a single view from tearing down the whole panel with an unstyled screen.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 font-display text-2xl text-ink">Bir hata oluştu</h1>
      <p className="mb-7 text-sm leading-relaxed text-stone">
        İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-gold px-6 py-3 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
        >
          Tekrar dene
        </button>
        <Link
          href="/admin"
          className="rounded-md border border-sand px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-gold"
        >
          Panele dön
        </Link>
      </div>
    </div>
  );
}
