'use client';

import { useCallback, useRef, useState } from 'react';
import {
  IGNORED_KEYS,
  KeystrokeEvent,
  FlightEvent,
  RawVector,
  extractRawVector,
  normaliseVector,
  averageRawVectors,
  computeFeatureDeltas,
  hybridSimilarity,
  perSessionSimilarities,
  NormVector,
} from './biometrics';

const PASSPHRASE = 'behavioral authentication protects accounts where passwords cannot reach';

const ANALYZE_STEPS = [
  'Extracting hold-time vectors',
  'Computing flight-time ratios',
  'Normalizing WPM features',
  'Running hybrid similarity engine',
];

const LOGO_PATHS = [
  'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4',
  'M14 13.12c0 2.38 0 6.38-1 8.88',
  'M17.29 21.02c.12-.6.43-2.3.5-3.02',
  'M2 12a10 10 0 0 1 18-6',
  'M2 16h.01',
  'M21.8 16c.2-2 .131-5.354 0-6',
  'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2',
  'M8.65 22c.21-.66.45-1.32.57-2',
  'M9 6.8a6 6 0 0 1 9 5.2v2',
];

interface AuthResult {
  liveVector: RawVector;
  liveNorm: NormVector;
  baselineNorm: NormVector;
  similarity: number;
  perSession: number[];
  featureDeltas: ReturnType<typeof computeFeatureDeltas>;
  liveKeystrokes: KeystrokeEvent[];
}

interface Props {
  baselineSessions: RawVector[];
  onResult: (r: AuthResult) => void;
  onReenroll: () => void;
}

