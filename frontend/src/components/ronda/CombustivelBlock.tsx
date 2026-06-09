import React from 'react';
import { CombustivelData } from '../../types/ronda';

function blockCardStyle(falha: boolean): React.CSSProperties {
  return {
    background: falha ? 'var(--dc-red-light)' : 'var(--dc-white)',
    border: falha ? '1px solid var(--dc-red)' : '1px solid var(--dc-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  };
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748B',
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--dc-border)',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#1E293B',
  background: 'var(--dc-white)',
  boxSizing: 'border-box',
  outline: 'none',
};

function textareaStyle(hasError?: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${hasError ? 'var(--dc-red)' : 'var(--dc-border)'}`,
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1E293B',
    background: 'var(--dc-white)',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
    minHeight: '72px',
    fontFamily: 'inherit',
  };
}

const fieldGroup: React.CSSProperties = { marginBottom: '14px' };

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const grid3: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '12px',
};

const subHeader: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#94A3B8',
  margin: '18px 0 10px',
  paddingBottom: '6px',
  borderBottom: '1px solid var(--dc-border)',
};

function ToggleButton({
  label,
  active,
  activeColor,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        background: active ? activeColor : '#E2E8F0',
        color: active ? '#FFFFFF' : '#64748B',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CombustivelBlockProps {
  value: CombustivelData;
  onChange: (data: CombustivelData) => void;
  falha: boolean;
  observacao: string;
  onFalhaChange: (falha: boolean, observacao: string) => void;
}

export function CombustivelBlock({ value, onChange, falha, observacao, onFalhaChange }: CombustivelBlockProps) {
  function set<K extends keyof CombustivelData>(key: K, val: CombustivelData[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div style={blockCardStyle(falha)}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#64748B',
            }}
          >
            Combustível
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", "Fira Mono", "Courier New", monospace',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--dc-blue)',
              marginTop: '2px',
            }}
          >
            COMB-01
          </div>
        </div>

        {/* FALHA toggle */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginRight: '4px' }}>FALHA</span>
          <ToggleButton
            label="Sim"
            active={falha === true}
            activeColor="var(--dc-red)"
            onClick={() => onFalhaChange(true, observacao)}
          />
          <ToggleButton
            label="Não"
            active={falha === false}
            activeColor="var(--dc-green)"
            onClick={() => onFalhaChange(false, '')}
          />
        </div>
      </div>

      {/* Falha observação */}
      {falha && (
        <div style={{ ...fieldGroup, marginBottom: '16px' }}>
          <label style={{ ...labelStyle, color: 'var(--dc-red)' }}>
            ⚠ Observação obrigatória quando FALHA = Sim
          </label>
          <textarea
            required
            value={observacao}
            onChange={(e) => onFalhaChange(true, e.target.value)}
            placeholder="Descreva a falha observada..."
            style={textareaStyle(true)}
            rows={3}
          />
        </div>
      )}

      {/* ── Tanque de uso ── */}
      <div style={subHeader}>Tanque de uso</div>

      <div style={grid2}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Nível tanque de uso (L)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={value.nivel_tanque_uso}
            onChange={(e) => set('nivel_tanque_uso', e.target.value)}
            placeholder="Ex: 850.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Data abastecimento</label>
          <input
            type="date"
            value={value.data_abastecimento}
            onChange={(e) => set('data_abastecimento', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Reserva ── */}
      <div style={subHeader}>Reserva</div>

      <div style={grid3}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Nível reserva (L)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={value.nivel_reserva}
            onChange={(e) => set('nivel_reserva', e.target.value)}
            placeholder="Ex: 2000.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Data abastecimento reserva</label>
          <input
            type="date"
            value={value.data_abastecimento_reserva}
            onChange={(e) => set('data_abastecimento_reserva', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Data vencimento reserva</label>
          <input
            type="date"
            value={value.data_vencimento_reserva}
            onChange={(e) => set('data_vencimento_reserva', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Rede (Mains) ── */}
      <div style={subHeader}>Rede elétrica (Mains)</div>

      <div style={{ ...grid3, marginBottom: '14px' }}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Tensão L1-N (V)</label>
          <input
            type="number"
            step="0.1"
            value={value.mains_tensao_l1_n}
            onChange={(e) => set('mains_tensao_l1_n', e.target.value)}
            placeholder="Ex: 220.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Tensão L2-N (V)</label>
          <input
            type="number"
            step="0.1"
            value={value.mains_tensao_l2_n}
            onChange={(e) => set('mains_tensao_l2_n', e.target.value)}
            placeholder="Ex: 220.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Tensão L3-N (V)</label>
          <input
            type="number"
            step="0.1"
            value={value.mains_tensao_l3_n}
            onChange={(e) => set('mains_tensao_l3_n', e.target.value)}
            placeholder="Ex: 220.0"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ maxWidth: '200px' }}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Frequência Mains (Hz)</label>
          <input
            type="number"
            step="0.1"
            value={value.mains_frequencia_hz}
            onChange={(e) => set('mains_frequencia_hz', e.target.value)}
            placeholder="Ex: 60.0"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
