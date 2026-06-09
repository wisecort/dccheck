import React from 'react';

// ─── Data interface ──────────────────────────────────────────────────────────

export interface EquipamentoData {
  quant_fases: number | '';
  desligados: number | '';
}

// ─── Shared card styles (inlined to keep blocks self-contained) ───────────────

function blockCardStyle(falha: boolean): React.CSSProperties {
  return {
    background: falha ? 'var(--dc-red-light)' : 'var(--dc-white)',
    border: falha ? '1px solid var(--dc-red)' : '1px solid var(--dc-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  };
}

const label: React.CSSProperties = {
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

const row2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

function ToggleButton({
  label: lbl,
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
      {lbl}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EquipamentoBlockProps {
  item: { identificador: string };
  value: EquipamentoData;
  onChange: (data: EquipamentoData) => void;
  falha: boolean;
  observacao: string;
  onFalhaChange: (falha: boolean) => void;
  onObservacaoChange: (obs: string) => void;
}

export function EquipamentoBlock({
  item,
  value,
  onChange,
  falha,
  observacao,
  onFalhaChange,
  onObservacaoChange,
}: EquipamentoBlockProps) {
  function set<K extends keyof EquipamentoData>(key: K, val: EquipamentoData[K]) {
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
            Quadro Elétrico
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
            {item.identificador}
          </div>
        </div>

        {/* FALHA toggle */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginRight: '4px' }}>FALHA</span>
          <ToggleButton
            label="Sim"
            active={falha === true}
            activeColor="var(--dc-red)"
            onClick={() => onFalhaChange(true)}
          />
          <ToggleButton
            label="Não"
            active={falha === false}
            activeColor="var(--dc-green)"
            onClick={() => {
              onFalhaChange(false);
              onObservacaoChange('');
            }}
          />
        </div>
      </div>

      {/* Falha observação */}
      {falha && (
        <div style={{ ...fieldGroup, marginBottom: '16px' }}>
          <label style={{ ...label, color: 'var(--dc-red)' }}>
            ⚠ Observação obrigatória quando FALHA = Sim
          </label>
          <textarea
            required
            value={observacao}
            onChange={(e) => onObservacaoChange(e.target.value)}
            placeholder="Descreva a falha observada..."
            style={textareaStyle(true)}
            rows={3}
          />
        </div>
      )}

      {/* Fields */}
      <div style={row2}>
        <div style={fieldGroup}>
          <label style={label}>Quantidade de Fases</label>
          <input
            type="number"
            step="1"
            min="0"
            value={value.quant_fases}
            onChange={(e) => set('quant_fases', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Ex: 3"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={label}>Desligados</label>
          <input
            type="number"
            step="1"
            min="0"
            value={value.desligados}
            onChange={(e) => set('desligados', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default EquipamentoBlock;
