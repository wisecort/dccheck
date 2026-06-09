import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type UserRole = 'tecnico' | 'gestor' | 'admin';

interface RondaListItem {
  id: string;
  sala_id: string;
  data: string; // YYYY-MM-DD
  tecnico_id: string;
  hora_entrada: string; // HH:MM:SS
  hora_saida: string | null;
  limpeza: string;
  organizacao: boolean;
  iluminacao: boolean;
  vazamento: boolean;
  falha_geral: boolean;
  observacoes: string | null;
  created_at: string;
  sala_nome: string;
  tecnico_username: string;
}

interface Sala {
  id: string;
  slug: string;
  nome: string;
}

interface FilterState {
  sala: string;       // slug
  tecnico: string;    // username
  dataInicio: string;
  dataFim: string;
  comFalha: boolean;
}

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useAuth() {
  const stored = sessionStorage.getItem('dccheck_user');
  if (stored) {
    try {
      return JSON.parse(stored) as { username: string; role: UserRole };
    } catch { /* empty */ }
  }
  return { username: 'Usuário', role: 'tecnico' as UserRole };
}

function formatDateTime(dataISO: string, hora: string) {
  // dataISO = "2026-04-08", hora = "07:19:00"
  const [y, m, d] = dataISO.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm);
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ falha }: { falha: boolean }) {
  const cfg = falha
    ? { bg: 'var(--dc-red-light)', color: '#B91C1C', border: 'var(--dc-red)', label: 'FALHA' }
    : { bg: 'var(--dc-green-light)', color: '#15803D', border: 'var(--dc-green)', label: 'OK' };
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 700,
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        padding: '2px 8px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Confirm modal
// ---------------------------------------------------------------------------
function ConfirmModal({ rondaId, onConfirm, onCancel }: { rondaId: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--dc-white)',
          borderRadius: '14px',
          padding: '28px',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--dc-text-main)', margin: '0 0 8px' }}>
          Excluir ronda
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--dc-text-sec)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Tem certeza que deseja excluir a ronda <strong>#{rondaId.slice(0, 8)}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              backgroundColor: 'transparent',
              border: '1px solid var(--dc-border)',
              borderRadius: '8px',
              color: 'var(--dc-text-main)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 18px',
              backgroundColor: 'var(--dc-red)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar styles
// ---------------------------------------------------------------------------
const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--dc-border)',
  borderRadius: '8px',
  backgroundColor: 'var(--dc-white)',
  color: 'var(--dc-text-main)',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--dc-border)',
  borderRadius: '8px',
  backgroundColor: 'var(--dc-white)',
  color: 'var(--dc-text-main)',
  fontSize: '13px',
  outline: 'none',
};

