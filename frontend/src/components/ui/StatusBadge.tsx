import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusType = 'ok' | 'falha' | 'nok' | 'pending' | 'config';

interface StatusBadgeProps {
  status: StatusType;
  /** Override the auto-generated label */
  label?: string;
  /** Render as a larger pill */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  StatusType,
  {
    bg: string;
    color: string;
    border: string;
    icon: string;
    defaultLabel: string;
  }
> = {
  falha: {
    bg: '#FEE2E2',
    color: '#991B1B',
    border: '#fecaca',
    icon: '✖',
    defaultLabel: 'Falha',
  },
  ok: {
    bg: '#DCFCE7',
    color: '#166534',
    border: '#bbf7d0',
    icon: '✔',
    defaultLabel: 'OK',
  },
  nok: {
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#fde68a',
    icon: '⚠',
    defaultLabel: 'NOK',
  },
  pending: {
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#fde68a',
    icon: '○',
    defaultLabel: 'Pendente',
  },
  config: {
    bg: '#E0F7FC',
    color: '#0C4A6E',
    border: '#bae6fd',
    icon: '⚙',
    defaultLabel: 'Config',
  },
};

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: {
    padding: '1px 6px',
    fontSize: '0.714rem',
    gap: '3px',
    iconSize: '0.714rem',
  },
  md: {
    padding: '2px 8px',
    fontSize: '0.786rem',
    gap: '4px',
    iconSize: '0.786rem',
  },
  lg: {
    padding: '4px 12px',
    fontSize: '0.857rem',
    gap: '5px',
    iconSize: '0.857rem',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatusBadge({
  status,
  label,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const sizeCfg = SIZE_CONFIG[size];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeCfg.gap,
        padding: sizeCfg.padding,
        borderRadius: '9999px',
        fontSize: sizeCfg.fontSize,
        fontWeight: 500,
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        fontFamily: 'var(--font-sans)',
        userSelect: 'none',
      }}
      role="status"
      aria-label={label ?? cfg.defaultLabel}
    >
      <span
        style={{
          fontSize: sizeCfg.iconSize,
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {cfg.icon}
      </span>
      {label ?? cfg.defaultLabel}
    </span>
  );
}

// ─── Named exports for convenience ───────────────────────────────────────────

export function OkBadge({ label, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="ok" label={label} size={size} />;
}

export function FalhaBadge({ label, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="falha" label={label} size={size} />;
}

export function NokBadge({ label, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="nok" label={label} size={size} />;
}

export function PendingBadge({ label, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="pending" label={label} size={size} />;
}

export function ConfigBadge({ label, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="config" label={label} size={size} />;
}
