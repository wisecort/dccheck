import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Sala {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
}

interface SalaWithStatus extends Sala {
  icon: string;
  color: string;
  temRondaHoje: boolean;
}

const SALA_META: Record<string, { icon: string; color: string }> = {
  antisala:    { icon: '🚪', color: 'var(--dc-cyan)' },
  salatelecom: { icon: '📡', color: 'var(--dc-amber)' },
  salacofre:   { icon: '🖥️', color: 'var(--dc-blue)' },
  salaenergia: { icon: '⚡', color: 'var(--dc-green)' },
  salagerador: { icon: '🔧', color: 'var(--dc-red)' },
};

function SalaSelectionCard({ sala, onSelect }: { sala: SalaWithStatus; onSelect: (slug: string) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(sala.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '24px',
        backgroundColor: hovered ? 'rgba(0,0,0,0.02)' : 'var(--dc-white)',
        border: `2px solid ${hovered ? sala.color : 'var(--dc-border)'}`,
        borderRadius: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s, box-shadow 0.15s, background-color 0.15s',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
      }}
    >
      {sala.temRondaHoje && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            backgroundColor: 'var(--dc-green-light)',
            border: '1px solid var(--dc-green)',
            borderRadius: '10px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#15803D',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ✓ Concluída
        </div>
      )}

      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          backgroundColor: `${sala.color}18`,
          border: `1px solid ${sala.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          marginBottom: '14px',
        }}
      >
        {sala.icon}
      </div>

      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dc-text-main)', marginBottom: '6px' }}>
        {sala.nome}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--dc-text-sec)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
        {sala.descricao}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: sala.color, marginTop: 'auto' }}>
        {sala.temRondaHoje ? 'Novo check →' : 'Iniciar check →'}
      </div>
    </button>
  );
}

export function NovaRondaPage() {
  const navigate = useNavigate();
  const [salas, setSalas] = useState<SalaWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [salasRes, pendentesRes] = await Promise.all([
          api.get<Sala[]>('/salas/'),
          api.get<Sala[]>('/dashboard/rondas-pendentes').catch(() => ({ data: [] as Sala[] })),
        ]);

        const pendenteSlugs = new Set(pendentesRes.data.map((s: Sala) => s.slug));

        const salasWithStatus: SalaWithStatus[] = salasRes.data.map((s) => ({
          ...s,
          icon: SALA_META[s.slug]?.icon ?? '📋',
          color: SALA_META[s.slug]?.color ?? 'var(--dc-cyan)',
          temRondaHoje: !pendenteSlugs.has(s.slug),
        }));

        setSalas(salasWithStatus);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar salas');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSalaSelect(slug: string) {
    navigate(`/ronda/${slug}/form`);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dc-red)' }}>
        {error}
      </div>
    );
  }

  const rondasConcluidas = salas.filter((s) => s.temRondaHoje).length;
  const totalSalas = salas.length;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--dc-text-main)', margin: '0 0 6px' }}>
          Novo Check
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--dc-text-sec)' }}>
          Selecione a sala para iniciar a inspeção.
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--dc-white)',
          border: '1px solid var(--dc-border)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
              Progresso de hoje
            </span>
            <span style={{ fontSize: '13px', color: 'var(--dc-text-sec)' }}>
              {rondasConcluidas}/{totalSalas} salas
            </span>
          </div>
          <div style={{ height: '8px', backgroundColor: 'var(--dc-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: totalSalas > 0 ? `${(rondasConcluidas / totalSalas) * 100}%` : '0%',
                backgroundColor: rondasConcluidas === totalSalas ? 'var(--dc-green)' : 'var(--dc-cyan)',
                borderRadius: '4px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}
        className="dc-nova-ronda-grid"
      >
        {salas.map((sala) => (
          <SalaSelectionCard key={sala.slug} sala={sala} onSelect={handleSalaSelect} />
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .dc-nova-ronda-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default NovaRondaPage;
