import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Sala {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  has_gerador: boolean;
  has_combustivel: boolean;
}

interface Item {
  id: string;
  sala_id: string;
  tipo: string;
  identificador: string;
  dados_fixos: Record<string, unknown>;
  ativo: boolean;
  ordem: number;
}

// Tipos suportados pelo formulário de check (precisa bater com RondaFormPage)
const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'ac', label: 'Ar-condicionado' },
  { value: 'rack', label: 'Rack' },
  { value: 'qdi', label: 'QDI (Quadro Distribuição)' },
  { value: 'nobreak', label: 'Nobreak / UPS' },
  { value: 'equipamento', label: 'Equipamento / Quadro Elétrico' },
  { value: 'banco_bateria', label: 'Banco de Bateria' },
  { value: 'exaustor', label: 'Exaustor' },
  { value: 'extintor', label: 'Extintor' },
];

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------
function tryParseJson(
  str: string
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!str.trim()) return { ok: true, value: {} };
  try {
    const val = JSON.parse(str);
    if (typeof val !== 'object' || Array.isArray(val) || val === null) {
      return { ok: false, error: 'Deve ser um objeto JSON {}' };
    }
    return { ok: true, value: val };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function formatJson(obj: Record<string, unknown>) {
  return JSON.stringify(obj, null, 2);
}

// ---------------------------------------------------------------------------
// Sala modal
// ---------------------------------------------------------------------------
interface SalaModalProps {
  sala?: Sala;
  onSave: (data: { slug: string; nome: string; descricao: string; has_gerador: boolean; has_combustivel: boolean }) => Promise<void>;
  onClose: () => void;
}

function SalaModal({ sala, onSave, onClose }: SalaModalProps) {
  const isEdit = !!sala;
  const [slug, setSlug] = useState(sala?.slug ?? '');
  const [nome, setNome] = useState(sala?.nome ?? '');
  const [descricao, setDescricao] = useState(sala?.descricao ?? '');
  const [hasGerador, setHasGerador] = useState(sala?.has_gerador ?? false);
  const [hasCombustivel, setHasCombustivel] = useState(sala?.has_combustivel ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!nome.trim()) { setError('Informe o nome.'); return; }
    if (!isEdit && !/^[a-z0-9_-]{2,32}$/.test(slug)) {
      setError('Slug inválido (use letras minúsculas, números, _ ou -).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        slug: slug.trim(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        has_gerador: hasGerador,
        has_combustivel: hasCombustivel,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={isEdit ? 'Editar Sala' : 'Nova Sala'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Slug *">
          <input
            type="text"
            value={slug}
            disabled={isEdit}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="ex: sala-tecnica"
            style={inputStyle}
          />
          {!isEdit && (
            <p style={hintStyle}>Identificador único usado na URL. Não pode ser alterado depois.</p>
          )}
        </Field>

        <Field label="Nome *">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="ex: Sala Técnica"
            style={inputStyle}
          />
        </Field>

        <Field label="Descrição">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Field>

        <CheckboxRow
          label="Possui Gerador (renderizar seção Gerador no check)"
          checked={hasGerador}
          onChange={setHasGerador}
        />
        <CheckboxRow
          label="Possui Tanque de Combustível (renderizar seção Combustível)"
          checked={hasCombustivel}
          onChange={setHasCombustivel}
        />

        {error && <ErrorText>{error}</ErrorText>}
      </div>

      <ModalActions
        onClose={onClose}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={isEdit ? 'Salvar alterações' : 'Criar sala'}
      />
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Item modal
// ---------------------------------------------------------------------------
interface ItemModalProps {
  salaNome: string;
  item?: Item;
  onSave: (data: {
    tipo: string;
    identificador: string;
    dados_fixos: Record<string, unknown>;
    ordem: number;
    ativo: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

function ItemModal({ salaNome, item, onSave, onClose }: ItemModalProps) {
  const isEdit = !!item;
  const [tipo, setTipo] = useState(item?.tipo ?? '');
  const [identificador, setIdentificador] = useState(item?.identificador ?? '');
  const [dadosFixosStr, setDadosFixosStr] = useState(item ? formatJson(item.dados_fixos) : '{}');
  const [ordem, setOrdem] = useState<number>(item?.ordem ?? 0);
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const jsonCheck = tryParseJson(dadosFixosStr);
  const jsonError = jsonCheck.ok ? '' : jsonCheck.error;

  async function handleSubmit() {
    if (!tipo) { setError('Selecione o tipo.'); return; }
    if (!identificador.trim()) { setError('Informe o identificador.'); return; }
    if (!jsonCheck.ok) { setError('JSON inválido em Dados Fixos.'); return; }

    setSaving(true);
    setError('');
    try {
      await onSave({
        tipo,
        identificador: identificador.trim(),
        dados_fixos: jsonCheck.value,
        ordem: Number(ordem) || 0,
        ativo,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar Item' : 'Adicionar Item'}
      subtitle={salaNome}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Tipo *">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
            <option value="">Selecione…</option>
            {TIPO_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Identificador *">
          <input
            type="text"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="ex: AC-01, RACK-02"
            style={inputStyle}
          />
        </Field>

        <Field label="Dados Fixos (JSON)">
          <p style={hintStyle}>Parâmetros estáticos do equipamento. Ex: {'{"capacidade":"12kW"}'}</p>
          <textarea
            value={dadosFixosStr}
            onChange={(e) => setDadosFixosStr(e.target.value)}
            rows={5}
            style={{
              ...inputStyle,
              fontFamily: 'monospace',
              fontSize: '13px',
              resize: 'vertical',
              borderColor: jsonError ? 'var(--dc-red)' : 'var(--dc-border)',
            }}
          />
          {jsonError && <p style={{ ...hintStyle, color: 'var(--dc-red)' }}>{jsonError}</p>}
        </Field>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
          <Field label="Ordem">
            <input
              type="number"
              min={0}
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              style={{ ...inputStyle, width: '100px' }}
            />
          </Field>
          <CheckboxRow label="Ativo" checked={ativo} onChange={setAtivo} />
        </div>

        {error && <ErrorText>{error}</ErrorText>}
      </div>

      <ModalActions
        onClose={onClose}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={isEdit ? 'Salvar alterações' : 'Adicionar item'}
        disabled={!!jsonError}
      />
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Shared modal primitives
// ---------------------------------------------------------------------------
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  border: '1px solid var(--dc-border)',
  borderRadius: '8px',
  backgroundColor: 'var(--dc-white)',
  color: 'var(--dc-text-main)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const hintStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '11px',
  color: 'var(--dc-text-sec)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--dc-text-main)',
          marginBottom: '5px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        color: 'var(--dc-text-main)',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', accentColor: 'var(--dc-cyan)', cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--dc-red-light)',
        border: '1px solid var(--dc-red)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: '#991B1B',
        fontSize: '12px',
      }}
    >
      {children}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--dc-white)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--dc-text-main)', margin: 0 }}>
              {title}
            </h3>
            {subtitle && (
              <div style={{ fontSize: '12px', color: 'var(--dc-text-sec)', marginTop: '2px' }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: '1px solid var(--dc-border)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '18px',
              color: 'var(--dc-text-sec)',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onClose,
  onSubmit,
  saving,
  submitLabel,
  disabled,
}: {
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  submitLabel: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
      <button
        onClick={onClose}
        disabled={saving}
        style={{
          padding: '9px 18px',
          backgroundColor: 'transparent',
          border: '1px solid var(--dc-border)',
          borderRadius: '8px',
          color: 'var(--dc-text-main)',
          fontSize: '14px',
          fontWeight: 500,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        Cancelar
      </button>
      <button
        onClick={onSubmit}
        disabled={saving || disabled}
        style={{
          padding: '9px 20px',
          backgroundColor: saving || disabled ? 'rgba(0,180,216,0.4)' : 'var(--dc-cyan)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          cursor: saving || disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Salvando…' : submitLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminPage
// ---------------------------------------------------------------------------
export function AdminPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [activeSalaId, setActiveSalaId] = useState<string | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [salaModal, setSalaModal] = useState<{ open: boolean; sala?: Sala }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; item?: Item }>({ open: false });

  const [error, setError] = useState<string | null>(null);

  // ── Load salas ────────────────────────────────────────────────────────────
  const loadSalas = useCallback(async () => {
    setLoadingSalas(true);
    setError(null);
    try {
      const res = await api.get<Sala[]>('/salas/');
      setSalas(res.data);
      if (res.data.length > 0) {
        setActiveSalaId((prev) => prev ?? res.data[0].id);
      } else {
        setActiveSalaId(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar salas.');
    } finally {
      setLoadingSalas(false);
    }
  }, []);

  useEffect(() => {
    loadSalas();
  }, [loadSalas]);

  // ── Load items for active sala ────────────────────────────────────────────
  const loadItems = useCallback(async (salaId: string) => {
    setLoadingItems(true);
    try {
      const res = await api.get<Item[]>(`/itens/sala/${salaId}`);
      setItems(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar itens.');
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (activeSalaId) loadItems(activeSalaId);
    else setItems([]);
  }, [activeSalaId, loadItems]);

  const activeSala = salas.find((s) => s.id === activeSalaId) ?? null;

  // ── Sala handlers ─────────────────────────────────────────────────────────
  async function handleSaveSala(data: { slug: string; nome: string; descricao: string; has_gerador: boolean; has_combustivel: boolean }) {
    const editing = salaModal.sala;
    try {
      if (editing) {
        await api.put<Sala>(`/salas/${editing.slug}`, {
          nome: data.nome,
          descricao: data.descricao || null,
          has_gerador: data.has_gerador,
          has_combustivel: data.has_combustivel,
        });
      } else {
        const res = await api.post<Sala>('/salas/', {
          slug: data.slug,
          nome: data.nome,
          descricao: data.descricao || null,
          has_gerador: data.has_gerador,
          has_combustivel: data.has_combustivel,
        });
        setActiveSalaId(res.data.id);
      }
      setSalaModal({ open: false });
      await loadSalas();
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      throw new Error(detail || (e instanceof Error ? e.message : 'Erro ao salvar sala.'));
    }
  }

  async function handleDeleteSala(sala: Sala) {
    if (!confirm(`Excluir sala "${sala.nome}"? Todos os itens e checks dela serão removidos. Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/salas/${sala.slug}`);
      if (activeSalaId === sala.id) setActiveSalaId(null);
      await loadSalas();
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      setError(detail || (e instanceof Error ? e.message : 'Erro ao excluir sala.'));
    }
  }

  // ── Item handlers ─────────────────────────────────────────────────────────
  async function handleSaveItem(data: {
    tipo: string;
    identificador: string;
    dados_fixos: Record<string, unknown>;
    ordem: number;
    ativo: boolean;
  }) {
    if (!activeSala) return;
    try {
      if (itemModal.item) {
        await api.put(`/itens/${itemModal.item.id}`, data);
      } else {
        await api.post('/itens/', { sala_id: activeSala.id, ...data });
      }
      setItemModal({ open: false });
      await loadItems(activeSala.id);
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      throw new Error(detail || (e instanceof Error ? e.message : 'Erro ao salvar item.'));
    }
  }

  async function handleDeleteItem(item: Item) {
    if (!confirm(`Desativar item "${item.identificador}"?`)) return;
    try {
      await api.delete(`/itens/${item.id}`);
      if (activeSala) await loadItems(activeSala.id);
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      setError(detail || (e instanceof Error ? e.message : 'Erro ao excluir item.'));
    }
  }

  async function handleToggleItem(item: Item) {
    try {
      await api.put(`/itens/${item.id}`, { ativo: !item.ativo });
      if (activeSala) await loadItems(activeSala.id);
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      setError(detail || (e instanceof Error ? e.message : 'Erro ao alterar item.'));
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingSalas) {
    return <div style={{ padding: '40px', color: 'var(--dc-text-sec)' }}>Carregando…</div>;
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--dc-text-main)', margin: '0 0 4px' }}>
            Gerenciamento de Itens
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--dc-text-sec)' }}>
            Cadastre salas e os equipamentos verificados em cada check.
          </p>
        </div>
        <button
          onClick={() => setSalaModal({ open: true })}
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--dc-blue)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Nova Sala
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--dc-red-light)',
            border: '1px solid var(--dc-red)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#991B1B',
            fontSize: '13px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {salas.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--dc-white)',
            border: '1px dashed var(--dc-border)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            color: 'var(--dc-text-sec)',
          }}
        >
          Nenhuma sala cadastrada. Clique em <strong>+ Nova Sala</strong> para começar.
        </div>
      ) : (
        <>
          {/* Sala tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid var(--dc-border)',
              overflowX: 'auto',
              gap: '2px',
            }}
          >
            {salas.map((sala) => {
              const isActive = sala.id === activeSalaId;
              return (
                <button
                  key={sala.id}
                  onClick={() => setActiveSalaId(sala.id)}
                  style={{
                    padding: '10px 18px',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--dc-cyan)' : '2px solid transparent',
                    marginBottom: '-2px',
                    backgroundColor: 'transparent',
                    color: isActive ? 'var(--dc-blue)' : 'var(--dc-text-sec)',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sala.nome}
                </button>
              );
            })}
          </div>

          {/* Sala details + items */}
          {activeSala && (
            <div
              style={{
                backgroundColor: 'var(--dc-white)',
                border: '1px solid var(--dc-border)',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              {/* Sala meta bar */}
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--dc-border)',
                  backgroundColor: 'var(--dc-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dc-text-main)' }}>
                    {activeSala.nome}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--dc-text-sec)', fontSize: '12px' }}>
                      /{activeSala.slug}
                    </span>
                  </div>
                  {activeSala.descricao && (
                    <div style={{ fontSize: '12px', color: 'var(--dc-text-sec)', marginTop: '2px' }}>
                      {activeSala.descricao}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {activeSala.has_gerador && <Badge>Gerador</Badge>}
                    {activeSala.has_combustivel && <Badge>Combustível</Badge>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSalaModal({ open: true, sala: activeSala })}
                    style={smallBtnStyle}
                  >
                    Editar sala
                  </button>
                  <button
                    onClick={() => handleDeleteSala(activeSala)}
                    style={{ ...smallBtnStyle, color: 'var(--dc-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => setItemModal({ open: true })}
                    style={{
                      ...smallBtnStyle,
                      backgroundColor: 'var(--dc-cyan)',
                      color: 'white',
                      borderColor: 'var(--dc-cyan)',
                    }}
                  >
                    + Item
                  </button>
                </div>
              </div>

              {/* Items table */}
              <div style={{ overflowX: 'auto' }}>
                {loadingItems ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--dc-text-sec)' }}>
                    Carregando itens…
                  </div>
                ) : items.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--dc-text-sec)', fontSize: '14px' }}>
                    Nenhum item cadastrado. Clique em <strong>+ Item</strong>.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--dc-bg)', borderBottom: '1px solid var(--dc-border)' }}>
                        {['#', 'Tipo', 'Identificador', 'Dados Fixos', 'Status', 'Ações'].map((col) => (
                          <th
                            key={col}
                            style={{
                              padding: '11px 14px',
                              textAlign: 'left',
                              fontSize: '11px',
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
                      {items.map((item, idx) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: idx < items.length - 1 ? '1px solid var(--dc-border)' : 'none',
                            opacity: item.ativo ? 1 : 0.55,
                          }}
                        >
                          <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--dc-text-sec)', fontVariantNumeric: 'tabular-nums' }}>
                            {item.ordem}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span
                              style={{
                                backgroundColor: 'var(--dc-cyan-light)',
                                color: 'var(--dc-blue)',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {item.tipo}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
                            {item.identificador}
                          </td>
                          <td style={{ padding: '11px 14px', maxWidth: '260px' }}>
                            <pre
                              style={{
                                margin: 0,
                                fontSize: '11px',
                                color: 'var(--dc-text-sec)',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                maxHeight: '60px',
                                overflow: 'hidden',
                              }}
                            >
                              {JSON.stringify(item.dados_fixos)}
                            </pre>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <button
                              onClick={() => handleToggleItem(item)}
                              style={{
                                padding: '3px 10px',
                                borderRadius: '12px',
                                border: '1px solid',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                backgroundColor: item.ativo ? 'var(--dc-green-light)' : 'var(--dc-border)',
                                borderColor: item.ativo ? 'var(--dc-green)' : 'var(--dc-text-sec)',
                                color: item.ativo ? '#15803D' : 'var(--dc-text-sec)',
                              }}
                            >
                              {item.ativo ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setItemModal({ open: true, item })}
                                style={smallBtnStyle}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                style={{ ...smallBtnStyle, color: 'var(--dc-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {salaModal.open && (
        <SalaModal
          sala={salaModal.sala}
          onSave={handleSaveSala}
          onClose={() => setSalaModal({ open: false })}
        />
      )}

      {itemModal.open && activeSala && (
        <ItemModal
          salaNome={activeSala.nome}
          item={itemModal.item}
          onSave={handleSaveItem}
          onClose={() => setItemModal({ open: false })}
        />
      )}
    </div>
  );
}

const smallBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'transparent',
  border: '1px solid var(--dc-border)',
  borderRadius: '6px',
  color: 'var(--dc-blue)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: 'var(--dc-cyan-light)',
        color: 'var(--dc-blue)',
        padding: '2px 7px',
        borderRadius: '10px',
      }}
    >
      {children}
    </span>
  );
}

export default AdminPage;
