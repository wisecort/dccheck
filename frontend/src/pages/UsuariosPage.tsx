import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type UserRole = 'tecnico' | 'gestor' | 'admin';

interface Usuario {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'tecnico', label: 'Técnico' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_CFG: Record<UserRole, { bg: string; color: string; border: string; label: string }> = {
  tecnico: { bg: 'var(--dc-cyan-light)', color: '#0077A3', border: 'var(--dc-cyan)', label: 'Técnico' },
  gestor: { bg: 'var(--dc-green-light)', color: '#15803D', border: 'var(--dc-green)', label: 'Gestor' },
  admin: { bg: 'var(--dc-amber-light)', color: '#B45309', border: 'var(--dc-amber)', label: 'Admin' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CFG[role];
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
// User modal
// ---------------------------------------------------------------------------
interface UserFormData {
  username: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

interface UserModalProps {
  user?: Usuario;
  onSave: (data: {
    username: string;
    email: string;
    role: UserRole;
    password?: string;
  }) => Promise<void>;
  onClose: () => void;
}

function UserModal({ user, onSave, onClose }: UserModalProps) {
  const isEdit = !!user;
  const [form, setForm] = useState<UserFormData>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'tecnico',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData | 'form', string>>>({});
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof UserFormData>(key: K, value: UserFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '', form: '' }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.username.trim()) newErrors.username = 'Informe o nome de usuário.';
    else if (!/^[a-zA-Z0-9._-]+$/.test(form.username)) newErrors.username = 'Use apenas letras, números, . _ -';
    if (!form.email.trim() || !form.email.includes('@')) newErrors.email = 'E-mail inválido.';
    if (!isEdit) {
      if (!form.password) newErrors.password = 'Informe a senha inicial.';
      else if (form.password.length < 8) newErrors.password = 'Mínimo 8 caracteres.';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem.';
    } else if (form.password) {
      if (form.password.length < 8) newErrors.password = 'Mínimo 8 caracteres.';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      setErrors({ form: detail || (e instanceof Error ? e.message : 'Erro ao salvar.') });
    } finally {
      setSaving(false);
    }
  }

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--dc-text-main)',
    marginBottom: '6px',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--dc-red)',
    marginTop: '3px',
  };

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
          padding: '28px',
          maxWidth: '460px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--dc-text-main)', margin: 0 }}>
            {isEdit ? `Editar ${user.username}` : 'Criar Usuário'}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Usuário *</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              placeholder="nome.sobrenome"
              disabled={isEdit}
              style={{
                ...inputStyle,
                opacity: isEdit ? 0.6 : 1,
                cursor: isEdit ? 'not-allowed' : 'text',
                borderColor: errors.username ? 'var(--dc-red)' : 'var(--dc-border)',
              }}
            />
            {errors.username && <p style={errorStyle}>{errors.username}</p>}
          </div>

          <div>
            <label style={labelStyle}>E-mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="usuario@empresa.com"
              style={{ ...inputStyle, borderColor: errors.email ? 'var(--dc-red)' : 'var(--dc-border)' }}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          <div>
            <label style={labelStyle}>Papel (role) *</label>
            <select
              value={form.role}
              onChange={(e) => setField('role', e.target.value as UserRole)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--dc-border)', paddingTop: '12px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--dc-text-sec)' }}>
              {isEdit ? 'Deixe em branco para manter a senha atual.' : 'Defina a senha inicial do usuário.'}
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>{isEdit ? 'Nova senha (opcional)' : 'Senha *'}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder={isEdit ? 'Nova senha (opcional)' : '••••••••'}
                autoComplete="new-password"
                style={{ ...inputStyle, borderColor: errors.password ? 'var(--dc-red)' : 'var(--dc-border)' }}
              />
              {errors.password && <p style={errorStyle}>{errors.password}</p>}
            </div>

            {(!isEdit || form.password) && (
              <div>
                <label style={labelStyle}>Confirmar senha *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ ...inputStyle, borderColor: errors.confirmPassword ? 'var(--dc-red)' : 'var(--dc-border)' }}
                />
                {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
              </div>
            )}
          </div>
        </div>

        {errors.form && (
          <div
            style={{
              marginTop: '14px',
              backgroundColor: 'var(--dc-red-light)',
              border: '1px solid var(--dc-red)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#991B1B',
              fontSize: '12px',
            }}
          >
            {errors.form}
          </div>
        )}

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
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '9px 20px',
              backgroundColor: saving ? 'rgba(0,82,165,0.5)' : 'var(--dc-blue)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar usuário'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UsuariosPage
