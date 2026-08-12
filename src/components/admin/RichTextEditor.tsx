"use client";

import { useRef, useState } from "react";
import AdminIcon from "./icons";
import MediaPicker from "./MediaPicker";
import { ProseText } from "@/lib/richtext";

type Tool = { key: string; label: string; icon?: string; title: string };

const tools: Tool[] = [
  { key: "bold", label: "B", title: "Kalın" },
  { key: "italic", label: "I", title: "İtalik" },
  { key: "heading", label: "H", title: "Ara başlık" },
  { key: "quote", label: "❝", title: "Alıntı" },
  { key: "list", label: "•", title: "Madde listesi" },
];

export default function RichTextEditor({
  name,
  defaultValue,
  rows = 8,
  hint,
}: {
  name: string;
  defaultValue: string;
  rows?: number;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const surround = (before: string, after: string, placeholder: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    });
  };

  const prefixLines = (prefix: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const prefixed = block
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n");
    const next = value.slice(0, lineStart) + prefixed + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => ta.focus());
  };

  const insertAtCursor = (snippet: string) => {
    const ta = ref.current;
    if (!ta) {
      setValue((v) => v + snippet);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    });
  };

  const insertImage = (url: string) => {
    const base = url.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
    // Uploaded filenames get a random "-<stamp>" suffix (see api/admin/upload).
    // Strip that trailing token (6+ base36 chars containing a digit) from the
    // auto-generated alt so it reads cleanly; plain-word names are left intact.
    const alt = base
      .replace(/-(?=[a-z0-9]*[0-9])[a-z0-9]{6,}$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();
    insertAtCursor(`\n\n![${alt}](${url})\n\n`);
  };

  const apply = (key: string) => {
    switch (key) {
      case "bold":
        return surround("**", "**", "kalın metin");
      case "italic":
        return surround("*", "*", "italik metin");
      case "heading":
        return prefixLines("## ");
      case "quote":
        return prefixLines("> ");
      case "list":
        return prefixLines("- ");
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-sand bg-white focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
      <div className="flex items-center gap-1 border-b border-sand bg-ivory/60 px-2 py-1.5">
        {tools.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.title}
            onClick={() => apply(t.key)}
            className={`grid h-7 w-7 place-items-center rounded text-stone transition-colors hover:bg-white hover:text-forest ${
              t.key === "bold" ? "font-bold" : t.key === "italic" ? "font-serif italic" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-sand" aria-hidden="true" />
        <button
          type="button"
          title="Görsel ekle"
          onClick={() => setPickerOpen(true)}
          className="grid h-7 w-7 place-items-center rounded text-stone transition-colors hover:bg-white hover:text-forest"
        >
          <AdminIcon name="image" className="h-4 w-4" />
        </button>
        <span className="ml-auto">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors ${
              preview ? "bg-forest text-ivory" : "text-stone hover:bg-white hover:text-forest"
            }`}
          >
            <AdminIcon name="eye" className="h-3.5 w-3.5" />
            Önizleme
          </button>
        </span>
      </div>

      {/* the actual submitted value */}
      <textarea ref={ref} name={name} hidden={preview} value={value} onChange={(e) => setValue(e.target.value)} rows={rows} className="w-full resize-y bg-white px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-ink outline-none" />

      {preview && (
        <div className="min-h-24 px-4 py-3 text-sm text-ink">
          {value.trim() ? <ProseText text={value} lead /> : <p className="text-stone/50">Önizlenecek içerik yok.</p>}
        </div>
      )}

      {hint && <p className="border-t border-sand bg-ivory/40 px-3 py-1.5 text-[11px] text-stone/70">{hint}</p>}

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={insertImage} accept="image/*" />
    </div>
  );
}
