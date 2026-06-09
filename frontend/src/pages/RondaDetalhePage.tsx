import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

// ---------------------------------------------------------------------------
// API types (aligned with backend ronda_service.get_ronda_with_details)
// ---------------------------------------------------------------------------

interface RegistroItemDetail {
  id: string;
  tipo_secao: string | null;
  falha: boolean;
  dados: Record<string, unknown> | null;
  observacao: string | null;
  created_at: string | null;
  item: {
    id: string;
    tipo: string | null;
    identificador: string | null;
    dados_fixos: Record<string, unknown> | null;
  } | null;
  fotos: Array<{ id: string; filename: string; mimetype: string }>;
}

interface RondaDetail {
  id: string;
  data: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  limpeza: 'limpo' | 'medio' | 'sujo';
  organizacao: boolean;
  iluminacao: boolean;
  vazamento: boolean;
  falha_geral: boolean;
  observacoes: string | null;
  created_at: string | null;
  sala: { id: string; slug: string; nome: string; descricao: string | null } | null;
  tecnico: { id: string; username: string; email: string; role: string } | null;
  registros_item: RegistroItemDetail[];
}

// ---------------------------------------------------------------------------
// Section labels + field labels
// ---------------------------------------------------------------------------

const SECAO_TITULOS: Record<string, string> = {
  ac: 'Ar-Condicionado',
  ar_condicionado: 'Ar-Condicionado',
  rack: 'Rack',
  qdi: 'Quadro (QDI)',
  nobreak: 'Nobreak',
  equipamento: 'Quadro Elétrico',
  quadro_eletrico: 'Quadro Elétrico',
  banco_bateria: 'Banco de Bateria',
  exaustor: 'Exaustor',
  gerador: 'Gerador',
  combustivel: 'Combustível',
};

const FIELD_LABELS: Record<string, string> = {
  temperatura: 'Temperatura (°C)',
  temperatura_c: 'Temperatura (°C)',
  houve_manutencao: 'Houve manutenção',
  acao_manutencao: 'Ação de manutenção',
  data_manutencao: 'Data da manutenção',
  data_proxima_manutencao: 'Próxima manutenção',
  data_ultima_manutencao: 'Última manutenção',
  equipamento_problema: 'Equipamento com problema',
  frequencia_hz: 'Frequência (Hz)',
  tensao_f1_n: 'Tensão F1-N (V)',
  tensao_f2_n: 'Tensão F2-N (V)',
  tensao_f3_n: 'Tensão F3-N (V)',
  carga_kw: 'Carga (kW)',
  carga_kvar: 'Carga (kVAr)',
  carga_kva: 'Carga (kVA)',
  carga_l1: 'Carga L1',
  carga_l2: 'Carga L2',
  carga_l3: 'Carga L3',
  quant_fases: 'Quantidade de fases',
  desligados: 'Desligados',
  autonomia_min: 'Autonomia (min)',
  modo_operacao: 'Modo operação',
  estado: 'Estado',
  alarmes_ativos: 'Alarmes ativos',
  load_kw: 'Carga (kW)',
  load_kva: 'Carga (kVA)',
  tensao_l1_n: 'Tensão L1-N (V)',
  tensao_l2_n: 'Tensão L2-N (V)',
  tensao_l3_n: 'Tensão L3-N (V)',
  corrente_l1: 'Corrente L1 (A)',
  corrente_l2: 'Corrente L2 (A)',
  corrente_l3: 'Corrente L3 (A)',
  genset_kwh: 'Genset (kWh)',
  running_hours: 'Horas de operação',
  tensao_bateria: 'Tensão bateria (V)',
  data_ultimo_teste: 'Último teste',
  data_proximo_teste: 'Próximo teste',
  nivel_tanque_uso: 'Nível tanque uso',
  data_abastecimento: 'Data abastecimento',
  nivel_reserva: 'Nível reserva',
  data_abastecimento_reserva: 'Abastecimento reserva',
  data_vencimento_reserva: 'Vencimento reserva',
  mains_tensao_l1_n: 'Rede L1-N (V)',
  mains_tensao_l2_n: 'Rede L2-N (V)',
  mains_tensao_l3_n: 'Rede L3-N (V)',
  mains_frequencia_hz: 'Rede frequência (Hz)',
};

function humanLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
}

function humanValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
}

function titleFor(reg: RegistroItemDetail): string {
  const tipo = reg.tipo_secao ?? reg.item?.tipo ?? '';
  return SECAO_TITULOS[tipo] ?? tipo ?? 'Seção';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function limpezaLabel(v: string): string {
  return v === 'limpo' ? 'Limpo' : v === 'medio' ? 'Médio' : v === 'sujo' ? 'Sujo' : v;
}

// ---------------------------------------------------------------------------
// Small UI
// ---------------------------------------------------------------------------

function Badge({
  text,
  color,
  bg,
  border,
}: {
  text: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 700,
        color,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: '12px',
        padding: '2px 10px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function StatusBadge({ falha }: { falha: boolean }) {
  return falha ? (
    <Badge text="Falha" color="#B91C1C" bg="var(--dc-red-light)" border="var(--dc-red)" />
  ) : (
    <Badge text="OK" color="#15803D" bg="var(--dc-green-light)" border="var(--dc-green)" />
  );
}

function BoolBadge({ value, invertColor = false }: { value: boolean; invertColor?: boolean }) {
  // invertColor: true means "true" is bad (e.g. vazamento)
  const good = invertColor ? !value : value;
  return good ? (
    <Badge text={value ? 'Sim' : 'Não'} color="#15803D" bg="var(--dc-green-light)" border="var(--dc-green)" />
  ) : (
    <Badge text={value ? 'Sim' : 'Não'} color="#B91C1C" bg="var(--dc-red-light)" border="var(--dc-red)" />
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

function SecaoCard({ reg, index }: { reg: RegistroItemDetail; index: number }) {
  const isFalha = reg.falha;
  const titulo = titleFor(reg);
  const ident = reg.item?.identificador ?? `#${index + 1}`;
  const entries = Object.entries(reg.dados ?? {}).filter(
    ([k]) => !['acao_manutencao'].includes(k) || true
  );

  return (
    <div
      style={{
        backgroundColor: isFalha ? 'var(--dc-red-light)' : 'var(--dc-white)',
        border: `1px solid ${isFalha ? 'var(--dc-red)' : 'var(--dc-border)'}`,
        borderLeft: `4px solid ${isFalha ? 'var(--dc-red)' : 'var(--dc-green)'}`,
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${isFalha ? 'rgba(239,68,68,0.2)' : 'var(--dc-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dc-text-main)' }}>
            {titulo}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--dc-text-sec)',
              marginLeft: '8px',
              fontFamily: '"JetBrains Mono", "Fira Mono", monospace',
            }}
          >
            {ident}
          </span>
        </div>
        <StatusBadge falha={isFalha} />
      </div>

      {entries.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1px',
            backgroundColor: 'var(--dc-border)',
          }}
          className="dc-secao-items-grid"
        >
          {entries.map(([key, value]) => (
            <div
              key={key}
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--dc-white)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 500 }}>
                {humanLabel(key)}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
                {humanValue(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {isFalha && reg.observacao && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderTop: '1px solid rgba(239,68,68,0.2)',
            fontSize: '13px',
            color: '#7F1D1D',
          }}
        >
          <strong>Observação: </strong>
          {reg.observacao}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function RondaDetalhePage() {
  const navigate = useNavigate();
  const { rondaId } = useParams<{ rondaId: string }>();

  const [ronda, setRonda] = useState<RondaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rondaId) return;
    setLoading(true);
    api
      .get<RondaDetail>(`/rondas/${rondaId}/detail`)
      .then((res) => setRonda(res.data))
      .catch((err) => {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Não foi possível carregar o check.');
      })
      .finally(() => setLoading(false));
  }, [rondaId]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dc-text-sec)' }}>
        Carregando check…
      </div>
    );
  }

  if (error || !ronda) {
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
        {error ?? 'Check não encontrado.'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Back + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'var(--dc-white)',
            border: '1px solid var(--dc-border)',
            borderRadius: '8px',
            color: 'var(--dc-text-main)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Voltar
        </button>

        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'var(--dc-blue)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🖨 Imprimir / Exportar
        </button>
      </div>

      {/* Header card */}
      <div
        style={{
          backgroundColor: ronda.falha_geral ? 'var(--dc-red-light)' : 'var(--dc-white)',
          border: `1px solid ${ronda.falha_geral ? 'var(--dc-red)' : 'var(--dc-border)'}`,
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: ronda.falha_geral ? '#B91C1C' : 'var(--dc-text-main)',
                margin: '0 0 4px',
              }}
            >
              {ronda.sala?.nome ?? 'Sala'}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--dc-text-sec)' }}>
              Check #{ronda.id.slice(0, 8)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <StatusBadge falha={ronda.falha_geral} />
            {ronda.falha_geral && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--dc-red)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 10px',
                  letterSpacing: '0.04em',
                }}
              >
                🚨 FALHA
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
          className="dc-detalhe-meta-grid"
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
              Data
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
              {formatDate(ronda.data)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
              Entrada
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
              {ronda.hora_entrada?.slice(0, 5) ?? '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
              Saída
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
              {ronda.hora_saida?.slice(0, 5) ?? '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
              Técnico
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
              {ronda.tecnico?.username ?? '—'}
            </div>
          </div>
        </div>

        {ronda.observacoes && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--dc-text-main)',
              lineHeight: 1.6,
            }}
          >
            <strong>Observações: </strong>
            {ronda.observacoes}
          </div>
        )}
      </div>

      {/* Campos comuns */}
      <section style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--dc-blue)',
            margin: '0 0 12px',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--dc-border)',
          }}
        >
          🔍 Campos Comuns
        </h2>
        <div
          style={{
            backgroundColor: 'var(--dc-white)',
            border: '1px solid var(--dc-border)',
            borderRadius: '10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            overflow: 'hidden',
          }}
          className="dc-campos-comuns-grid"
        >
          <div style={{ padding: '14px 16px', borderRight: '1px solid var(--dc-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Limpeza
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{limpezaLabel(ronda.limpeza)}</span>
          </div>
          <div style={{ padding: '14px 16px', borderRight: '1px solid var(--dc-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Organização
            </span>
            <BoolBadge value={ronda.organizacao} />
          </div>
          <div style={{ padding: '14px 16px', borderRight: '1px solid var(--dc-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Iluminação
            </span>
            <BoolBadge value={ronda.iluminacao} />
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--dc-text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Vazamento
            </span>
            <BoolBadge value={ronda.vazamento} />
          </div>
        </div>
      </section>

      {/* Itens verificados */}
      <section style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--dc-blue)',
            margin: '0 0 12px',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--dc-border)',
          }}
        >
          🗂 Itens Verificados ({ronda.registros_item.length})
        </h2>
        {ronda.registros_item.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--dc-text-sec)',
              fontSize: '13px',
              backgroundColor: 'var(--dc-white)',
              border: '1px dashed var(--dc-border)',
              borderRadius: '10px',
            }}
          >
            Nenhum item registrado neste check.
          </div>
        ) : (
          ronda.registros_item.map((reg, i) => <SecaoCard key={reg.id} reg={reg} index={i} />)
        )}
      </section>

      <style>{`
        @media (max-width: 640px) {
          .dc-detalhe-meta-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .dc-campos-comuns-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dc-secao-items-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .dc-detalhe-meta-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
export default RondaDetalhePage;
