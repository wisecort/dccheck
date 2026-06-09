import React from 'react';
import { ItemSala } from '../../types/ronda';

// ─── Placeholder — fora do escopo atual ──────────────────────────────────────

interface ExtintorBlockProps {
  item: ItemSala;
  // Props accepted for future use but not used in this placeholder
  value?: unknown;
  onChange?: (data: unknown) => void;
  falha?: boolean;
  observacao?: string;
  onFalhaChange?: (falha: boolean, observacao: string) => void;
}

export function ExtintorBlock({ item }: ExtintorBlockProps) {
  return (
    <div
      style={{
        background: '#F8FAFC',
        border: '1px solid var(--dc-border)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        opacity: 0.6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#94A3B8',
          }}
        >
          Extintor
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", "Fira Mono", "Courier New", monospace',
            fontSize: '13px',
            fontWeight: 700,
            color: '#94A3B8',
          }}
        >
          {item.identificador}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: '#F1F5F9',
          borderRadius: '6px',
          border: '1px dashed #CBD5E1',
        }}
      >
        <span style={{ fontSize: '16px' }}>🚧</span>
        <span style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>
          Extintores — fora do escopo atual
        </span>
      </div>
    </div>
  );
}
