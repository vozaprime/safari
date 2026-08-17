"use client";

export default function SelectAll() {
  return (
    <input
      type="checkbox"
      aria-label="Tümünü seç"
      className="h-4 w-4 accent-forest"
      onChange={(e) => {
        // Toggle every id checkbox on the page (they associate with the bulk
        // form via the HTML5 `form=` attribute, so they aren't DOM children of it).
        const checked = e.currentTarget.checked;
        document
          .querySelectorAll<HTMLInputElement>('input[name="ids"]')
          .forEach((cb) => (cb.checked = checked));
      }}
    />
  );
}
