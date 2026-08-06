export default function TopoPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="topo-drift" stroke="#C9A227" strokeWidth="1" opacity="0.14">
        <path d="M-100 120 C 150 60, 350 200, 600 140 S 1050 40, 1300 120" />
        <path d="M-100 200 C 180 130, 380 280, 640 210 S 1080 120, 1300 200" />
        <path d="M-100 290 C 200 210, 420 360, 680 280 S 1100 200, 1300 290" />
        <path d="M-100 380 C 220 300, 440 440, 700 360 S 1120 290, 1300 380" />
        <path d="M-100 470 C 240 390, 460 520, 720 440 S 1140 380, 1300 470" />
      </g>
      <g stroke="#1A5442" strokeWidth="1" opacity="0.5">
        <path d="M-100 160 C 160 95, 360 240, 620 175 S 1060 80, 1300 160" />
        <path d="M-100 335 C 210 255, 430 400, 690 320 S 1110 245, 1300 335" />
      </g>
    </svg>
  );
}
