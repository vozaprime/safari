import type { ReactNode } from "react";

/**
 * Renders social-media icon links for whichever platform URLs are set in
 * settings (CMS-managed via the admin panel). Returns null when none are set.
 * Shared by the contact page info card and the footer so both stay in sync.
 */

type Platform = { key: string; label: string; icon: ReactNode };

const PLATFORMS: Platform[] = [
  {
    key: "linkedin_url",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21h-4z" />
      </svg>
    ),
  },
  {
    key: "instagram_url",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "twitter_url",
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "facebook_url",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
      </svg>
    ),
  },
  {
    key: "youtube_url",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12z" />
      </svg>
    ),
  },
  {
    key: "whatsapp_url",
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M17.47 14.38c-.29-.15-1.73-.85-2-.95-.27-.1-.47-.15-.67.15-.2.29-.77.95-.94 1.15-.17.2-.35.22-.64.07-.29-.15-1.23-.45-2.34-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.35.44-.52.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.57-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.73-.71 1.98-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.19-.56-.34zM12 2a10 10 0 0 0-8.53 15.29L2 22l4.85-1.27A10 10 0 1 0 12 2z" />
      </svg>
    ),
  },
];

export default function SocialLinks({
  settings,
  label,
  className = "",
}: {
  settings: Record<string, string>;
  label?: string;
  className?: string;
}) {
  const active = PLATFORMS.filter((p) => settings[p.key]?.trim());
  if (active.length === 0) return null;

  return (
    <div className={className}>
      {label && <span className="block text-xs uppercase tracking-wider text-mist">{label}</span>}
      <div className={`flex flex-wrap items-center gap-3 ${label ? "mt-3" : ""}`}>
        {active.map((p) => (
          <a
            key={p.key}
            href={settings[p.key].trim()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.label}
            className="grid h-9 w-9 place-items-center rounded-full border border-emerald-line text-ivory/80 transition-colors hover:border-gold hover:text-gold"
          >
            {p.icon}
          </a>
        ))}
      </div>
    </div>
  );
}
