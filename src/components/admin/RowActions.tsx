"use client";

import { useEffect, useRef, useState } from "react";
import AdminIcon from "./icons";

/**
 * Right-aligned "⋯" actions menu for a list row or kanban card. Children are the
 * menu items (server-rendered links / server-action forms styled with
 * `menuItemClass` / `menuItemDanger`). Closes on outside-click or Escape;
 * navigating server actions close it naturally. Container has no overflow
 * clipping (see ui.tableWrap) so the menu is never cut off.
 */
export default function RowActions({
  children,
  align = "right",
  label = "İşlemler",
}: {
  children: React.ReactNode;
  align?: "right" | "left";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-stone transition-colors hover:bg-ivory hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <AdminIcon name="dots" />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute ${align === "right" ? "right-0" : "left-0"} z-40 mt-1 w-56 rounded-lg border border-sand bg-white p-1 shadow-lg shadow-forest/10`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
