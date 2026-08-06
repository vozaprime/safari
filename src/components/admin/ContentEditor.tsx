"use client";

import { useState } from "react";
import JsonListEditor from "./JsonListEditor";
import RichTextEditor from "./RichTextEditor";

type FieldDef = { key: string; label: string; rows: number; kind?: "text" | "json" | "rich"; hint?: string };
type Group = { title: string; keys: FieldDef[] };

const richHint = 'Kalın · italik · ara başlık · alıntı · liste araç çubuğunu kullanabilirsiniz.';

const groups: Group[] = [
  {
    title: "Ana Sayfa — Hero",
    keys: [
      { key: "hero_kicker", label: "Üst başlık (kicker)", rows: 2 },
      { key: "hero_title", label: "Ana başlık", rows: 2 },
      { key: "hero_subtitle", label: "Alt metin", rows: 3, kind: "rich" },
    ],
  },
  {
    title: "Ana Sayfa — Neden Biz",
    keys: [
      { key: "why_title", label: "Başlık", rows: 1 },
      { key: "why_body", label: "Metin", rows: 8, kind: "rich", hint: richHint },
    ],
  },
  {
    title: "Değerler ve Süreç",
    keys: [
      { key: "values_json", label: "Değerler", rows: 8, kind: "json" },
      { key: "process_json", label: "Çalışma süreci adımları", rows: 8, kind: "json" },
    ],
  },
  {
    title: "Hakkımızda",
    keys: [
      { key: "about_body", label: "Ana metin", rows: 12, kind: "rich", hint: richHint },
      { key: "about_mission", label: "Misyon", rows: 3, kind: "rich" },
      { key: "about_vision", label: "Vizyon", rows: 3, kind: "rich" },
    ],
  },
  {
    title: "Referanslar",
    keys: [
      { key: "references_intro", label: "Giriş metni", rows: 3, kind: "rich" },
      { key: "references_note", label: "Gizlilik notu", rows: 3, kind: "rich" },
    ],
  },
  { title: "İletişim", keys: [{ key: "contact_intro", label: "Giriş metni", rows: 3, kind: "rich" }] },
];

const locales = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
] as const;

const inputClass =
  "w-full rounded-md border border-sand bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20";

export default function ContentEditor({ content }: { content: Record<string, Record<string, string>> }) {
  const [active, setActive] = useState<string>("tr");

  return (
    <div>
      {/* Language tab bar */}
      <div className="sticky top-0 z-10 -mx-1 mb-6 flex gap-1 rounded-lg border border-sand bg-white/90 p-1 backdrop-blur">
        {locales.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setActive(l.code)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              active === l.code ? "bg-forest text-ivory" : "text-stone hover:bg-ivory"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title} className="rounded-xl border border-sand bg-white p-6 shadow-sm shadow-forest/5">
            <h2 className="text-sm font-semibold text-forest">{group.title}</h2>
            <div className="mt-4 space-y-5">
              {group.keys.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
                    {field.label}
                    {field.hint && <span className="ml-2 normal-case tracking-normal text-stone/60">{field.hint}</span>}
                  </label>
                  {locales.map((l) => {
                    const name = `content__${field.key}__${l.code}`;
                    const value = content[field.key]?.[l.code] ?? (field.kind === "json" ? "[]" : "");
                    return (
                      <div key={l.code} hidden={active !== l.code}>
                        {field.kind === "json" ? (
                          <JsonListEditor name={name} defaultValue={value} />
                        ) : field.kind === "rich" ? (
                          <RichTextEditor name={name} defaultValue={value} rows={field.rows} hint={field.hint} />
                        ) : (
                          <textarea id={name} name={name} rows={field.rows} defaultValue={value} className={inputClass} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
