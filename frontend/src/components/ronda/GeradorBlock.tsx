import React from 'react';
import { GeradorData, ModoOperacao } from '../../types/ronda';

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
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

const grid4: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
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

interface GeradorBlockProps {
  value: GeradorData;
  onChange: (data: GeradorData) => void;
  falha: boolean;
  observacao: string;
  onFalhaChange: (falha: boolean, observacao: string) => void;
}

export function GeradorBlock({ value, onChange, falha, observacao, onFalhaChange }: GeradorBlockProps) {
  function set<K extends keyof GeradorData>(key: K, val: GeradorData[K]) {
    onChange({ ...value, [key]: val });
  }

  const modoOptions: ModoOperacao[] = ['AUTO', 'MANUAL', 'TEST'];

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
            Gerador
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
            GEN-01
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

      {/* ── Status geral ── */}
      <div style={subHeader}>Status geral</div>

      <div style={grid2}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Modo de operação</label>
          <select
            value={value.modo_operacao}
            onChange={(e) => set('modo_operacao', e.target.value as ModoOperacao)}
            style={selectStyle}
          >
            {modoOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Estado</label>
          <input
            type="text"
            value={value.estado}
            onChange={(e) => set('estado', e.target.value)}
            placeholder="Ex: Em espera, Gerando..."
            style={inputStyle}
          />
        </div>
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Alarmes ativos</label>
        <textarea
          value={value.alarmes_ativos}
          onChange={(e) => set('alarmes_ativos', e.target.value)}
          placeholder="Liste os alarmes ativos ou deixe em branco se nenhum..."
          style={textareaStyle()}
          rows={2}
        />
      </div>

      {/* ── Leituras de carga ── */}
      <div style={subHeader}>Carga e frequência</div>

      <div style={grid3}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Load (kW)</label>
          <input
            type="number"
            step="0.1"
            value={value.load_kw}
            onChange={(e) => set('load_kw', e.target.value)}
            placeholder="Ex: 120.5"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Load (kVA)</label>
          <input
            type="number"
            step="0.1"
            value={value.load_kva}
            onChange={(e) => set('load_kva', e.target.value)}
            placeholder="Ex: 135.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Frequência (Hz)</label>
          <input
            type="number"
            step="0.1"
            value={value.frequencia_hz}
            onChange={(e) => set('frequencia_hz', e.target.value)}
            placeholder="Ex: 60.0"
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Tensões ── */}
      <div style={subHeader}>Tensões (V)</div>

      <div style={grid3}>
        <div style={fieldGroup}>
          <label style={labelStyle}>L1-N (V)</label>
          <input
            type="number"
            step="0.1"
            value={value.tensao_l1_n}
            onChange={(e) => set('tensao_l1_n', e.target.value)}
            placeholder="Ex: 220.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>L2-N (V)</label>
          <input
            type="number"
            step="0.1"
            value={value.tensao_l2_n}
            onChange={(e) => set('tensao_l2_n', e.target.value)}
            placeholder="Ex: 220.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>L3-N (V)</label>
          <input
            type="number"
            step="0.1"
            value={value.tensao_l3_n}
            onChange={(e) => set('tensao_l3_n', e.target.value)}
            placeholder="Ex: 220.0"
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Correntes ── */}
      <div style={subHeader}>Correntes (A)</div>

      <div style={grid3}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Corrente L1 (A)</label>
          <input
            type="number"
            step="0.1"
            value={value.corrente_l1}
            onChange={(e) => set('corrente_l1', e.target.value)}
            placeholder="Ex: 180.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Corrente L2 (A)</label>
          <input
            type="number"
            step="0.1"
            value={value.corrente_l2}
            onChange={(e) => set('corrente_l2', e.target.value)}
            placeholder="Ex: 175.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Corrente L3 (A)</label>
          <input
            type="number"
            step="0.1"
            value={value.corrente_l3}
            onChange={(e) => set('corrente_l3', e.target.value)}
            placeholder="Ex: 182.0"
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Leituras acumuladas ── */}
      <div style={subHeader}>Leituras acumuladas e condições</div>

      <div style={grid4}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Genset (kWh)</label>
          <input
            type="number"
            step="0.1"
            value={value.genset_kwh}
            onChange={(e) => set('genset_kwh', e.target.value)}
            placeholder="Ex: 12500"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Running hours (h)</label>
          <input
            type="number"
            step="0.1"
            value={value.running_hours}
            onChange={(e) => set('running_hours', e.target.value)}
            placeholder="Ex: 850"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Temperatura (°C)</label>
          <input
            type="number"
            step="0.1"
            value={value.temperatura}
            onChange={(e) => set('temperatura', e.target.value)}
            placeholder="Ex: 85.0"
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Tensão bateria (V)</label>
          <input
            type="number"
            step="0.1"
            value={value.tensao_bateria}
            onChange={(e) => set('tensao_bateria', e.target.value)}
            placeholder="Ex: 24.5"
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Datas de teste ── */}
      <div style={subHeader}>Testes programados</div>

      <div style={grid2}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Data último teste</label>
          <input
            type="date"
            value={value.data_ultimo_teste}
            onChange={(e) => set('data_ultimo_teste', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldGroup}>
          <label style={labelStyle}>Data próximo teste</label>
          <input
            type="date"
            value={value.data_proximo_teste}
            onChange={(e) => set('data_proximo_teste', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Manutenção ── */}
      <div style={subHeader}>Manutenção</div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Houve manutenção?</label>
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

      {value.houve_manutencao && (
        <>
          <div style={fieldGroup}>
            <label style={labelStyle}>
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

          <div style={grid2}>
            <div style={fieldGroup}>
              <label style={labelStyle}>
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
              <label style={labelStyle}>
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
