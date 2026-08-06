const icons: React.ReactNode[] = [
  /* güven — kalkan */
  <path key="0" d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3M9 12l2 2 4-4" />,
  /* şeffaflık — göz */
  <g key="1">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6" />
    <circle cx="12" cy="12" r="3" />
  </g>,
  /* etik — terazi */
  <g key="2">
    <path d="M12 3v18M8 21h8M4 7h16" />
    <path d="M7 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6M17 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6" />
  </g>,
  /* sürdürülebilirlik — filiz */
  <g key="3">
    <path d="M12 21v-8" />
    <path d="M12 13c0-4 3-7 8-7 0 4-3 7-8 7" />
    <path d="M12 13c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5" />
  </g>,
  /* profesyonellik — nişan yıldızı */
  <g key="4">
    <circle cx="12" cy="9" r="5" />
    <path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5" />
  </g>,
];

export default function ValueIcon({ index, className = "h-6 w-6" }: { index: number; className?: string }) {
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
      {icons[index % icons.length]}
    </svg>
  );
}
