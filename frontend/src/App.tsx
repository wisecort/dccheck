import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import type { UserRole } from './types';
import { AppLayout } from './components/layout/AppLayout';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NovaRondaPage = lazy(() => import('./pages/NovaRondaPage'));
const RondaFormPage = lazy(() => import('./pages/RondaFormPage'));
const HistoricoPage = lazy(() => import('./pages/HistoricoPage'));
const RondaDetalhePage = lazy(() => import('./pages/RondaDetalhePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));

// ─── Loading fallback ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--dc-bg)',
      }}
    >
      <div className="spinner" aria-label="Carregando..." />
    </div>
  );
}

// ─── 403 Forbidden page ───────────────────────────────────────────────────────

function ForbiddenPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '12px',
        background: 'var(--dc-bg)',
      }}
    >
      <span style={{ fontSize: '48px' }}>🔒</span>
      <h2 style={{ color: 'var(--dc-text-main)', margin: 0 }}>Acesso Negado</h2>
      <p style={{ color: 'var(--dc-text-sec)', margin: 0 }}>
        Você não tem permissão para acessar esta página.
      </p>
      <a href="/dashboard" className="btn btn-primary" style={{ marginTop: '8px' }}>
        Voltar ao Dashboard
      </a>
    </div>
  );
}

// ─── PrivateRoute ─────────────────────────────────────────────────────────────

interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ─── RoleRoute ────────────────────────────────────────────────────────────────

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected: all authenticated users */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout><DashboardPage /></AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/historico/:rondaId"
          element={
            <PrivateRoute>
              <AppLayout><RondaDetalhePage /></AppLayout>
            </PrivateRoute>
          }
        />

        {/* Protected: tecnico | gestor */}
        <Route
          path="/ronda/nova"
          element={
            <RoleRoute allowedRoles={['tecnico', 'gestor', 'admin']}>
              <AppLayout><NovaRondaPage /></AppLayout>
            </RoleRoute>
          }
        />

        <Route
          path="/ronda/:salaSlug/form"
          element={
            <RoleRoute allowedRoles={['tecnico', 'gestor', 'admin']}>
              <AppLayout><RondaFormPage /></AppLayout>
            </RoleRoute>
          }
        />

        {/* Protected: gestor | admin */}
        <Route
          path="/historico"
          element={
            <RoleRoute allowedRoles={['gestor', 'admin']}>
              <AppLayout><HistoricoPage /></AppLayout>
            </RoleRoute>
          }
        />

        {/* Protected: admin only */}
        <Route
          path="/admin/itens"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AppLayout><AdminPage /></AppLayout>
            </RoleRoute>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AppLayout><UsuariosPage /></AppLayout>
            </RoleRoute>
          }
        />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                gap: '12px',
                background: 'var(--dc-bg)',
              }}
            >
              <h2 style={{ color: 'var(--dc-text-main)' }}>404 — Página não encontrada</h2>
              <a href="/dashboard" className="btn btn-primary">
                Ir para o Dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
