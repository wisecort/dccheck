import React, { useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  score: StrengthLevel;
  label: string;
  color: string;
  bgColor: string;
  percentage: number;
  feedback: string[];
}

// ─── Strength calculator ──────────────────────────────────────────────────────

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return {
      score: 0,
      label: '',
      color: '#E2E8F0',
      bgColor: '#E2E8F0',
      percentage: 0,
      feedback: [],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Rule 1: Length >= 8
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Mínimo de 8 caracteres');
  }

  // Rule 2: Contains uppercase letter
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua letras maiúsculas');
  }

  // Rule 3: Contains number
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua números');
  }

  // Rule 4: Contains special character
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua caracteres especiais (!@#$...)');
  }

  const clampedScore = Math.min(score, 4) as StrengthLevel;

  const config: Record<
    StrengthLevel,
    { label: string; color: string; bgColor: string; percentage: number }
  > = {
    0: { label: '',       color: '#E2E8F0', bgColor: '#F1F5F9', percentage: 0   },
    1: { label: 'Fraca',  color: '#EF4444', bgColor: '#FEE2E2', percentage: 25  },
    2: { label: 'Regular',color: '#F59E0B', bgColor: '#FEF3C7', percentage: 50  },
    3: { label: 'Boa',    color: '#22C55E', bgColor: '#DCFCE7', percentage: 75  },
    4: { label: 'Forte',  color: '#16A34A', bgColor: '#DCFCE7', percentage: 100 },
  };

  return {
    score: clampedScore,
    feedback,
    ...config[clampedScore],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <div
      className={className}
      style={{ marginTop: '6px' }}
      role="status"
      aria-live="polite"
      aria-label={`Força da senha: ${strength.label}`}
    >
      {/* ── Segmented bar ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '5px',
        }}
        aria-hidden="true"
      >
        {([1, 2, 3, 4] as StrengthLevel[]).map((level) => {
          const filled = strength.score >= level;
          return (
            <div
              key={level}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: filled ? strength.color : '#E2E8F0',
                transition: 'background-color 0.25s ease',
              }}
            />
          );
        })}
      </div>

      {/* ── Label row ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Label badge */}
        {strength.label && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1px 8px',
              borderRadius: '9999px',
              fontSize: '0.714rem',
              fontWeight: 600,
              color: strength.color,
              backgroundColor: strength.bgColor,
              border: `1px solid ${strength.color}33`,
              lineHeight: 1.4,
            }}
          >
            {strength.label}
          </span>
        )}

        {/* First feedback hint */}
        {strength.feedback.length > 0 && strength.score < 4 && (
          <span
            style={{
              fontSize: '0.714rem',
              color: '#64748B',
              textAlign: 'right',
              flex: 1,
            }}
          >
            {strength.feedback[0]}
          </span>
        )}
      </div>

      {/* ── All remaining hints (only shown when score < 4) ─────── */}
      {strength.score < 4 && strength.feedback.length > 1 && (
        <ul
          style={{
            marginTop: '4px',
            paddingLeft: '12px',
            listStyle: 'disc',
          }}
          aria-label="Sugestões para senha mais forte"
        >
          {strength.feedback.slice(1).map((hint) => (
            <li
              key={hint}
              style={{
                fontSize: '0.714rem',
                color: '#64748B',
                lineHeight: 1.5,
              }}
            >
              {hint}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Export the raw calculator for use outside the component ──────────────────
export { calculateStrength };
export type { StrengthLevel, StrengthResult };
