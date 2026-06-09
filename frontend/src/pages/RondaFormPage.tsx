import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

import { SalaDetail } from '../types/ronda';

import { CamposComuns } from '../components/ronda/CamposComuns';
import { AcBlock } from '../components/ronda/AcBlock';
import { RackBlock } from '../components/ronda/RackBlock';
import { QdiBlock } from '../components/ronda/QdiBlock';
import { NobreakBlock } from '../components/ronda/NobreakBlock';
import { GeradorBlock } from '../components/ronda/GeradorBlock';
import { CombustivelBlock } from '../components/ronda/CombustivelBlock';
import { EquipamentoBlock } from '../components/ronda/EquipamentoBlock';
import { BancoBateriaBlock } from '../components/ronda/BancoBateriaBlock';
import { ExaustorBlock } from '../components/ronda/ExaustorBlock';
import { ExtintorBlock } from '../components/ronda/ExtintorBlock';
import { useRonda } from '../hooks/useRonda';

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      style={{
        background: 'var(--dc-red-light)',
        border: '1px solid var(--dc-red)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '14px', color: '#991B1B', flex: 1 }}>{message}</div>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#991B1B',
          padding: '0',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

function ValidationErrorList({ errors }: { errors: Array<{ field: string; message: string }> }) {
  if (errors.length === 0) return null;
  return (
    <div
      style={{
        background: 'var(--dc-amber-light)',
        border: '1px solid var(--dc-amber)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>
        Corrija os seguintes erros antes de enviar:
      </div>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {errors.map((e) => (
          <li key={e.field} style={{ fontSize: '13px', color: '#92400E', marginBottom: '3px' }}>
            {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: 'var(--dc-blue)',
        fontSize: '14px',
        gap: '10px',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          border: '2px solid var(--dc-border)',
          borderTop: '2px solid var(--dc-blue)',
          borderRadius: '50%',
          animation: 'dc-spin 0.7s linear infinite',
        }}
      />
      Carregando sala…
      <style>{`@keyframes dc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export function RondaFormPage() {
  const { salaSlug } = useParams<{ salaSlug: string }>();
  const navigate = useNavigate();

  const [sala, setSala] = useState<SalaDetail | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [submitted, setSubmitted] = useState(false);

  const ronda = useRonda();

  // ── Load sala on mount ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!salaSlug) return;

    setLoadingPage(true);
    setLoadError(null);

    api
      .get<SalaDetail>(`/salas/${salaSlug}`)
      .then((res) => {
        setSala(res.data);
        ronda.initSections(
          res.data.itens.map((i) => ({ id: i.id, tipo: i.tipo, identificador: i.identificador })),
          {
            gerador: !!res.data.has_gerador,
            combustivel: !!res.data.has_combustivel,
          }
        );
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail;
        setLoadError(
          typeof detail === 'string' ? detail : `Não foi possível carregar a sala "${salaSlug}".`
        );
      })
      .finally(() => setLoadingPage(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaSlug]);

  // ── Helpers for section management ─────────────────────────────────────────

  function getAcEntry(itemId: string) {
    return ronda.acSections.find((e) => e.itemId === itemId);
  }
  function getRackEntry(itemId: string) {
    return ronda.rackSections.find((e) => e.itemId === itemId);
  }
  function getQdiEntry(itemId: string) {
    return ronda.qdiSections.find((e) => e.itemId === itemId);
  }
  function getNobreakEntry(itemId: string) {
    return ronda.nobreakSections.find((e) => e.itemId === itemId);
  }
  function getEquipamentoEntry(itemId: string) {
    return ronda.equipamentoSections.find((e) => e.itemId === itemId);
  }
  function getBancoBateriaEntry(itemId: string) {
    return ronda.bancoBateriaSections.find((e) => e.itemId === itemId);
  }
  function getExaustorEntry(itemId: string) {
    return ronda.exaustorSections.find((e) => e.itemId === itemId);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = ronda.validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);

    if (!sala) return;

    try {
      const rondaId = await ronda.submit(sala.id);
      setSubmitted(true);
      navigate(`/historico/${rondaId}`);
    } catch {
      // submitError is set inside useRonda.submit
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!salaSlug) {
    return (
      <div style={{ padding: '24px', color: 'var(--dc-red)', fontWeight: 600 }}>
        Sala não informada.
      </div>
    );
  }

  if (loadingPage) return <Spinner />;

  if (loadError) {
    return (
      <div
        style={{
          background: 'var(--dc-red-light)',
          border: '1px solid var(--dc-red)',
          borderRadius: '8px',
          padding: '20px',
          color: '#991B1B',
          fontSize: '14px',
        }}
      >
        {loadError}
      </div>
    );
  }

  if (!sala) return null;

  const acItems = sala.itens.filter((i) => i.tipo === 'ac' || i.tipo === 'ar_condicionado');
  const rackItems = sala.itens.filter((i) => i.tipo === 'rack');
  const qdiItems = sala.itens.filter((i) => i.tipo === 'qdi');
  const nobreakItems = sala.itens.filter((i) => i.tipo === 'nobreak');
  const equipamentoItems = sala.itens.filter((i) => i.tipo === 'equipamento' || i.tipo === 'quadro_eletrico');
  const bancoBateriaItems = sala.itens.filter((i) => i.tipo === 'banco_bateria');
  const exaustorItems = sala.itens.filter((i) => i.tipo === 'exaustor');
  const extintorItems = sala.itens.filter((i) => i.tipo === 'extintor');

  const hasGerador = !!sala.has_gerador;
  const hasCombustivel = !!sala.has_combustivel;

  return (
    <form onSubmit={handleSubmit} noValidate style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* ── Page title ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--dc-blue)',
            margin: '0 0 4px',
          }}
        >
          Novo Check
        </h1>
        <div style={{ fontSize: '14px', color: '#64748B' }}>{sala.nome}</div>
      </div>

      {/* ── Error banners ── */}
      {ronda.submitError && (
        <ErrorBanner message={ronda.submitError} onDismiss={ronda.resetError} />
      )}
      <ValidationErrorList errors={validationErrors} />

      {/* ── Campos comuns ── */}
      <CamposComuns value={ronda.camposComuns} onChange={ronda.setCamposComuns} />

      {/* ── AC blocks ── */}
      {acItems.map((item) => {
        const entry = getAcEntry(item.id);
        if (!entry) return null;
        return (
          <AcBlock
            key={item.id}
            item={item}
            value={entry.state.data}
            onChange={(data) => ronda.setAcSection(item.id, { ...entry.state, data })}
            falha={entry.state.falha}
            observacao={entry.state.observacao}
            onFalhaChange={(falha, observacao) =>
              ronda.setAcSection(item.id, { ...entry.state, falha, observacao })
            }
          />
        );
      })}

      {/* ── Rack blocks ── */}
      {rackItems.map((item) => {
        const entry = getRackEntry(item.id);
        if (!entry) return null;
        return (
          <RackBlock
            key={item.id}
            item={item}
            value={entry.state.data}
            onChange={(data) => ronda.setRackSection(item.id, { ...entry.state, data })}
            falha={entry.state.falha}
            observacao={entry.state.observacao}
            onFalhaChange={(falha, observacao) =>
              ronda.setRackSection(item.id, { ...entry.state, falha, observacao })
            }
          />
        );
      })}

      {/* ── QDI blocks ── */}
      {qdiItems.map((item) => {
        const entry = getQdiEntry(item.id);
        if (!entry) return null;
        return (
          <QdiBlock
            key={item.id}
            item={item}
            value={entry.state.data}
            onChange={(data) => ronda.setQdiSection(item.id, { ...entry.state, data })}
            falha={entry.state.falha}
            observacao={entry.state.observacao}
            onFalhaChange={(falha, observacao) =>
              ronda.setQdiSection(item.id, { ...entry.state, falha, observacao })
            }
          />
        );
      })}

      {/* ── Nobreak blocks ── */}
      {nobreakItems.map((item) => {
        const entry = getNobreakEntry(item.id);
        if (!entry) return null;
        return (
          <NobreakBlock
            key={item.id}
            item={item}
            value={entry.state.data}
            onChange={(data) => ronda.setNobreakSection(item.id, { ...entry.state, data })}
            falha={entry.state.falha}
            observacao={entry.state.observacao}
            onFalhaChange={(falha, observacao) =>
              ronda.setNobreakSection(item.id, { ...entry.state, falha, observacao })
            }
          />
        );
      })}

      {/* ── Equipamento (Quadro Elétrico) blocks ── */}
      {equipamentoItems.map((item) => {
        const entry = getEquipamentoEntry(item.id);
        if (!entry) return null;
        return (
          <EquipamentoBlock
            key={item.id}
            item={item}
            value={entry.state.data}
            onChange={(data) => ronda.setEquipamentoSection(item.id, { ...entry.state, data })}
            falha={entry.state.falha}
            observacao={entry.state.observacao}
            onFalhaChange={(falha) =>
              ronda.setEquipamentoSection(item.id, { ...entry.state, falha, observacao: falha ? entry.state.observacao : '' })
            }
            onObservacaoChange={(observacao) =>
              ronda.setEquipamentoSection(item.id, { ...entry.state, observacao })
            }
          />
        );
      })}

      {/* ── Banco de Bateria blocks ── */}
      {bancoBateriaItems.map((item) => {
        const entry = getBancoBateriaEntry(item.id);
        if (!entry) return null;
        return (
          <BancoBateriaBlock
            key={item.id}
            item={item}
            value={entry.state.data}
            onChange={(data) => ronda.setBancoBateriaSection(item.id, { ...entry.state, data })}
            falha={entry.state.falha}
            observacao={entry.state.observacao}
            onFalhaChange={(falha) =>
              ronda.setBancoBateriaSection(item.id, { ...entry.state, falha, observacao: falha ? entry.state.observacao : '' })
            }
            onObservacaoChange={(observacao) =>
              ronda.setBancoBateriaSection(item.id, { ...entry.state, observacao })
            }
          />
        );
      })}

      {/* ── Exaustor blocks ── */}
      {exaustorItems.map((item) => {
        const entry = getExaustorEntry(item.id);
        if (!entry) return null;
        return (
          <ExaustorBlock
            key={item.id}
            item={item}
            value={entry.state.data}
            onChange={(data) => ronda.setExaustorSection(item.id, { ...entry.state, data })}
            falha={entry.state.falha}
            observacao={entry.state.observacao}
            onFalhaChange={(falha) =>
              ronda.setExaustorSection(item.id, { ...entry.state, falha, observacao: falha ? entry.state.observacao : '' })
            }
            onObservacaoChange={(observacao) =>
              ronda.setExaustorSection(item.id, { ...entry.state, observacao })
            }
          />
        );
      })}

      {/* ── Gerador (salagerador only) ── */}
      {hasGerador && (
        <GeradorBlock
          value={ronda.geradorSection.data}
          onChange={(data) => ronda.setGeradorSection({ ...ronda.geradorSection, data })}
          falha={ronda.geradorSection.falha}
          observacao={ronda.geradorSection.observacao}
          onFalhaChange={(falha, observacao) =>
            ronda.setGeradorSection({ ...ronda.geradorSection, falha, observacao })
          }
        />
      )}

      {/* ── Combustível (salagerador only) ── */}
      {hasCombustivel && (
        <CombustivelBlock
          value={ronda.combustivelSection.data}
          onChange={(data) => ronda.setCombustivelSection({ ...ronda.combustivelSection, data })}
          falha={ronda.combustivelSection.falha}
          observacao={ronda.combustivelSection.observacao}
          onFalhaChange={(falha, observacao) =>
            ronda.setCombustivelSection({ ...ronda.combustivelSection, falha, observacao })
          }
        />
      )}

      {/* ── Extintor blocks (out of scope — placeholder) ── */}
      {extintorItems.map((item) => (
        <ExtintorBlock key={item.id} item={item} />
      ))}

      {/* ── Sticky submit bar ── */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--dc-white)',
          borderTop: '1px solid var(--dc-border)',
          padding: '12px 0',
          marginTop: '8px',
          zIndex: 50,
        }}
        className="dc-submit-bar"
      >
        <button
          type="submit"
          disabled={ronda.loading || submitted}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: ronda.loading || submitted ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            background: ronda.loading || submitted ? '#94A3B8' : 'var(--dc-blue)',
            color: '#FFFFFF',
            transition: 'background 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {ronda.loading ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'dc-spin 0.7s linear infinite',
                }}
              />
              Salvando…
            </>
          ) : submitted ? (
            'Check salvo!'
          ) : (
            'Salvar Check'
          )}
        </button>
      </div>

      <style>{`
        @keyframes dc-spin { to { transform: rotate(360deg); } }

        @media (max-width: 639px) {
          .dc-submit-bar {
            left: 0;
            right: 0;
            padding: 10px 12px 16px;
            margin-left: -12px;
            margin-right: -12px;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
          }
        }
      `}</style>
    </form>
  );
}
export default RondaFormPage;
