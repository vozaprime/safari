"use client";

export default function ConfirmButton({
  children,
  confirmText,
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  confirmText: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
