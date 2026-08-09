"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary that replaces the root layout when a root layout itself
 * throws (this project uses per-segment root layouts, so there is no app/layout).
 * It must render its own <html>/<body> and cannot rely on globals.css or the
 * font variables, so styling is inline. Kept bilingual (TR/EN) and minimal.
 */
export default function GlobalError({
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
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f4ec",
          color: "#1e2b24",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <p aria-hidden="true" style={{ fontSize: "3rem", color: "#c9a227", margin: "0 0 1rem" }}>
            ⚠
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            Bir şeyler ters gitti · Something went wrong
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#6b6a5e", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
            Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
            <br />
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#c9a227",
              color: "#2a2102",
              border: "none",
              borderRadius: 6,
              padding: "0.75rem 1.75rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Tekrar dene / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
