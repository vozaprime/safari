"use client";

import { OPEN_PREFS_EVENT } from "./CookieConsent";

/** Footer control that reopens the cookie consent bar so visitors can change
 *  their choice at any time (KVKK: consent must be as easy to withdraw). */
export default function CookiePrefsLink({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFS_EVENT))}
      className={className}
    >
      {label}
    </button>
  );
}
