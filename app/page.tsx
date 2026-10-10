'use client';

import { useEffect, useRef, useState } from 'react';
import DemoModal from './demo/DemoModal';
import ImposterChallengeModal from './demo/ImposterChallengeModal';
import HowItWorksAnimation from './demo/HowItWorksAnimation';

// ── Fingerprint logo SVG paths ────────────────────────────────────────────────
const FP_PATHS = [
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

function FingerprintIcon({ size = 32, color = 'var(--primary)', weight = 1.6 }: { size?: number; color?: string; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {FP_PATHS.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

// ── Intro scanner overlay ──────────────────────────────────────────────────────
function ScannerOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const STATUS = ['Initializing identity layer', 'Loading behavioral engine', 'System ready'];

  useEffect(() => {
    const t1 = setTimeout(() => setStatusIdx(1), 1200);
    const t2 = setTimeout(() => setStatusIdx(2), 2500);
    const t3 = setTimeout(() => dismiss(), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // eslint-disable-line

  function dismiss() {
    setDismissed(true);
    setTimeout(onDismiss, 600);
  }

  return (
    <div
      className={`scanner-overlay${dismissed ? ' dismissed' : ''}`}
      role="dialog" aria-modal="true" aria-label="Finomaly introductory animation"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)' }}>
        <FingerprintIcon size={32} />
        <span style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.055em' }}>
          finomaly<span style={{ color: 'var(--primary)' }}>.</span>
        </span>
      </span>

      <div className="scanner-assembly" aria-hidden="true">
        <div className="scanner-ring" />
        <div className="scanner-ring inner" />
        {/* crosshairs */}
        {[{side:'left',x:-14},{side:'right',x:'auto',right:-14}].map((pos,i) => (
          <svg key={i} style={{ position:'absolute', [pos.side]:pos.x, top:'50%', transform:'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,245,212,0.5)" strokeWidth="2">
            <path d="M5 12h14"/><path d="M12 5v14"/>
          </svg>
        ))}
        {/* hand icon */}
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(240,244,245,0.6)' }} aria-hidden="true">
          <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>
          <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>
          <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
        </svg>
        <div className="scanner-laser" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }} role="status">
        <p className="eyebrow">{STATUS[statusIdx]}</p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
          Intro animation · no biometric scan performed
        </p>
      </div>

      <button
        autoFocus
        onClick={dismiss}
        style={{ position: 'absolute', bottom: '2.5rem', padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: '0.875rem' }}
      >
        Skip intro
      </button>
    </div>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="faq-item" style={{ borderBottom: '1px solid var(--border)' }}>
      <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '1.5rem 0', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}>
        {q}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="M5 12h14"/><path d="M12 5v14"/>
        </svg>
      </summary>
      <p style={{ paddingBottom: '1.5rem', paddingRight: '2rem', fontSize: '0.9rem', color: 'var(--muted-foreground)', lineHeight: 1.7, margin: 0 }}>{a}</p>
    </details>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {!introDone && <ScannerOverlay onDismiss={() => setIntroDone(true)} />}

      {/* Skip to content */}
      <a href="#main" style={{ position: 'fixed', left: 4, top: 4, zIndex: 50, background: 'var(--primary)', color: '#080c0d', padding: '0.75rem 1rem', borderRadius: 6, transform: 'translateY(-200%)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', transition: 'transform 0.2s' }}
        onFocus={e => (e.currentTarget.style.transform = 'translateY(0)')}
        onBlur={e => (e.currentTarget.style.transform = 'translateY(-200%)')}
      >Skip to content</a>

      {/* ── HEADER ── */}
      <header style={{ position: 'relative', zIndex: 20, borderBottom: '1px solid var(--border)', background: 'rgba(8,12,13,0.9)', backdropFilter: 'blur(8px)' }}>
        <div className="shell" style={{ display: 'flex', height: 88, alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#" aria-label="Finomaly home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <FingerprintIcon size={32} />
              <span style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.055em' }}>
                finomaly<span style={{ color: 'var(--primary)' }}>.</span>
              </span>
            </span>
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {[['#technology','The technology'],['#architecture','How it works'],['#mission','Our mission']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
              >{label}</a>
            ))}
          </nav>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot" />SYSTEM ONLINE
          </span>
        </div>
      </header>

      <main id="main">
        {/* ── HERO ── */}
        <section className="shell" style={{ display: 'grid', alignItems: 'center', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', paddingTop: '4rem', paddingBottom: '4rem' }} aria-label="Hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="status-dot" />
              <span className="eyebrow">A NEW LAYER OF TRUST</span>
            </div>
            <h1 className="hero-title">
              THE FUTURE<br />IS <span style={{ color: 'var(--primary)' }}>SAFE</span><span style={{ color: 'var(--primary)' }}>.</span>
            </h1>
            <p style={{ maxWidth: 420, color: 'var(--muted-foreground)', fontSize: '1.05rem', lineHeight: 1.65, margin: 0 }}>
              Passwords can be stolen.<br />
              The way you move cannot be easily copied.<br />
              Meet the identity layer that knows it&apos;s you.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              <DemoModal />
              <ImposterChallengeModal />
            </div>
            <div>
              <HowItWorksAnimation />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              {[
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>, label: 'Continuous authentication' },
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>, label: 'Privacy by design' },
              ].map(({ icon, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icon}{label}</span>
              ))}
            </div>
          </div>

          {/* Hero art — Biometric Scanner */}
          <div className="hero-art" aria-label="Illustration of a unique behavioral fingerprint">
            <img
              src="/images/biometric-fingerprint.png"
              alt="Sculpted chrome fingerprint with illuminated cyan ridges"
              width={1024}
              height={1024}
              className="fingerprint-art"
            />

            {/* HUD Telemetry: Top-Left */}
            <div style={{ position: 'absolute', left: 20, top: 20, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--muted-foreground)', zIndex: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="12" x2="18" y2="12" />
                <line x1="6" y1="12" x2="2" y2="12" />
                <line x1="12" y1="6" x2="12" y2="2" />
                <line x1="12" y1="22" x2="12" y2="18" />
              </svg>
              IDENTITY VECTOR <span style={{ color: 'var(--primary)' }}>// 5D</span>
            </div>

            {/* HUD Telemetry: Top-Right */}
            <span style={{ position: 'absolute', right: 20, top: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--muted-foreground)', zIndex: 10 }}>
              FNM—001
            </span>

            {/* Biometric Framing Brackets */}
            <i className="scan-bracket tl" aria-hidden="true" />
            <i className="scan-bracket tr" aria-hidden="true" />
            <i className="scan-bracket bl" aria-hidden="true" />
            <i className="scan-bracket br" aria-hidden="true" />

            {/* Animated Laser Scanline */}
            <div className="hero-scanline" aria-hidden="true" />

            {/* Floating Biometric Badge */}
            <div className="signal-panel" style={{ position: 'absolute', right: 0, top: '42%', display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: '10px 0 0 10px', borderRight: 'none', zIndex: 10 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>Uniquely human.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>Impossible to be ordinary.</p>
              </div>
            </div>

            {/* Bottom Status Panel with Animated Signal Bars */}
            <div className="signal-panel" style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', zIndex: 10 }}>
              <div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0, letterSpacing: '0.04em' }}>BEHAVIORAL SIGNATURE</p>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--primary)', marginTop: 4 }}>
                  <span className="status-dot" />Your rhythm. Your identity.
                </span>
              </div>
              <div className="signal-bars" aria-hidden="true">
                {[10,16,8,24,16,30,11,19,27,12,22,16,8,24,13,29,17,10].map((h, i) => (
                  <i key={i} style={{ height: h }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Built-by bar */}
        <div className="shell" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 24, paddingTop: 20 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }} />
            BUILT BY <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>&nbsp;TEAM HACKFLUX</span>
          </p>
          <a href="#technology" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}>
            SCROLL TO DECODE
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
          </a>
        </div>

        {/* ── TECHNOLOGY ── */}
        <section id="technology" className="shell" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>ENGINEERED FOR THE UNEXPECTED</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: '2.5rem' }}>
            <h2 className="section-title">Not another password.<br /><span style={{ color: 'var(--muted-foreground)' }}>A different kind of proof.</span></h2>
            <p style={{ maxWidth: 380, color: 'var(--muted-foreground)', fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>
              A precise stack. A human signature. Working together to make trust continuous.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            {[
              { badge: 'THE FOUNDATION', title: 'Next.js', desc: 'Fast, responsive. Built for every interaction that matters.', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 19.5h20L12 2zm0 5l7 12.5H5L12 7z"/></svg> },
              { badge: 'THE EXPERIENCE', title: 'Framer Motion', desc: 'Fluid motion that brings an invisible layer of security into focus.', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg> },
              { badge: 'THE SIGNATURE', title: 'Hybrid Biometrics', desc: 'Five behavioral dimensions. One signature uniquely yours — with weighted Euclidean penalty for real sensitivity.', icon: <FingerprintIcon size={32} /> },
              { badge: 'THE INTELLIGENCE', title: 'Hybrid Similarity', desc: 'Cosine × Euclidean penalty. Gaps in WPM, hold time or flight time now meaningfully reduce match score.', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14h6v6"/><path d="M10 10H4V4"/><path d="M22 2 12 12"/><path d="M2 22l10-10"/></svg> },
            ].map(card => (
              <article key={card.title} className="tech-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {card.icon}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>{card.badge}</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{card.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.6 }}>{card.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── IDENTITY GAP ── */}
        <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
          <div className="shell" style={{ display: 'grid', alignItems: 'center', gap: '3rem', gridTemplateColumns: '1.1fr 1fr', paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p className="eyebrow">THE CREDENTIALS ARE REAL. THE PERSON ISN&apos;T.</p>
              <h2 className="section-title">Correct password.<br /><span style={{ color: 'var(--muted-foreground)' }}>Wrong hands.</span></h2>
              <p style={{ color: 'var(--muted-foreground)', maxWidth: 480, lineHeight: 1.7, margin: 0 }}>
                Mule accounts turn legitimate bank accounts into channels for cybercrime. When an account is sold or taken over, passwords and OTPs can still check out. Traditional authentication stops at the door.
              </p>
              <p style={{ color: 'var(--foreground)', maxWidth: 480, lineHeight: 1.7, margin: 0 }}>
                Finomaly asks a better question: <span style={{ color: 'var(--primary)' }}>does the person behind the screen still behave like you?</span>
              </p>
            </div>
            <div style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--background)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>THE IDENTITY GAP</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>
              </div>
              {['Password verified', 'OTP authenticated', 'Account access granted'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>{item}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.25rem', padding: '1.125rem', borderRadius: 8, border: '1px solid rgba(0,245,212,0.25)', background: 'rgba(0,245,212,0.05)', color: 'var(--primary)' }}>
                <FingerprintIcon size={28} />
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>But is it really you?</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>This is where Finomaly begins.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="architecture" className="shell" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>INSIDE THE ENGINE</p>
          <h2 className="section-title" style={{ marginBottom: '3rem' }}>Invisible by design.<br /><span style={{ color: 'var(--muted-foreground)' }}>Intelligent at every step.</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[
              { phase: '01', title: 'Capture the rhythm', desc: 'Dwell time. Flight time. Typing speed. Five signals, captured only when you opt in.', tag: 'INPUT → BEHAVIORAL TELEMETRY' },
              { phase: '02', title: 'Find the signature', desc: 'Convert raw interactions into a scaled behavioral vector. Strip away the content. Keep the pattern.', tag: 'PROCESS → VECTOR NORMALIZATION' },
              { phase: '03', title: 'Verify the human', desc: 'Compare the live vector to your baseline with a hybrid similarity engine. Cosine angle meets Euclidean distance — so large behavioral gaps produce meaningfully lower scores.', tag: 'OUTPUT → HYBRID SIMILARITY SIGNAL' },
            ].map((step, i) => (
              <article key={step.phase} style={{ padding: 32, borderRight: i < 2 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    {i === 0 && <><path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><path d="M2 4h20v16H2z"/></>}
                    {i === 1 && <><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/></>}
                    {i === 2 && <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/></>}
                  </svg>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>PHASE {step.phase}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ fontSize: '1.35rem', letterSpacing: '-0.02em', margin: 0 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'rgba(0,245,212,0.7)', margin: 0 }}>{step.tag}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── MISSION ── */}
        <section id="mission" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
          <div className="shell" style={{ display: 'grid', gap: '3.5rem', gridTemplateColumns: '1.1fr 1fr', paddingTop: '5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p className="eyebrow">SMALL TEAM. NATIONAL AMBITION.</p>
              <h2 className="section-title">Built for a hackathon.<br /><span style={{ color: 'var(--muted-foreground)' }}>Thinking far beyond it.</span></h2>
              <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7, margin: 0 }}>
                We&apos;re Team Hackflux. Three builders exploring one question: what if your natural behavior could help protect your financial identity?
              </p>
              <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7, margin: 0 }}>
                Next: expert algorithm reviews, adversarial testing, and privacy-first research. Our ambition is to help tackle India&apos;s mule account crisis at a national scale.
              </p>
              <div style={{ marginTop: '0.5rem' }}>
                <a
                  href="/Finomaly_Biometric_1000_Experiment_Report.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 10,
                    border: '1px solid rgba(0, 245, 212, 0.4)',
                    background: 'rgba(0, 245, 212, 0.08)',
                    color: '#00f5d4',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: 'JetBrains Mono, monospace',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0, 245, 212, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.7)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0, 245, 212, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.4)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 18 15 15" />
                  </svg>
                  Read 1,000-Experiment Research Report (PDF)
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
              {[
                { initials: 'CN', name: 'Charvi Naresh' },
                { initials: 'DB', name: 'Dolsi Bajaj' },
                { initials: 'VS', name: 'Vasu Sharma' },
              ].map(member => (
                <div key={member.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', padding: '1.5rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: 'var(--primary)', flexShrink: 0 }}>
                      {member.initials}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', letterSpacing: '-0.02em', margin: 0 }}>{member.name}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Co-creator · Team Hackflux</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>HACKFLUX</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="questions" className="shell" style={{ display: 'grid', gap: '3rem', gridTemplateColumns: '.8fr 1.2fr', paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>A LITTLE MORE CONTEXT</p>
            <h2 className="section-title">Trust starts<br /><span style={{ color: 'var(--muted-foreground)' }}>with transparency.</span></h2>
          </div>
          <div>
            <FaqItem
              q="Can someone copy my typing pattern?"
              a="Copying credentials is easy. Copying the micro-timing of how a person types is much harder. Even if an attacker knows your password, replicating your dwell times and flight transitions consistently, in real time, is extremely difficult. Pasted text and scripted input also tend to show unnatural timing, which is itself a useful signal."
            />
            <FaqItem
              q="Can automated bots or scripts bypass Finomaly?"
              a="No. Scripts and bots type with unnatural, mathematical perfection—such as 0ms hold times or identical key intervals. Finomaly's similarity engine flags these rigid patterns as zero-telemetry anomalies."
            />
            <FaqItem
              q="Can I update my typing baseline?"
              a="Yes. In a production deployment, your baseline can be refreshed every six months or whenever your typing habits change noticeably. A new baseline is only created after you pass strong verification (such as an OTP or step-up authentication), so no one else can overwrite your profile."
            />
            <FaqItem
              q="What happens if I'm tired or typing faster?"
              a="The prototype uses three similarity bands: 85–100% is a match; 65–84% is a rushed state that does not block the demo; below 65% is a behavioral anomaly. These are illustrative thresholds, not clinically or financially validated measures."
            />
            {/* ── UPDATED FAQ ANSWER: Compelling and empowering framing for mule detection ── */}
            <FaqItem
              q="Can this identify a mule account or unauthorized user?"
              a="Yes, by recognizing when an account is operated by someone other than its true owner. In mule fraud and account takeover schemes, attackers routinely possess correct credentials and OTPs. However, they cannot easily replicate the legitimate user's unique rhythm, keystroke dwell times, and flight transitions. Finomaly evaluates these neuromuscular patterns in the background. When a divergence occurs, it provides an immediate protective signal—enabling financial systems to step up verification and halt fraudulent transactions before damage occurs."
            />
            <FaqItem
              q="Is this ready to connect to a bank?"
              a="Not yet. This is an interactive research prototype. Production use requires consent, secure server-side enrollment, representative testing, anti-spoofing controls, accessibility review, regulatory assessment, and independent security audits."
            />
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="shell" style={{ paddingBottom: '5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, borderRadius: 16, border: '1px solid rgba(0,245,212,0.2)', background: 'rgba(0,245,212,0.04)', padding: '4rem 1.5rem', textAlign: 'center' }}>
            <FingerprintIcon size={48} weight={1.2} />
            <h2 className="section-title">You are the password.</h2>
            <p style={{ maxWidth: 480, color: 'var(--muted-foreground)', lineHeight: 1.7, margin: 0 }}>
              Try the live engine. Capture your rhythm.<br />
              See what makes your behavior unmistakably yours.
            </p>
            <DemoModal />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              NO SIGN-UP. NO REAL CREDENTIALS. JUST YOU.
            </span>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
              <FingerprintIcon size={24} />
              <span style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.05em' }}>
                finomaly<span style={{ color: 'var(--primary)' }}>.</span>
              </span>
            </a>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
              A research prototype by <strong style={{ color: 'var(--foreground)' }}>Team Hackflux</strong>. No financial data is collected. No biometric data leaves your device.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
