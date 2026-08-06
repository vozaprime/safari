"use client";

export default function SelectAll() {
  return (
    <input
      type="checkbox"
      aria-label="Tümünü seç"
      className="h-4 w-4 accent-forest"
      onChange={(e) => {
        const form = e.currentTarget.closest("form");
        if (!form) return;
        form
          .querySelectorAll<HTMLInputElement>('input[name="ids"]')
          .forEach((cb) => (cb.checked = e.currentTarget.checked));
      }}
    />
  );
}