// ---------------------------------------------------------------------------
// HistoricoPage
// ---------------------------------------------------------------------------
export function HistoricoPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDelete = role === 'gestor' || role === 'admin';

  const [rondas, setRondas] = useState<RondaListItem[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    sala: '',
    tecnico: '',
    dataInicio: '',
    dataFim: '',
    comFalha: false,
  });
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Load salas once for the filter dropdown
  useEffect(() => {
    api.get<Sala[]>('/salas/').then((res) => setSalas(res.data)).catch(() => {});
  }, []);

  // Load rondas (server-side filters)
  const loadRondas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | boolean> = {};
      if (filters.sala) params.sala = filters.sala;
      if (filters.dataInicio) params.data_inicio = filters.dataInicio;
      if (filters.dataFim) params.data_fim = filters.dataFim;
      if (filters.comFalha) params.falha = true;

      const res = await api.get<RondaListItem[]>('/rondas/', { params });
      setRondas(res.data);
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      setError(detail || (e instanceof Error ? e.message : 'Erro ao carregar rondas.'));
      setRondas([]);
    } finally {
      setLoading(false);
    }
  }, [filters.sala, filters.dataInicio, filters.dataFim, filters.comFalha]);

  useEffect(() => {
    loadRondas();
  }, [loadRondas]);

  // Build técnico options from the loaded rondas (so it always reflects existing data)
  const tecnicoOptions = useMemo(() => {
    const set = new Set<string>();
    rondas.forEach((r) => r.tecnico_username && set.add(r.tecnico_username));
    return Array.from(set).sort();
  }, [rondas]);

  // Client-side técnico filter (server doesn't accept username, only id)
  const filtered = useMemo(() => {
    return rondas.filter((r) => {
      if (filters.tecnico && r.tecnico_username !== filters.tecnico) return false;
      return true;
    });
  }, [rondas, filters.tecnico]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateFilter(key: keyof FilterState, value: string | boolean) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/rondas/${deleteTarget}`);
      setDeleteTarget(null);
      await loadRondas();
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      setError((e as AxiosLike)?.response?.data?.detail || 'Erro ao excluir ronda.');
      setDeleteTarget(null);
    }
  }

  function clearFilters() {
    setFilters({ sala: '', tecnico: '', dataInicio: '', dataFim: '', comFalha: false });
    setPage(1);
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--dc-text-main)', margin: '0 0 4px' }}>
          Histórico de Checks
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--dc-text-sec)' }}>
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--dc-red-light)',
            border: '1px solid var(--dc-red)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '12px',
            color: '#991B1B',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}>
            ✕
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div
        style={{
          backgroundColor: 'var(--dc-white)',
          border: '1px solid var(--dc-border)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <select value={filters.sala} onChange={(e) => updateFilter('sala', e.target.value)} style={selectStyle}>
          <option value="">Todas as salas</option>
          {salas.map((s) => (
            <option key={s.id} value={s.slug}>{s.nome}</option>
          ))}
        </select>

        <select value={filters.tecnico} onChange={(e) => updateFilter('tecnico', e.target.value)} style={selectStyle}>
          <option value="">Todos os técnicos</option>
          {tecnicoOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dataInicio}
          onChange={(e) => updateFilter('dataInicio', e.target.value)}
          style={inputStyle}
          title="Data início"
        />

        <input
          type="date"
          value={filters.dataFim}
          onChange={(e) => updateFilter('dataFim', e.target.value)}
          style={inputStyle}
          title="Data fim"
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--dc-text-main)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <input
            type="checkbox"
            checked={filters.comFalha}
            onChange={(e) => updateFilter('comFalha', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--dc-red)', cursor: 'pointer' }}
          />
          Com falha
        </label>

        <button
          onClick={clearFilters}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            backgroundColor: 'transparent',
            border: '1px solid var(--dc-border)',
            borderRadius: '8px',
            color: 'var(--dc-text-sec)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Limpar filtros
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--dc-white)',
          border: '1px solid var(--dc-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--dc-bg)', borderBottom: '2px solid var(--dc-border)' }}>
                {['Data/Hora', 'Sala', 'Técnico', 'Status', 'Ações'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--dc-text-sec)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--dc-text-sec)' }}>
                    Carregando…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--dc-text-sec)', fontSize: '14px' }}>
                    Nenhum check encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paged.map((ronda, idx) => (
                  <tr
                    key={ronda.id}
                    style={{
                      backgroundColor: ronda.falha_geral ? 'var(--dc-red-light)' : 'transparent',
                      borderBottom: idx < paged.length - 1 ? '1px solid var(--dc-border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--dc-text-main)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatDateTime(ronda.data, ronda.hora_entrada)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: ronda.falha_geral ? '#B91C1C' : 'var(--dc-text-main)', whiteSpace: 'nowrap' }}>
                      {ronda.sala_nome}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--dc-text-sec)', whiteSpace: 'nowrap' }}>
                      {ronda.tecnico_username}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge falha={ronda.falha_geral} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => navigate(`/historico/${ronda.id}`, { state: { from: 'historico' } })}
                          title="Ver detalhes"
                          style={{
                            padding: '5px 10px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--dc-border)',
                            borderRadius: '6px',
                            color: 'var(--dc-blue)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Ver →
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(ronda.id)}
                            title="Excluir ronda"
                            style={{
                              padding: '5px 8px',
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: '6px',
                              color: 'var(--dc-red)',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '7px 14px',
              backgroundColor: 'var(--dc-white)',
              border: '1px solid var(--dc-border)',
              borderRadius: '8px',
              color: page === 1 ? 'var(--dc-text-sec)' : 'var(--dc-text-main)',
              fontSize: '13px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            ← Anterior
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: p === page ? '2px solid var(--dc-cyan)' : '1px solid var(--dc-border)',
                  backgroundColor: p === page ? 'var(--dc-cyan-light)' : 'var(--dc-white)',
                  color: p === page ? 'var(--dc-blue)' : 'var(--dc-text-main)',
                  fontSize: '13px',
                  fontWeight: p === page ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '7px 14px',
              backgroundColor: 'var(--dc-white)',
              border: '1px solid var(--dc-border)',
              borderRadius: '8px',
              color: page === totalPages ? 'var(--dc-text-sec)' : 'var(--dc-text-main)',
              fontSize: '13px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Próxima →
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'var(--dc-text-sec)' }}>
          Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          rondaId={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
export default HistoricoPage;