export default function LoginSession({ baselineSessions, onResult, onReenroll }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [typed, setTyped] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [hasBackspace, setHasBackspace] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  const downMap = useRef(new Map<string, number>());
  const keystrokesRef = useRef<KeystrokeEvent[]>([]);
  const flightsRef = useRef<FlightEvent[]>([]);
  const lastKeyRef = useRef<string | null>(null);
  const lastUpTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const passphraseComplete = typed.trim() === PASSPHRASE.trim();
  const progress = Math.min(100, (typed.length / PASSPHRASE.length) * 100);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { key } = e;
    if (IGNORED_KEYS.has(key)) {
      if (key === 'Backspace') setHasBackspace(true);
      return;
    }
    const now = performance.now();
    if (!startTimeRef.current) startTimeRef.current = now;
    downMap.current.set(key, now);
    if (lastUpTimeRef.current !== null && lastKeyRef.current !== null) {
      flightsRef.current.push({ fromKey: lastKeyRef.current, toKey: key, flightTime: now - lastUpTimeRef.current });
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseComplete || keystrokesRef.current.length < 4) return;

    setAnalyzing(true);
    let step = 0;
    const interval = setInterval(() => {
      setAnalyzeStep(++step);
      if (step >= ANALYZE_STEPS.length) clearInterval(interval);
    }, 320);

    setTimeout(() => {
      const totalMs = startTimeRef.current ? performance.now() - startTimeRef.current : 3000;
      const liveVector = extractRawVector({
        keystrokes: keystrokesRef.current,
        flights: flightsRef.current,
        totalDurationMs: totalMs,
        charCount: typed.length,
      });

      const liveNorm = normaliseVector(liveVector);
      const baselineRaw = averageRawVectors(baselineSessions);
      const baselineNorm = normaliseVector(baselineRaw);
      const similarity = hybridSimilarity(baselineNorm, liveNorm);
      const sessionNorms: NormVector[] = baselineSessions.map(s => normaliseVector(s));
      const perSession = perSessionSimilarities(sessionNorms, liveNorm);
      const featureDeltas = computeFeatureDeltas(baselineRaw, liveVector);

      onResult({
        liveVector,
        liveNorm,
        baselineNorm,
        similarity,
        perSession,
        featureDeltas,
        liveKeystrokes: keystrokesRef.current,
      });
    }, 1400);
  }, [passphraseComplete, typed, baselineSessions, onResult]);

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
          Paste or autofill action intercepted. No behavioral biometrics could be extracted (0ms flight time).
        </p>
        <button
          onClick={() => {
            // Usually this routes to MFA or secondary auth
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
          Route to Standard 2FA
        </button>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }} className="fade-in">
        <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(0,245,212,0.2)', borderTop: '2px solid #00f5d4', margin: '0 auto 1.25rem' }} className="spinner" />
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#00f5d4', margin: '0 0 0.5rem' }}>
          ANALYZING BEHAVIORAL SIGNATURE…
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: '0 0 1.5rem' }}>
          Comparing keystroke dynamics against your enrolled baseline
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          {ANALYZE_STEPS.map((step, idx) => (
            <div key={step} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.78rem', opacity: idx <= analyzeStep ? 1 : 0.3, transition: 'opacity 0.3s' }}>
              {idx < analyzeStep
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00f5d4" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                : idx === analyzeStep
                ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #00f5d4', borderTop: '1.5px solid transparent', flexShrink: 0 }} className="spinner" />
                : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0 }} />}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: idx <= analyzeStep ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      {/* Logo header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '0.6rem' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {LOGO_PATHS.map((d, i) => <path key={i} d={d} />)}
          </svg>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.04em' }}>
            finomaly<span style={{ color: 'var(--primary)' }}>.</span>
          </span>
        </div>
        <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '0.82rem' }}>
          Secure Banking Portal · Behavioral Authentication
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        {/* Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.375rem', fontFamily: 'JetBrains Mono, monospace' }}>
            FULL NAME
          </label>
          <input type="text" className="login-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Charvi Naresh" autoComplete="name" />
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.375rem', fontFamily: 'JetBrains Mono, monospace' }}>
            ACCOUNT EMAIL
          </label>
          <input type="email" className="login-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. charvi@finobank.in" autoComplete="email" />
        </div>

        {/* Behavioral passphrase */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
              BEHAVIORAL PASSPHRASE
            </label>
            <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: '#00f5d4', background: 'rgba(0,245,212,0.08)', padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(0,245,212,0.2)' }}>
              BIOMETRIC ACTIVE
            </span>
          </div>

          <div style={{ background: 'rgba(0,245,212,0.03)', border: '1px solid rgba(0,245,212,0.1)', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '0.625rem', fontSize: '0.82rem', color: 'rgba(240,244,245,0.55)', fontFamily: 'Georgia, serif', lineHeight: 1.65, userSelect: 'none' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.35rem' }}>
              TYPE THIS PHRASE TO AUTHENTICATE:
            </span>
            {PASSPHRASE}
          </div>

          <input
            type="text"
            className="typing-input"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onPaste={(e) => {
              e.preventDefault();
              setIsPasted(true);
            }}
            placeholder="Start typing the phrase above…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{ borderColor: passphraseComplete ? '#00f5d4' : hasBackspace ? 'rgba(255,107,53,0.4)' : undefined }}
          />

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
            <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: passphraseComplete ? '#00f5d4' : 'var(--muted-foreground)', borderRadius: 9999, width: `${progress}%`, transition: 'width 0.1s,background 0.3s' }} />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: passphraseComplete ? '#00f5d4' : 'var(--muted-foreground)', minWidth: 50, textAlign: 'right' }}>
              {passphraseComplete ? 'READY' : `${typed.length}/${PASSPHRASE.length}`}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!passphraseComplete}
          style={{
            marginTop: '0.25rem', padding: '0.875rem', borderRadius: 10,
            border: passphraseComplete ? '1px solid rgba(0,245,212,0.5)' : '1px solid var(--border)',
            background: passphraseComplete ? 'rgba(0,245,212,0.12)' : 'transparent',
            color: passphraseComplete ? '#00f5d4' : 'var(--muted-foreground)',
            cursor: passphraseComplete ? 'pointer' : 'not-allowed',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'all 0.2s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {passphraseComplete ? 'Authenticate — Analyze Behavior' : 'Type the passphrase above to continue'}
        </button>

        <button type="button" onClick={onReenroll} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
          Re-enroll baseline
        </button>
      </form>
    </div>
  );
}
