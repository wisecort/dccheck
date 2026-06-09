import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LogoMarkProps {
  /** Size of the icon in pixels (default: 40) */
  size?: number;
  /** Color variant — affects the wordmark color (default: 'dark') */
  variant?: 'dark' | 'light';
  /** Whether to render the "DCCheck" wordmark next to the icon (default: true) */
  showText?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LogoMark({
  size = 40,
  variant = 'dark',
  showText = true,
  className = '',
}: LogoMarkProps) {
  // The rack icon is proportional: width / height ~ 0.7
  const iconW = Math.round(size * 0.7);
  const iconH = size;

  // Wordmark colours
  const dcColor = '#00B4D8';                           // always cyan
  const checkColor = variant === 'dark' ? '#0F172A' : '#FFFFFF';

  // Font size scales with icon height
  const fontSize = Math.round(size * 0.45);
  const fontSizeSmall = Math.round(size * 0.44);

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(size * 0.2),
        userSelect: 'none',
        textDecoration: 'none',
      }}
      role="img"
      aria-label="DCCheck logo"
    >
      {/* ── Rack SVG icon ──────────────────────────────────────── */}
      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 70 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{ flexShrink: 0 }}
      >
        {/* Rack cabinet body */}
        <rect
          x="2"
          y="2"
          width="66"
          height="96"
          rx="8"
          ry="8"
          fill="#1A3A5C"
          stroke="#0F2A44"
          strokeWidth="1.5"
        />

        {/* Top rail (1U slot) */}
        <rect x="8" y="12" width="54" height="16" rx="3" fill="#0F2A44" />
        {/* Top slot indicator lights */}
        <circle cx="16" cy="20" r="2.5" fill="#22C55E" />
        <circle cx="24" cy="20" r="2.5" fill="#22C55E" />
        <rect x="30" y="17" width="24" height="6" rx="2" fill="#0A1628" />

        {/* Middle rail (1U slot) */}
        <rect x="8" y="34" width="54" height="16" rx="3" fill="#0F2A44" />
        <circle cx="16" cy="42" r="2.5" fill="#F59E0B" />
        <circle cx="24" cy="42" r="2.5" fill="#22C55E" />
        <rect x="30" y="39" width="24" height="6" rx="2" fill="#0A1628" />

        {/* Lower rail (1U slot) */}
        <rect x="8" y="56" width="54" height="16" rx="3" fill="#0F2A44" />
        <circle cx="16" cy="64" r="2.5" fill="#22C55E" />
        <circle cx="24" cy="64" r="2.5" fill="#22C55E" />
        <rect x="30" y="61" width="24" height="6" rx="2" fill="#0A1628" />

        {/* Blank panel at bottom */}
        <rect x="8" y="78" width="54" height="12" rx="3" fill="#0F2A44" opacity="0.6" />

        {/* Checkmark overlay (cyan, centered, slightly below mid) */}
        <g transform="translate(35, 47)">
          {/* Circle background */}
          <circle cx="0" cy="0" r="14" fill="#00B4D8" opacity="0.15" />
          {/* Checkmark path */}
          <polyline
            points="-6,0 -1,6 8,-7"
            stroke="#00B4D8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>

      {/* ── Wordmark ──────────────────────────────────────────────── */}
      {showText && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}
        >
          <span
            style={{
              fontSize: fontSize,
              color: dcColor,
            }}
          >
            DC
          </span>
          <span
            style={{
              fontSize: fontSizeSmall,
              color: checkColor,
            }}
          >
            Check
          </span>
        </span>
      )}
    </div>
  );
}
