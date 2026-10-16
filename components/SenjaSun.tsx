export default function SenjaSun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      <defs>
        <clipPath id="above-horizon">
          <rect x="0" y="0" width="120" height="50" />
        </clipPath>
      </defs>
      <g clipPath="url(#above-horizon)">
        <circle className="sun" cx="60" cy="30" r="22" fill="#B65A32" />
      </g>
      <rect x="10" y="50" width="100" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="28" y="58" width="64" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="44" y="66" width="32" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  );
}