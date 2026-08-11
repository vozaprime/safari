export default function Logo({ src, height }: { src?: string; height?: number }) {
  // Transparent, light-text brand logo shown directly on the dark header/footer.
  // Height is admin-configurable (Ayarlar → Logo yüksekliği); clamped so it can
  // never break the 72px header.
  const logoSrc = src || "/brand/logo.png";
  const h = Math.min(64, Math.max(28, Math.round(height || 48)));
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={logoSrc}
      alt="SAFARI CONSULTING"
      style={{ height: `${h}px` }}
      className="w-auto max-w-[300px] object-contain"
    />
  );
}
