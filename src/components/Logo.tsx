export default function Logo({ src }: { src?: string }) {
  // The brand logo is a full-colour wordmark designed for light grounds, so it
  // sits on an ivory/white "badge" that keeps it legible on the dark header/footer.
  const logoSrc = src || "/brand/logo.png";
  return (
    <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt="SAFARI CONSULTING"
        width={110}
        height={60}
        className="h-11 w-auto max-w-[184px] object-contain"
      />
    </span>
  );
}
