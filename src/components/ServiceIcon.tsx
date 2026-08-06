const paths: Record<string, React.ReactNode> = {
  finance: (
    <>
      <path d="M4 20h16" />
      <path d="M5 16l4-5 4 3 6-8" />
      <path d="M15 6h4v4" />
    </>
  ),
  investment: (
    <>
      <path d="M12 21V11" />
      <path d="M7 21v-6" />
      <path d="M17 21v-8" />
      <path d="M4 8l5-4 4 3 6-5" />
      <path d="M15 2h4v4" />
    </>
  ),
  law: (
    <>
      <path d="M12 3v18" />
      <path d="M8 21h8" />
      <path d="M4 7h16" />
      <path d="M7 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6" />
      <path d="M17 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6" />
    </>
  ),
  trade: (
    <>
      <path d="M4 8h13l-3-3" />
      <path d="M20 16H7l3 3" />
      <path d="M4 21V3" />
      <path d="M20 21V3" />
    </>
  ),
  market: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5" />
      <path d="M8 11l2 2 4-4" />
    </>
  ),
  company: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M15 9h4a1 1 0 0 1 1 1v11" />
      <path d="M8 8h2M8 12h2M8 16h2" />
    </>
  ),
  brand: (
    <>
      <path d="M6 3h12l4 6-10 12L2 9l4-6" />
      <path d="M2 9h20" />
      <path d="M9 9l3 12 3-12" />
    </>
  ),
  project: (
    <>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M9 3v3M15 3v3" />
      <path d="M8 12l2.5 2.5L16 9" />
      <path d="M8 17h8" />
    </>
  ),
  compliance: (
    <>
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  realestate: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-6 7 6v11" />
      <path d="M10 21v-6h4v6" />
      <path d="M12 4v3" />
    </>
  ),
  citizenship: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 17c.8-2 2.3-3 4-3s3.2 1 4 3" />
    </>
  ),
  logistics: (
    <>
      <path d="M3 17V6h11v11" />
      <path d="M14 9h4l3 4v4h-3" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="16.5" cy="18" r="2" />
      <path d="M9 18h5.5M3 17c0 .5.5 1 1 1h1" />
    </>
  ),
  partnership: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M2 21c0-3.5 2.5-6 6-6 1.5 0 2.9.5 4 1.3 1.1-.8 2.5-1.3 4-1.3 3.5 0 6 2.5 6 6" />
    </>
  ),
};

export default function ServiceIcon({
  icon,
  className = "h-7 w-7",
}: {
  icon: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[icon] ?? paths.finance}
    </svg>
  );
}
