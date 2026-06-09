import React from 'react';
import { CamposComunsData, LimpezaValue } from '../../types/ronda';

// ─── Shared style helpers ─────────────────────────────────────────────────────

const styles = {
  card: {
    background: 'var(--dc-white)',
    border: '1px solid var(--dc-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  } as React.CSSProperties,

  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--dc-blue)',
    marginBottom: '14px',
  } as React.CSSProperties,

  fieldGroup: {
    marginBottom: '14px',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    marginBottom: '5px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--dc-border)',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1E293B',
    background: 'var(--dc-white)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  } as React.CSSProperties,

  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--dc-border)',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1E293B',
    background: 'var(--dc-white)',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    outline: 'none',
    minHeight: '72px',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  toggleRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  } as React.CSSProperties,

  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
  } as React.CSSProperties,
};

// ─── Toggle button factory ────────────────────────────────────────────────────

interface ToggleButtonProps {
  label: string;
  active: boolean;
  activeColor: string; // CSS color or var()
  inactiveColor?: string;
  onClick: () => void;
}

function ToggleButton({ label, active, activeColor, inactiveColor = '#E2E8F0', onClick }: ToggleButtonProps) {
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
        background: active ? activeColor : inactiveColor,
        color: active ? '#FFFFFF' : '#64748B',
        transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CamposComunsProps {
  value: CamposComunsData;
  onChange: (data: CamposComunsData) => void;
}

export function CamposComuns({ value, onChange }: CamposComunsProps) {
  function set<K extends keyof CamposComunsData>(key: K, val: CamposComunsData[K]) {
    onChange({ ...value, [key]: val });
  }

  const limpezaOptions: Array<{ value: LimpezaValue; label: string; color: string }> = [
    { value: 'limpo', label: 'Limpo', color: 'var(--dc-green)' },
    { value: 'medio', label: 'Médio', color: 'var(--dc-amber)' },
    { value: 'sujo', label: 'Sujo', color: 'var(--dc-red)' },
  ];

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Campos Comuns</div>

      {/* Horários */}
      <div style={styles.row2}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            Hora entrada <span style={{ color: 'var(--dc-red)' }}>*</span>
          </label>
          <input
            type="time"
            required
            value={value.hora_entrada}
            onChange={(e) => set('hora_entrada', e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Hora saída</label>
          <input
            type="time"
            value={value.hora_saida}
            onChange={(e) => set('hora_saida', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      {/* Limpeza */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Limpeza</label>
        <div style={styles.toggleRow}>
          {limpezaOptions.map((opt) => (
            <ToggleButton
              key={opt.value}
              label={opt.label}
              active={value.limpeza === opt.value}
              activeColor={opt.color}
              onClick={() => set('limpeza', opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Organização / Iluminação / Vazamento */}
      <div style={styles.row3}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Organização</label>
          <div style={styles.toggleRow}>
            <ToggleButton
              label="OK"
              active={value.organizacao === true}
              activeColor="var(--dc-green)"
              onClick={() => set('organizacao', true)}
            />
            <ToggleButton
              label="NOK"
              active={value.organizacao === false}
              activeColor="var(--dc-amber)"
              onClick={() => set('organizacao', false)}
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Iluminação</label>
          <div style={styles.toggleRow}>
            <ToggleButton
              label="OK"
              active={value.iluminacao === true}
              activeColor="var(--dc-green)"
              onClick={() => set('iluminacao', true)}
            />
            <ToggleButton
              label="NOK"
              active={value.iluminacao === false}
              activeColor="var(--dc-amber)"
              onClick={() => set('iluminacao', false)}
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Vazamento</label>
          <div style={styles.toggleRow}>
            <ToggleButton
              label="Sem vazamento"
              active={value.vazamento === true}
              activeColor="var(--dc-green)"
              onClick={() => set('vazamento', true)}
            />
            <ToggleButton
              label="Detectado"
              active={value.vazamento === false}
              activeColor="var(--dc-red)"
              onClick={() => set('vazamento', false)}
            />
          </div>
        </div>
      </div>

      {/* Observações gerais */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Observações gerais</label>
        <textarea
          value={value.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          placeholder="Observações gerais da ronda..."
          style={styles.textarea}
          rows={3}
        />
      </div>
    </div>
  );
}
