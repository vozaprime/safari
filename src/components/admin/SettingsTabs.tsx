"use client";

import { useEffect, useState } from "react";

export type SettingsTab = { id: string; label: string; content: React.ReactNode };

const STORE_KEY = "sc-settings-tab";

function TabIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[18px] w-[18px]",
    "aria-hidden": true,
  };
  switch (id) {
    case "iletisim":
      return (
        <svg {...common}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5Z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      );
    case "marka":
      return (
        <svg {...common}>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5Z" />
          <circle cx="9" cy="9" r="1.6" />
          <path d="m5 17 4-4 4 4 3-3 3 3" />
        </svg>
      );
    case "eposta":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="m4 7 8 5.5L20 7" />
        </svg>
      );
    case "guvenlik":
      return (
        <svg {...common}>
          <path d="M12 3.5 5.5 6v5c0 4 2.7 6.7 6.5 8.5C15.8 17.7 18.5 15 18.5 11V6Z" />
          <path d="m9.5 12 1.8 1.8L15 10" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Tabbed shell for the admin Settings page so it no longer scrolls forever.
 * Every panel stays mounted (hidden, not unmounted) so unsaved input survives
 * switching tabs. The active tab is restored from the URL hash (`#twofa` →
 * Güvenlik, used by the 2FA action redirects) or from localStorage, so a
 * save-and-reload keeps you on the section you were editing.
 */
export default function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const fromHash =
      hash === "twofa" ? "guvenlik" : tabs.some((t) => t.id === hash) ? hash : null;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    const next =
      fromHash || (tabs.some((t) => t.id === stored) ? stored : null) || tabs[0]?.id;
    if (next) setActive(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: string) => {
    setActive(id);
    try {
      localStorage.setItem(STORE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <nav aria-label="Ayarlar bölümleri" className="lg:w-56 lg:shrink-0">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-sand bg-white p-1 lg:sticky lg:top-6 lg:flex-col lg:overflow-visible lg:p-2">
          {tabs.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => select(t.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors lg:w-full ${
                  isActive
                    ? "bg-forest text-ivory"
                    : "text-stone hover:bg-ivory hover:text-forest"
                }`}
              >
                <span className={isActive ? "text-gold" : "text-stone/60"}>
                  <TabIcon id={t.id} />
                </span>
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        {tabs.map((t) => (
          <section key={t.id} id={t.id} hidden={t.id !== active} className="scroll-mt-24">
            {t.content}
          </section>
        ))}
      </div>
    </div>
  );
}
