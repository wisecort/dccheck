import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--dc-bg)' }}>
      {/* Desktop Sidebar — visible only on screens wider than 1024px */}
      <div
        style={{
          display: 'none',
          width: '180px',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
        }}
        className="dc-sidebar-wrapper"
      >
        <Sidebar />
      </div>

      {/* Main column */}
      <div
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        className="dc-main-column"
      >
        <Header />

        <main
          style={{
            flex: 1,
            padding: '24px 20px',
            overflowY: 'auto',
          }}
          className="dc-content-area"
        >
          {children}
        </main>

        {/* Mobile bottom nav spacer */}
        <div className="dc-bottom-nav-spacer" style={{ height: 0 }} />
      </div>

      {/* Mobile Bottom Nav — visible only on screens narrower than 640px */}
      <div className="dc-bottom-nav-wrapper">
        <BottomNav />
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .dc-sidebar-wrapper {
            display: flex !important;
          }
          .dc-main-column {
            margin-left: 180px;
          }
          .dc-bottom-nav-wrapper {
            display: none !important;
          }
        }

        @media (max-width: 639px) {
          .dc-bottom-nav-spacer {
            height: 60px !important;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .dc-bottom-nav-wrapper {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .dc-content-area {
            padding: 16px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
