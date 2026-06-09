import React, { useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as authService from '../services/authService';

// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------
interface PasswordStrengthResult {
  score: number; // 0–4
  label: string;
  color: string;
  bgColor: string;
}

function analyzePassword(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: '', color: 'transparent', bgColor: 'transparent' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const map: Record<number, Omit<PasswordStrengthResult, 'score'>> = {
    0: { label: 'Muito fraca', color: 'var(--dc-red)', bgColor: 'var(--dc-red)' },
    1: { label: 'Fraca', color: 'var(--dc-red)', bgColor: 'var(--dc-red)' },
    2: { label: 'Razoável', color: 'var(--dc-amber)', bgColor: 'var(--dc-amber)' },
    3: { label: 'Boa', color: 'var(--dc-cyan)', bgColor: 'var(--dc-cyan)' },
    4: { label: 'Forte', color: 'var(--dc-green)', bgColor: 'var(--dc-green)' },
  };

  return { score: capped, ...map[capped] };
}

// ---------------------------------------------------------------------------
// PasswordStrength component
// ---------------------------------------------------------------------------
interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, bgColor } = analyzePassword(password);
  if (!password) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Bars */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: score >= bar ? bgColor : 'rgba(255,255,255,0.1)',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>
      {/* Label */}
      <p
        style={{
          fontSize: '11px',
          margin: 0,
          color: bgColor,
          fontWeight: 500,
        }}
      >
        Força: {label}
      </p>
      {/* Requirements */}
      <ul style={{ margin: '6px 0 0', padding: '0 0 0 14px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
        <RequirementItem met={password.length >= 8} text="Mínimo 8 caracteres" />
        <RequirementItem met={/[A-Z]/.test(password) && /[a-z]/.test(password)} text="Letras maiúsculas e minúsculas" />
        <RequirementItem met={/[0-9]/.test(password)} text="Pelo menos um número" />
        <RequirementItem met={/[^A-Za-z0-9]/.test(password)} text="Pelo menos um símbolo (!@#...)" />
      </ul>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <li
      style={{
        color: met ? 'var(--dc-green)' : 'rgba(255,255,255,0.35)',
        marginBottom: '2px',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      <span style={{ fontSize: '10px' }}>{met ? '✓' : '○'}</span>
      {text}
    </li>
  );
}

// ---------------------------------------------------------------------------
// ResetPasswordPage
// ---------------------------------------------------------------------------
export function ResetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = analyzePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token inválido ou expirado. Solicite uma nova recuperação de senha.');
      return;
    }
    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (strength.score < 2) {
      setError('A senha é muito fraca. Escolha uma senha mais segura.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 40px 10px 12px',
    backgroundColor: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    color: 'var(--dc-white)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--dc-night)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundImage:
          'radial-gradient(ellipse at 20% 50%, rgba(0,180,216,0.08) 0%, transparent 60%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/login"
            style={{
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            ← Voltar ao login
          </Link>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '36px 32px',
            backdropFilter: 'blur(8px)',
          }}
        >
          {!success ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'rgba(0,180,216,0.15)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    marginBottom: '14px',
                  }}
                >
                  🔒
                </div>
                <h1
                  style={{
                    color: 'var(--dc-white)',
                    fontSize: '20px',
                    fontWeight: 700,
                    margin: '0 0 6px',
                  }}
                >
                  Redefinir senha
                </h1>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '13px',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Escolha uma nova senha segura para sua conta.
                </p>
              </div>

              {!token && (
                <div
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.4)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fde68a',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  ⚠️ Token não encontrado na URL. Este link pode ser inválido.
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* New password */}
                <div>
                  <label htmlFor="new-password" style={labelStyle}>
                    Nova senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--dc-cyan)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '15px',
                        padding: '2px',
                      }}
                      aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showNew ? '🙈' : '👁'}
                    </button>
                  </div>
                  <PasswordStrength password={newPassword} />
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirm-password" style={labelStyle}>
                    Confirmar nova senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                      style={{
                        ...inputStyle,
                        borderColor:
                          confirmPassword && !passwordsMatch
                            ? 'var(--dc-red)'
                            : confirmPassword && passwordsMatch
                            ? 'var(--dc-green)'
                            : undefined,
                      }}
                      onFocus={(e) => {
                        if (!confirmPassword) {
                          e.currentTarget.style.borderColor = 'var(--dc-cyan)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!confirmPassword) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '15px',
                        padding: '2px',
                      }}
                      aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p style={{ color: 'var(--dc-red)', fontSize: '11px', margin: '4px 0 0' }}>
                      As senhas não coincidem
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p style={{ color: 'var(--dc-green)', fontSize: '11px', margin: '4px 0 0' }}>
                      ✓ As senhas coincidem
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fca5a5',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>⚠️</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !passwordsMatch || strength.score < 2}
                  style={{
                    padding: '11px',
                    backgroundColor:
                      loading || !passwordsMatch || strength.score < 2
                        ? 'rgba(0,180,216,0.4)'
                        : 'var(--dc-cyan)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--dc-white)',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: loading || !passwordsMatch || strength.score < 2 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                      Salvando...
                    </>
                  ) : (
                    'Redefinir senha'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'rgba(34,197,94,0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  margin: '0 auto 20px',
                }}
              >
                ✅
              </div>
              <h2
                style={{
                  color: 'var(--dc-white)',
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: '0 0 10px',
                }}
              >
                Senha redefinida!
              </h2>
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  margin: '0 0 24px',
                }}
              >
                Sua senha foi alterada com sucesso. Suas sessões anteriores foram encerradas por
                segurança. Faça login com a nova senha.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-block',
                  padding: '11px 28px',
                  backgroundColor: 'var(--dc-cyan)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--dc-white)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                }}
              >
                Fazer login
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  );
}
export default ResetPasswordPage;
