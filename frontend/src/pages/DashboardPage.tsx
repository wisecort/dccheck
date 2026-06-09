import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StatusType = 'OK' | 'FALHA' | 'PENDENTE';

interface SalaStatus {
  id: string;
  nome: string;
  lastRonda: string | null;
  status: StatusType;
}

interface RecentRonda {
  id: string;
  sala: string;
  tecnico: string;
  time: string;
  status: StatusType;
  falha: boolean;
}

interface GeradorDataPoint {
  hora: string;
  loadKW: number | null;
  loadKVA: number | null;
  frequenciaHz: number | null;
}

interface SummaryKpi {
  rondasHoje: number;
  falhasHoje: number;
  itensNOK: number;
  salasPendentes: number;
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------
interface SummaryResponse {
  rondas_hoje: number;
  falhas_hoje: number;
  itens_nok: number;
  salas_pendentes: number;
}

interface SalaStatusResponse {
  sala_id: string;
  slug: string;
  nome: string;
  ultima_ronda: string | null;
  falhas_hoje: number;
  tem_ronda_hoje: boolean;
}

interface GeradorResponse {
  data: string;
  hora: string;
  sala_slug: string;
  kw: number | null;
  kva: number | null;
  frequencia: number | null;
  tensao: number | null;
  corrente: number | null;
}

interface RondaListItem {
  id: string;
  sala_id: string;
  data: string;
  hora_entrada: string;
  hora_saida: string | null;
  falha_geral: boolean;
  sala_nome: string;
  tecnico_username: string;
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<StatusType, { bg: string; color: string; border: string; label: string }> = {
  OK: { bg: 'var(--dc-green-light)', color: '#15803D', border: 'var(--dc-green)', label: 'OK' },
  FALHA: { bg: 'var(--dc-red-light)', color: '#B91C1C', border: 'var(--dc-red)', label: 'FALHA' },
  PENDENTE: { bg: 'rgba(100,116,139,0.1)', color: 'var(--dc-text-sec)', border: 'var(--dc-border)', label: 'Pendente' },
};

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status];
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
// KPI Card
// ---------------------------------------------------------------------------
interface KpiCardProps {
  label: string;
  value: number;
  icon: string;
  accentColor: string;
  accentBg: string;
  highlight: boolean;
}

function KpiCard({ label, value, icon, accentColor, accentBg, highlight }: KpiCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--dc-white)',
        border: highlight ? `1px solid ${accentColor}` : '1px solid var(--dc-border)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--dc-text-sec)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: accentBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 800,
          color: highlight ? accentColor : 'var(--dc-text-main)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '15px',
        fontWeight: 700,
        color: 'var(--dc-blue)',
        margin: '0 0 14px',
        paddingBottom: '8px',
        borderBottom: '2px solid var(--dc-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Sala status card
// ---------------------------------------------------------------------------
const STATUS_BORDER: Record<StatusType, string> = {
  OK: 'var(--dc-green)',
  FALHA: 'var(--dc-red)',
  PENDENTE: 'var(--dc-border)',
};

function SalaCard({ sala }: { sala: SalaStatus }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--dc-white)',
        border: '1px solid var(--dc-border)',
        borderLeft: `4px solid ${STATUS_BORDER[sala.status]}`,
        borderRadius: '10px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--dc-text-main)',
            lineHeight: 1.3,
          }}
        >
          {sala.nome}
        </span>
        <StatusBadge status={sala.status} />
      </div>
      <div style={{ fontSize: '12px', color: 'var(--dc-text-sec)' }}>
        {sala.lastRonda
          ? `Última ronda: ${sala.lastRonda}`
          : 'Sem ronda hoje'}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatLastRonda(ultima: string | null, temHoje: boolean): string | null {
  if (!ultima) return null;
  if (temHoje) return 'hoje';
  // Parse YYYY-MM-DD into a local pt-BR DD/MM
  const [y, m, d] = ultima.split('-');
  if (y && m && d) return `${d}/${m}/${y.slice(2)}`;
  return ultima;
}

