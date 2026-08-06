"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();

  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-wait";
  const styles =
    variant === "primary"
      ? "bg-forest text-ivory hover:bg-emerald"
      : variant === "outline"
        ? "border border-forest text-forest hover:bg-forest hover:text-ivory"
        : "border border-sand text-stone hover:border-forest/40";

  return (
    <button type="submit" disabled={pending} className={`${base} ${styles} ${className}`}>
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
