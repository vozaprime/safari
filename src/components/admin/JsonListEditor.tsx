"use client";

import { useState } from "react";
import AdminIcon from "./icons";

type Item = { title: string; text: string };

export default function JsonListEditor({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const parsed = JSON.parse(defaultValue);
      return Array.isArray(parsed) ? parsed.map((p) => ({ title: p.title ?? "", text: p.text ?? "" })) : [];
    } catch {
      return [];
    }
  });

  const update = (i: number, field: keyof Item, value: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setItems((prev) => [...prev, { title: "", text: "" }]);
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-sand bg-ivory/40 p-3">
          <div className="flex items-center gap-2">
            <input
              value={it.title}
              onChange={(e) => update(i, "title", e.target.value)}
              placeholder="Başlık"
              className="flex-1 rounded-md border border-sand bg-white px-3 py-2 text-sm font-medium outline-none focus:border-gold"
            />
            <button type="button" onClick={() => move(i, -1)} className="p-1 text-stone hover:text-forest" aria-label="Yukarı">
              <AdminIcon name="up" className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => move(i, 1)} className="p-1 text-stone hover:text-forest" aria-label="Aşağı">
              <AdminIcon name="down" className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => remove(i)} className="p-1 text-red-500 hover:text-red-700" aria-label="Sil">
              <AdminIcon name="trash" className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={it.text}
            onChange={(e) => update(i, "text", e.target.value)}
            placeholder="Açıklama"
            rows={2}
            className="mt-2 w-full rounded-md border border-sand bg-white px-3 py-2 text-[13px] outline-none focus:border-gold"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-sand px-3 py-2 text-xs text-forest hover:border-gold/60"
      >
        <AdminIcon name="plus" className="h-4 w-4" /> Madde ekle
      </button>
    </div>
  );
}
