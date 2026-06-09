import React, { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../services/authService';

const RESEND_COOLDOWN = 120; // seconds

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer after email sent
  useEffect(() => {
    if (!sent) return;
    setCountdown(RESEND_COOLDOWN);
    setCanResend(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sent]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Informe o e-mail institucional.');
      return;
    }
    if (!email.includes('@')) {
      setError('E-mail inválido.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend || loading) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      // restart timer
      setSent(false);
      setTimeout(() => setSent(true), 0);
    } finally {
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '36px 32px',
    backdropFilter: 'blur(8px)',
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
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Back link */}
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
              transition: 'color 0.15s',
            }}
          >
            ← Voltar ao login
          </Link>
        </div>

        {!sent ? (
          /* Request form */
          <div style={cardStyle}>
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
                🔑
              </div>
              <h1
                style={{
                  color: 'var(--dc-white)',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: '0 0 6px',
                }}
              >
                Recuperar senha
              </h1>
              <p
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Informe o e-mail institucional cadastrado. Enviaremos um link para redefinir sua
                senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  htmlFor="forgot-email"
                  style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                  }}
                >
                  E-mail institucional
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: 'var(--dc-white)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dc-cyan)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                />
              </div>

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
                disabled={loading}
                style={{
                  padding: '11px',
                  backgroundColor: loading ? 'rgba(0,180,216,0.5)' : 'var(--dc-cyan)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--dc-white)',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Success state */
          <div style={cardStyle}>
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
                ✉️
              </div>
              <h2
                style={{
                  color: 'var(--dc-white)',
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: '0 0 10px',
                }}
              >
                E-mail enviado!
              </h2>
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  margin: '0 0 24px',
                }}
              >
                Enviamos um link de recuperação para{' '}
                <strong style={{ color: 'var(--dc-cyan)' }}>{email}</strong>. Verifique sua caixa
                de entrada e a pasta de spam.
              </p>

              {/* Countdown / resend */}
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                }}
              >
                {!canResend ? (
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '13px',
                      margin: 0,
                    }}
                  >
                    Reenviar em{' '}
                    <strong style={{ color: 'var(--dc-white)', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--dc-cyan)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    {loading ? 'Reenviando...' : 'Reenviar e-mail'}
                  </button>
                )}
              </div>

              <Link
                to="/login"
                style={{
                  display: 'inline-block',
                  padding: '10px 24px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'var(--dc-white)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Voltar ao login
              </Link>
            </div>
          </div>
        )}
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
export default ForgotPasswordPage;
