import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

interface BottomNavItem {
  to: string;
  label: string;
  roles: UserRole[];
  icon: React.ReactNode;
}

function IconDashboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const NAV_ITEMS: BottomNavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    roles: ['tecnico', 'gestor', 'admin'],
    icon: <IconDashboard />,
  },
  {
    to: '/ronda/nova',
    label: 'Novo Check',
    roles: ['tecnico', 'gestor', 'admin'],
    icon: <IconSearch />,
  },
  {
    to: '/historico',
    label: 'Histórico',
    roles: ['gestor', 'admin'],
    icon: <IconClipboard />,
  },
  {
    to: '/admin/itens',
    label: 'Admin',
    roles: ['admin'],
    icon: <IconSettings />,
  },
];

export function BottomNav() {
  const { user } = useAuth();
  const role = (user?.role ?? 'tecnico') as UserRole;
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'var(--dc-night)',
        display: 'flex',
        alignItems: 'stretch',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        zIndex: 200,
      }}
    >
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            textDecoration: 'none',
            color: isActive ? 'var(--dc-cyan)' : 'rgba(255,255,255,0.5)',
            borderTop: isActive
              ? '2px solid var(--dc-cyan)'
              : '2px solid transparent',
            transition: 'color 0.15s',
            paddingBottom: '2px',
          })}
        >
          {item.icon}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
