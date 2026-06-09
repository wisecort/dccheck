import React from 'react';
import { AcData, ItemSala } from '../../types/ronda';

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

function textareaStyle(required?: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${required ? 'var(--dc-red)' : 'var(--dc-border)'}`,
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

interface AcBlockProps {
  item: ItemSala;
  value: AcData;
  onChange: (data: AcData) => void;
  falha: boolean;
  observacao: string;
  onFalhaChange: (falha: boolean, observacao: string) => void;
}

export function AcBlock({ item, value, onChange, falha, observacao, onFalhaChange }: AcBlockProps) {
  function set<K extends keyof AcData>(key: K, val: AcData[K]) {
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
            Ar-condicionado
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
          <label style={{ ...label, color: 'var(--dc-red)' }}>
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

      {/* Temperatura */}
      <div style={fieldGroup}>
        <label style={label}>Temperatura (°C)</label>
        <input
          type="number"
          step="0.1"
          value={value.temperatura}
          onChange={(e) => set('temperatura', e.target.value)}
          placeholder="Ex: 20.5"
          style={inputStyle}
        />
      </div>

      {/* Houve manutenção */}
      <div style={fieldGroup}>
        <label style={label}>Houve manutenção?</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ToggleButton
            label="Sim"
            active={value.houve_manutencao === true}
            activeColor="var(--dc-amber)"
            onClick={() => set('houve_manutencao', true)}
          />
          <ToggleButton
            label="Não"
            active={value.houve_manutencao === false}
            activeColor="var(--dc-green)"
            onClick={() => set('houve_manutencao', false)}
          />
        </div>
      </div>

      {/* Manutenção conditional fields */}
      {value.houve_manutencao && (
        <>
          <div style={fieldGroup}>
            <label style={label}>
              Ação de manutenção <span style={{ color: 'var(--dc-red)' }}>*</span>
            </label>
            <textarea
              required
              value={value.acao_manutencao}
              onChange={(e) => set('acao_manutencao', e.target.value)}
              placeholder="Descreva a ação realizada..."
              style={textareaStyle()}
              rows={3}
            />
          </div>

          <div style={row2}>
            <div style={fieldGroup}>
              <label style={label}>
                Data da manutenção <span style={{ color: 'var(--dc-red)' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={value.data_manutencao}
                onChange={(e) => set('data_manutencao', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldGroup}>
              <label style={label}>
                Data da próxima manutenção <span style={{ color: 'var(--dc-red)' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={value.data_proxima_manutencao}
                onChange={(e) => set('data_proxima_manutencao', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
