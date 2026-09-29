'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IGNORED_KEYS,
  KeystrokeEvent,
  FlightEvent,
  RawVector,
  estimateAccuracy,
  accuracyLabel,
  wordCount,
  extractRawVector,
} from './biometrics';

// ── Long baseline paragraph (allows up to 220+ words for maximum accuracy) ────
const BASELINE_PARAGRAPH =
  'The internet was originally developed as a decentralized communication network. ' +
  'Over several decades it evolved from a small academic experiment into a global infrastructure ' +
  'connecting billions of people. Today it underpins commerce, communication, and knowledge sharing ' +
  'across every nation on the planet. Machine learning enables computers to learn patterns from data ' +
  'without being explicitly programmed. Algorithms trained on large datasets can recognize images, ' +
  'translate languages, and even detect fraud in financial transactions. Behavioral biometrics studies ' +
  'uniquely identifying patterns in human activity. Unlike physical biometrics such as fingerprints, ' +
  'behavioral signals like typing rhythm evolve continuously and are very difficult to replicate or steal. ' +
  'Cryptography remains the fundamental science of securing digital communication through mathematical algorithms, ' +
  'ensuring privacy and trust across open networks. When behavioral telemetry is combined with standard authentication, ' +
  'financial systems can continuously verify identity in the background without interrupting legitimate users. ' +
  'Every individual develops distinctive physical habits when interacting with keyboards and touchscreens over time, ' +
  'creating an invisible signature that remains uniquely their own.';

const MIN_WORDS = 50;

const LOCK_STEPS = [
  'Extracting keystroke vectors',
  'Normalizing feature dimensions',
  'Computing behavioral centroid',
  'Locking behavioral model',
];

interface Props {
  onComplete: (vector: RawVector) => void;
}