// ---------------------------------------------------------------------------
export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Usuario[]>('/users/');
      setUsuarios(res.data);
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const detail = (e as AxiosLike)?.response?.data?.detail;
      setError(detail || (e instanceof Error ? e.message : 'Erro ao carregar usuários.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = usuarios.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function handleSave(data: { username: string; email: string; role: UserRole; password?: string }) {
    if (editUser) {
      const payload: Record<string, unknown> = { email: data.email, role: data.role };
      if (data.password) payload.password = data.password;
      await api.put(`/users/${editUser.id}`, payload);
    } else {
      await api.post('/users/', {
        username: data.username,
        email: data.email,
        role: data.role,
        password: data.password,
        is_active: true,
      });
    }
    setModalOpen(false);
    setEditUser(undefined);
    await load();
  }

  async function handleToggleAtivo(user: Usuario) {
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
      await load();
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      setError((e as AxiosLike)?.response?.data?.detail || 'Erro ao alterar status.');
    }
  }

  async function handleDelete(user: Usuario) {
    if (!confirm(`Excluir o usuário "${user.username}"? Se ele tiver rondas associadas, desative-o em vez de excluir.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      await load();
    } catch (e: unknown) {
      type AxiosLike = { response?: { data?: { detail?: string } } };
      setError((e as AxiosLike)?.response?.data?.detail || 'Erro ao excluir usuário.');
    }
  }

  function handleEdit(user: Usuario) {
    setEditUser(user);
    setModalOpen(true);
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--dc-text-main)', margin: '0 0 4px' }}>
            Usuários
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--dc-text-sec)' }}>
            {usuarios.filter((u) => u.is_active).length} ativos · {usuarios.length} total
          </p>
        </div>
        <button
          onClick={() => { setEditUser(undefined); setModalOpen(true); }}
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
          + Criar Usuário
        </button>
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

      <div
        style={{
          backgroundColor: 'var(--dc-white)',
          border: '1px solid var(--dc-border)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '12px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuário ou e-mail..."
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 10px',
            border: '1px solid var(--dc-border)',
            borderRadius: '8px',
            backgroundColor: 'var(--dc-bg)',
            color: 'var(--dc-text-main)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          style={{
            padding: '8px 10px',
            border: '1px solid var(--dc-border)',
            borderRadius: '8px',
            backgroundColor: 'var(--dc-white)',
            color: 'var(--dc-text-main)',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Todos os papéis</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--dc-text-sec)' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--dc-bg)', borderBottom: '2px solid var(--dc-border)' }}>
                {['Usuário', 'E-mail', 'Papel', 'Status', 'Cadastro', 'Ações'].map((col) => (
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
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--dc-text-sec)' }}>
                    Carregando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--dc-text-sec)', fontSize: '14px' }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--dc-border)' : 'none',
                      opacity: user.is_active ? 1 : 0.55,
                      backgroundColor: !user.is_active ? 'rgba(100,116,139,0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: ROLE_CFG[user.role].bg,
                            border: `1px solid ${ROLE_CFG[user.role].border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: ROLE_CFG[user.role].color,
                            flexShrink: 0,
                          }}
                        >
                          {user.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dc-text-main)' }}>
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--dc-text-sec)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <RoleBadge role={user.role} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => handleToggleAtivo(user)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          border: '1px solid',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: user.is_active ? 'var(--dc-green-light)' : 'rgba(100,116,139,0.1)',
                          borderColor: user.is_active ? 'var(--dc-green)' : 'var(--dc-text-sec)',
                          color: user.is_active ? '#15803D' : 'var(--dc-text-sec)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--dc-text-sec)', whiteSpace: 'nowrap' }}>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleEdit(user)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--dc-border)',
                            borderRadius: '6px',
                            color: 'var(--dc-blue)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '6px',
                            color: 'var(--dc-red)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '14px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {ROLE_OPTIONS.map((r) => (
          <div key={r.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--dc-text-sec)' }}>
            <RoleBadge role={r.value} />
            <span>
              {r.value === 'tecnico' && '— Realiza rondas'}
              {r.value === 'gestor' && '— Visualiza histórico, exclui rondas'}
              {r.value === 'admin' && '— Acesso total'}
            </span>
          </div>
        ))}
      </div>

      {modalOpen && (
        <UserModal
          user={editUser}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditUser(undefined); }}
        />
      )}
    </div>
  );
}
export default UsuariosPage;