function statusFromSala(sala: SalaStatusResponse): StatusType {
  if (!sala.tem_ronda_hoje) return 'PENDENTE';
  if (sala.falhas_hoje > 0) return 'FALHA';
  return 'OK';
}

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------
export function DashboardPage() {
  const [kpi, setKpi] = useState<SummaryKpi | null>(null);
  const [salas, setSalas] = useState<SalaStatus[]>([]);
  const [gerador, setGerador] = useState<GeradorDataPoint[]>([]);
  const [recentRondas, setRecentRondas] = useState<RecentRonda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, salasRes, geradorRes, rondasRes] = await Promise.all([
          api.get<SummaryResponse>('/dashboard/summary'),
          api.get<SalaStatusResponse[]>('/dashboard/salas-status'),
          api.get<GeradorResponse[]>('/dashboard/gerador-historico', {
            params: { limite: 30 },
          }),
          api.get<RondaListItem[]>('/rondas/'),
        ]);

        if (cancelled) return;

        setKpi({
          rondasHoje: summaryRes.data.rondas_hoje,
          falhasHoje: summaryRes.data.falhas_hoje,
          itensNOK: summaryRes.data.itens_nok,
          salasPendentes: summaryRes.data.salas_pendentes,
        });

        setSalas(
          salasRes.data.map((s) => ({
            id: s.sala_id,
            nome: s.nome,
            lastRonda: formatLastRonda(s.ultima_ronda, s.tem_ronda_hoje),
            status: statusFromSala(s),
          })),
        );

        setGerador(
          geradorRes.data.map((g) => ({
            hora: (g.hora || '').slice(0, 5),
            loadKW: g.kw,
            loadKVA: g.kva,
            frequenciaHz: g.frequencia,
          })),
        );

        setRecentRondas(
          rondasRes.data.slice(0, 5).map((r) => ({
            id: r.id,
            sala: r.sala_nome,
            tecnico: r.tecnico_username,
            time: (r.hora_entrada || '').slice(0, 5),
            status: r.falha_geral ? 'FALHA' : 'OK',
            falha: r.falha_geral,
          })),
        );
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError('Não foi possível carregar os dados do dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasGeradorData = gerador.some(
    (g) => g.loadKW != null || g.loadKVA != null || g.frequenciaHz != null,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px' }}>
      {/* Page header */}
      <div>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--dc-text-main)',
            margin: '0 0 4px',
          }}
        >
          Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--dc-text-sec)', textTransform: 'capitalize' }}>
          {today}
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--dc-red-light)',
            border: '1px solid var(--dc-red)',
            borderRadius: '8px',
            color: '#B91C1C',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <section>
        <SectionTitle>📈 Resumo do Dia</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
          }}
          className="dc-kpi-grid"
        >
          <KpiCard
            label="Rondas hoje"
            value={kpi?.rondasHoje ?? 0}
            icon="🔍"
            accentColor="var(--dc-green)"
            accentBg="var(--dc-green-light)"
            highlight={(kpi?.rondasHoje ?? 0) > 0}
          />
          <KpiCard
            label="Falhas hoje"
            value={kpi?.falhasHoje ?? 0}
            icon="🚨"
            accentColor="var(--dc-red)"
            accentBg="var(--dc-red-light)"
            highlight={(kpi?.falhasHoje ?? 0) > 0}
          />
          <KpiCard
            label="Itens NOK"
            value={kpi?.itensNOK ?? 0}
            icon="⚠️"
            accentColor="var(--dc-amber)"
            accentBg="var(--dc-amber-light)"
            highlight={(kpi?.itensNOK ?? 0) > 0}
          />
          <KpiCard
            label="Salas pendentes"
            value={kpi?.salasPendentes ?? 0}
            icon="⏳"
            accentColor="var(--dc-amber)"
            accentBg="var(--dc-amber-light)"
            highlight={(kpi?.salasPendentes ?? 0) > 0}
          />
        </div>
      </section>

      {/* Salas status */}
      <section>
        <SectionTitle>🏢 Status das Salas</SectionTitle>
        {loading && salas.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--dc-text-sec)' }}>Carregando...</div>
        ) : salas.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--dc-text-sec)' }}>Nenhuma sala cadastrada.</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
            className="dc-salas-grid"
          >
            {salas.map((sala) => (
              <SalaCard key={sala.id} sala={sala} />
            ))}
          </div>
        )}
      </section>

      {/* Gerador chart */}
      <section>
        <SectionTitle>⚡ Gerador — Últimos Registros</SectionTitle>
        <div
          style={{
            backgroundColor: 'var(--dc-white)',
            border: '1px solid var(--dc-border)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {!hasGeradorData ? (
            <div
              style={{
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--dc-text-sec)',
                padding: '60px 0',
              }}
            >
              {loading
                ? 'Carregando...'
                : 'Sem leituras de gerador disponíveis ainda.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={gerador}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dc-border)" />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 11, fill: 'var(--dc-text-sec)' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="power"
                  tick={{ fontSize: 11, fill: 'var(--dc-text-sec)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="freq"
                  orientation="right"
                  domain={[58, 62]}
                  tick={{ fontSize: 11, fill: 'var(--dc-text-sec)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--dc-night)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Line
                  yAxisId="power"
                  type="monotone"
                  dataKey="loadKW"
                  name="Load (kW)"
                  stroke="var(--dc-cyan)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="power"
                  type="monotone"
                  dataKey="loadKVA"
                  name="Load (kVA)"
                  stroke="var(--dc-blue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="freq"
                  type="monotone"
                  dataKey="frequenciaHz"
                  name="Frequência (Hz)"
                  stroke="var(--dc-amber)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeDasharray="5 3"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Recent rondas */}
      <section>
        <SectionTitle>🕐 Rondas Recentes</SectionTitle>
        <div
          style={{
            backgroundColor: 'var(--dc-white)',
            border: '1px solid var(--dc-border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {recentRondas.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--dc-text-sec)',
              }}
            >
              {loading ? 'Carregando...' : 'Nenhuma ronda registrada ainda.'}
            </div>
          ) : (
            recentRondas.map((ronda, idx) => (
              <div
                key={ronda.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: ronda.falha ? 'var(--dc-red-light)' : 'transparent',
                  borderBottom:
                    idx < recentRondas.length - 1 ? '1px solid var(--dc-border)' : 'none',
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor:
                      ronda.status === 'OK' ? 'var(--dc-green)' : 'var(--dc-red)',
                    flexShrink: 0,
                  }}
                />

                {/* Sala name */}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: ronda.falha ? '#B91C1C' : 'var(--dc-text-main)',
                    flex: '0 0 140px',
                  }}
                  className="dc-ronda-sala"
                >
                  {ronda.sala}
                </span>

                {/* Technician */}
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--dc-text-sec)',
                    flex: 1,
                  }}
                  className="dc-ronda-tech"
                >
                  {ronda.tecnico}
                </span>

                {/* Time */}
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--dc-text-sec)',
                    fontVariantNumeric: 'tabular-nums',
                    flex: '0 0 50px',
                    textAlign: 'right',
                  }}
                  className="dc-ronda-time"
                >
                  {ronda.time}
                </span>

                {/* Badge */}
                <div style={{ flex: '0 0 70px', textAlign: 'right' }}>
                  <StatusBadge status={ronda.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 1023px) {
          .dc-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dc-salas-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .dc-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dc-salas-grid {
            grid-template-columns: 1fr !important;
          }
          .dc-ronda-tech,
          .dc-ronda-time {
            display: none !important;
          }
          .dc-ronda-sala {
            flex: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
export default DashboardPage;