export default function BaselineSession({ onComplete }: Props) {
  const [typed, setTyped] = useState('');
  const [hasBackspace, setHasBackspace] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isPasted, setIsPasted] = useState(false);
  const [lockStep, setLockStep] = useState(-1);
  const [locked, setLocked] = useState(false);

  // Keystroke tracking refs
  const downMap = useRef(new Map<string, number>());
  const keystrokesRef = useRef<KeystrokeEvent[]>([]);
  const flightsRef = useRef<FlightEvent[]>([]);
  const lastKeyRef = useRef<string | null>(null);
  const lastUpTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 150);
  }, []);

  // Derived metrics
  const wc = wordCount(typed);
  const canSubmit = wc >= MIN_WORDS;
  const remaining = Math.max(0, MIN_WORDS - wc);
  const progressPct = Math.min(100, (wc / MIN_WORDS) * 100);

  // Live flight times for accuracy calculation
  const accuracy = canSubmit
    ? estimateAccuracy({
        wordCount: wc,
        flightTimes: flightsRef.current.map(f => f.flightTime),
        holdTimes: keystrokesRef.current.map(k => k.holdTime),
      })
    : 0;

  const { label: accLabel, color: accColor } = accuracyLabel(accuracy);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { key } = e;
    if (IGNORED_KEYS.has(key)) {
      if (key === 'Backspace') setHasBackspace(true);
      return;
    }
    const now = performance.now();
    if (!startTimeRef.current) startTimeRef.current = now;
    downMap.current.set(key, now);

    // Flight time: gap between last key-up and this key-down
    if (lastUpTimeRef.current !== null && lastKeyRef.current !== null) {
      flightsRef.current.push({
        fromKey: lastKeyRef.current,
        toKey: key,
        flightTime: now - lastUpTimeRef.current,
      });
    }
  }, []);

  const onKeyUp = useCallback((e: React.KeyboardEvent) => {
    const { key } = e;
    if (IGNORED_KEYS.has(key)) return;
    const now = performance.now();
    const downTime = downMap.current.get(key);
    if (downTime !== undefined) {
      keystrokesRef.current.push({ key, downTime, upTime: now, holdTime: now - downTime });
      downMap.current.delete(key);
    }
    lastUpTimeRef.current = now;
    lastKeyRef.current = key;
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTyped(e.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    setIsLocking(true);
    let step = 0;
    const interval = setInterval(() => {
      setLockStep(step);
      step++;
      if (step >= LOCK_STEPS.length) {
        clearInterval(interval);
        setLocked(true);
        setTimeout(() => {
          const totalMs = startTimeRef.current
            ? performance.now() - startTimeRef.current
            : 3000;
          const vector = extractRawVector({
            keystrokes: keystrokesRef.current,
            flights: flightsRef.current,
            totalDurationMs: totalMs,
            charCount: typed.length,
          });
          onComplete(vector);
        }, 600);
      }
    }, 420);
  }, [canSubmit, typed, onComplete]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isPasted) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }} className="fade-in">
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,107,53,0.1)', border: '2px solid rgba(255,107,53,0.3)', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: '#ff6b35', margin: '0 0 0.5rem', fontWeight: 600 }}>
          ZERO-TELEMETRY EVENT DETECTED
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Paste or autofill action intercepted. No behavioral biometrics could be extracted.
        </p>
        <button
          onClick={() => {
            setIsPasted(false);
            setTyped('');
          }}
          style={{
            padding: '0.875rem 1.5rem', borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          Reset and Type Naturally
        </button>
      </div>
    );
  }

  if (isLocking) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }} className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          {locked ? (
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '2px solid #00f5d4', background: 'rgba(0,245,212,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00f5d4" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '2px solid rgba(0,245,212,0.2)', borderTop: '2px solid #00f5d4',
              margin: '0 auto 1rem',
            }} className="spinner" />
          )}
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', color: '#00f5d4', margin: 0 }}>
            {locked ? 'BASELINE LOCKED' : 'TRAINING BEHAVIORAL MODEL…'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
          {LOCK_STEPS.map((step, idx) => (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              opacity: idx <= lockStep ? 1 : 0.25,
              transition: 'opacity 0.3s',
              fontSize: '0.8rem',
            }}>
              {idx < lockStep ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f5d4" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : idx === lockStep ? (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #00f5d4', borderTop: '2px solid transparent', flexShrink: 0 }} className="spinner" />
              ) : (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #1a2628', flexShrink: 0 }} />
              )}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: idx <= lockStep ? '#00f5d4' : '#6b7e83' }}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Accuracy ring SVG ────────────────────────────────────────────────────
  const R = 28;
  const circ = 2 * Math.PI * R;
  const ringOffset = circ - (accuracy / 100) * circ;

  return (
    <div style={{ padding: '1.5rem' }} className="fade-in">
      {/* Header info */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', margin: '0 0 0.375rem' }}>
          Type as much of this passage as you like — naturally, at your own pace:
        </p>
        <div style={{
          background: 'rgba(0,245,212,0.04)',
          border: '1px solid rgba(0,245,212,0.12)',
          borderRadius: 8,
          padding: '1rem',
          fontFamily: 'Georgia, serif',
          fontSize: '0.86rem',
          color: '#a8bbbf',
          lineHeight: 1.7,
          userSelect: 'none',
          maxHeight: 120,
          overflowY: 'auto',
        }}>
          {BASELINE_PARAGRAPH}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className="typing-input"
        value={typed}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPaste={(e) => {
          e.preventDefault();
          setIsPasted(true);
        }}
        placeholder="Start typing the passage above…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        rows={5}
        style={{
          width: '100%',
          resize: 'none',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.86rem',
          lineHeight: 1.7,
          borderColor: canSubmit ? '#00f5d4' : hasBackspace ? 'rgba(255,107,53,0.4)' : undefined,
        }}
      />

      {/* Word count progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div style={{ flex: 1, height: 4, background: '#1a2628', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: canSubmit ? '#00f5d4' : '#6b7e83',
            borderRadius: 9999,
            width: `${progressPct}%`,
            transition: 'width 0.15s, background 0.3s',
          }} />
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.68rem',
          color: canSubmit ? '#00f5d4' : '#6b7e83',
          minWidth: 80,
          textAlign: 'right',
        }}>
          {canSubmit ? `${wc} words ✓` : `${remaining} more words`}
        </span>
      </div>

      {/* Accuracy meter — only shown once minimum words reached */}
      {canSubmit && (
        <div className="fade-in" style={{
          marginTop: '1rem',
          padding: '0.875rem 1rem',
          background: 'rgba(0,245,212,0.04)',
          border: '1px solid rgba(0,245,212,0.15)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          {/* Mini accuracy ring */}
          <svg width="68" height="68" viewBox="0 0 68 68" style={{ flexShrink: 0 }}>
            <circle cx="34" cy="34" r={R} className="accuracy-ring-track" />
            <circle
              cx="34" cy="34" r={R}
              className="accuracy-ring-fill"
              stroke={accColor}
              strokeDasharray={circ}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 34 34)"
            />
            <text
              x="34" y="38"
              textAnchor="middle"
              fill={accColor}
              fontSize="12"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {accuracy}%
            </text>
          </svg>

          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: accColor, fontWeight: 600 }}>
              BASELINE ACCURACY
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--foreground)', fontWeight: 500 }}>
              {accLabel}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
              {accuracy < 75
                ? `Keep typing — more words improve accuracy. ${wc} words captured so far.`
                : accuracy < 88
                ? `Good baseline captured. Typing more will improve precision further.`
                : `Excellent baseline! Your typing is consistent — this gives the best authentication results.`}
            </p>
          </div>
        </div>
      )}

      {/* Backspace warning */}
      {hasBackspace && !canSubmit && (
        <div className="fade-in" style={{
          marginTop: '0.75rem',
          padding: '0.625rem 0.875rem',
          background: 'rgba(255,107,53,0.07)',
          border: '1px solid rgba(255,107,53,0.25)',
          borderRadius: 8,
          fontSize: '0.78rem',
          color: '#ff6b35',
        }}>
          Backspace detected — this reduces baseline accuracy slightly. Type naturally without correcting.
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          marginTop: '1rem',
          width: '100%',
          padding: '0.875rem',
          borderRadius: 10,
          border: canSubmit ? '1px solid rgba(0,245,212,0.5)' : '1px solid #1a2628',
          background: canSubmit ? 'rgba(0,245,212,0.1)' : 'transparent',
          color: canSubmit ? '#00f5d4' : '#6b7e83',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s',
          opacity: canSubmit ? 1 : 0.5,
        }}
        onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,245,212,0.18)'; }}
        onMouseLeave={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,245,212,0.1)'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        {canSubmit ? `Lock Baseline — ${accuracy}% accuracy` : `Type at least ${MIN_WORDS} words to continue`}
      </button>

      <p style={{ marginTop: '0.875rem', fontSize: '0.73rem', color: '#6b7e83', lineHeight: 1.5 }}>
        Type naturally — do not rush or slow down. The more you type, the more accurate your behavioral signature becomes.{' '}
        <strong style={{ color: '#f0f4f5' }}>50 words minimum</strong> to unlock, more is better.
      </p>
    </div>
  );
}
