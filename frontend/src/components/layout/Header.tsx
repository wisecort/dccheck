import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

const ROLE_LABELS: Record<UserRole, string> = {
  tecnico: 'Técnico',
  gestor: 'Gestor',
  admin: 'Admin',
};

const ROLE_COLORS: Record<UserRole, { bg: string; color: string; border: string }> = {
  tecnico: {
    bg: 'var(--dc-cyan-light)',
    color: '#0077A3',
    border: 'var(--dc-cyan)',
  },
  gestor: {
    bg: 'var(--dc-green-light)',
    color: '#15803D',
    border: 'var(--dc-green)',
  },
  admin: {
    bg: 'var(--dc-amber-light)',
    color: '#B45309',
    border: 'var(--dc-amber)',
  },
};

export function Header() {
  const { user, logout } = useAuth();
  const role = (user?.role ?? 'tecnico') as UserRole;
  const roleStyle = ROLE_COLORS[role];

  async function handleLogout() {
    await logout();
  }

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--dc-white)',
        borderBottom: '1px solid var(--dc-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: DCCheck wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--dc-cyan)',
              letterSpacing: '-0.5px',
            }}
          >
            DC
          </span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--dc-text-main)',
              letterSpacing: '-0.5px',
            }}
          >
            Check
          </span>
        </div>
      </div>

      {/* Right: user name + role badge + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* User name */}
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--dc-text-main)',
            maxWidth: '140px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          className="dc-header-username"
        >
          {user?.username ?? 'Usuário'}
        </span>

        {/* Role badge */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: roleStyle.color,
            backgroundColor: roleStyle.bg,
            border: `1px solid ${roleStyle.border}`,
            borderRadius: '12px',
            padding: '2px 8px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          className="dc-header-role"
        >
          {ROLE_LABELS[role]}
        </span>

        {/* Logout icon button */}
        <button
          onClick={handleLogout}
          title="Sair"
          aria-label="Sair da conta"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid var(--dc-border)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: 'var(--dc-text-sec)',
            fontSize: '16px',
            transition: 'background-color 0.15s, color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.backgroundColor = 'var(--dc-red-light)';
            btn.style.color = 'var(--dc-red)';
            btn.style.borderColor = 'var(--dc-red)';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--dc-text-sec)';
            btn.style.borderColor = 'var(--dc-border)';
          }}
        >
          {/* Simple logout SVG icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .dc-header-username {
            display: none !important;
          }
          .dc-header-role {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
