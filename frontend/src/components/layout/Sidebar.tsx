import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

// ---------------------------------------------------------------------------
// Nav items definition
// ---------------------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: '📊',
    roles: ['tecnico', 'gestor', 'admin'],
  },
  {
    to: '/ronda/nova',
    label: 'Novo Check',
    icon: '🔍',
    roles: ['tecnico', 'gestor', 'admin'],
  },
  {
    to: '/historico',
    label: 'Histórico',
    icon: '📋',
    roles: ['gestor', 'admin'],
  },
  {
    to: '/admin/itens',
    label: 'Itens',
    icon: '⚙️',
    roles: ['admin'],
  },
  {
    to: '/admin/usuarios',
    label: 'Usuários',
    icon: '👥',
    roles: ['admin'],
  },
];

// ---------------------------------------------------------------------------
// RoleBadge
// ---------------------------------------------------------------------------
function RoleBadge({ role }: { role: UserRole }) {
  const labels: Record<UserRole, string> = {
    tecnico: 'Técnico',
    gestor: 'Gestor',
    admin: 'Admin',
  };
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--dc-cyan)',
        backgroundColor: 'rgba(0,180,216,0.15)',
        borderRadius: '4px',
        padding: '1px 6px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {labels[role]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------
export function Sidebar() {
  const { user, logout } = useAuth();
  const role = (user?.role ?? 'tecnico') as UserRole;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    await logout();
  }

  return (
    <aside
      style={{
        width: '180px',
        height: '100%',
        backgroundColor: 'var(--dc-night)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '2px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--dc-cyan)',
              letterSpacing: '-0.5px',
            }}
          >
            DC
          </span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--dc-white)',
              letterSpacing: '-0.5px',
            }}
          >
            Check
          </span>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Datacenter
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              textDecoration: 'none',
              color: isActive ? 'var(--dc-white)' : 'rgba(255,255,255,0.6)',
              backgroundColor: isActive ? 'rgba(0,180,216,0.12)' : 'transparent',
              borderLeft: isActive
                ? '3px solid var(--dc-cyan)'
                : '3px solid transparent',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              transition: 'background-color 0.15s, color 0.15s',
              cursor: 'pointer',
            })}
          >
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--dc-white)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.username ?? 'Usuário'}
          </div>
          <div style={{ marginTop: '3px' }}>
            <RoleBadge role={role} />
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '6px',
            color: '#fca5a5',
            fontSize: '12px',
            fontWeight: 500,
            padding: '6px 10px',
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.22)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.12)';
          }}
        >
          <span style={{ fontSize: '14px' }}>🚪</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
