'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getDemoUserId } from '@/lib/apiClient';

interface AuditLogItem {
  id: string;
  user_id: string;
  score: number;
  band: string;
  flags?: {
    pasteDetected?: boolean;
    botSuspected?: boolean;
  };
  created_at: string;
}

export default function AuditPage() {
  const [userId, setUserId] = useState('');
  const [filterMode, setFilterMode] = useState<'session' | 'all'>('session');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentId = getDemoUserId();
    setUserId(currentId);
    fetchAuditLogs(currentId);
  }, []);

  const fetchAuditLogs = useCallback(async (targetUserId: string, mode: 'session' | 'all' = 'session') => {
    setLoading(true);
    setError(null);

    const queryId = mode === 'all' ? 'all' : targetUserId.trim();

    try {
      const res = await fetch(`/api/audit?userId=${encodeURIComponent(queryId || 'all')}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_DEMO_KEY || 'finomaly_demo_secret_2026_x8k9',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(msg);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBandBadge = (band: string) => {
    const b = band.toLowerCase();
    if (b === 'match') {
      return (
        <span style={{
          padding: '3px 8px', borderRadius: 4,
          fontSize: '0.72rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
          background: 'rgba(0, 245, 212, 0.1)', color: '#00f5d4', border: '1px solid rgba(0, 245, 212, 0.3)'
        }}>
          MATCH
        </span>
      );
    }
    if (b === 'rushed') {
      return (
        <span style={{
          padding: '3px 8px', borderRadius: 4,
          fontSize: '0.72rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
          background: 'rgba(255, 165, 0, 0.1)', color: '#ffa500', border: '1px solid rgba(255, 165, 0, 0.3)'
        }}>
          RUSHED
        </span>
      );
    }
    return (
      <span style={{
        padding: '3px 8px', borderRadius: 4,
        fontSize: '0.72rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
        background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.3)'
      }}>
        ANOMALY
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080c0d', color: '#f0f4f5', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Navigation header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <Link href="/" style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}>
              ← Return to Finomaly Home
            </Link>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Verification Audit Log
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0,245,212,0.1)', color: '#00f5d4', border: '1px solid rgba(0,245,212,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                IMMUTABLE
              </span>
            </h1>
          </div>
          <button
            onClick={() => fetchAuditLogs(userId)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8,
              border: '1px solid rgba(0,245,212,0.3)', background: 'rgba(0,245,212,0.08)',
              color: '#00f5d4', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem',
            }}
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {/* User ID lookup bar & Filter mode toggle */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
              TELEMETRY AUDIT SOURCE
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('session');
                  fetchAuditLogs(userId, 'session');
                }}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: filterMode === 'session' ? '1px solid #00f5d4' : '1px solid var(--border)',
                  background: filterMode === 'session' ? 'rgba(0,245,212,0.1)' : 'transparent',
                  color: filterMode === 'session' ? '#00f5d4' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                My Session
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('all');
                  fetchAuditLogs('all', 'all');
                }}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: filterMode === 'all' ? '1px solid #00f5d4' : '1px solid var(--border)',
                  background: filterMode === 'all' ? 'rgba(0,245,212,0.1)' : 'transparent',
                  color: filterMode === 'all' ? '#00f5d4' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                All System Audits
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={filterMode === 'all' ? 'ALL_SYSTEM_AUDITS (Latest 20 across all demo sessions)' : userId}
              disabled={filterMode === 'all'}
              onChange={e => setUserId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--background)',
                color: filterMode === 'all' ? 'var(--muted-foreground)' : '#00f5d4',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
              }}
            />
            <button
              onClick={() => fetchAuditLogs(userId, filterMode)}
              style={{
                padding: '0.5rem 1rem', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--secondary)',
                color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              Lookup
            </button>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            Each demo session uses an anonymous ephemeral UUID. Typed text is never transmitted or logged.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{ padding: '0.875rem 1rem', borderRadius: 8, background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b35', fontSize: '0.85rem', marginBottom: '1.5rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {error} (Backend database not reachable or no audit logs for this user yet)
          </div>
        )}

        {/* Audit log table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>
              {filterMode === 'all' ? 'LATEST 20 SYSTEM-WIDE VERIFICATION ATTEMPTS' : 'MY RECENT VERIFICATION ATTEMPTS'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
              {logs.length} RECORD{logs.length === 1 ? '' : 'S'}
            </span>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', margin: 0 }}>
                {loading ? 'Querying audit records from Supabase…' : 'No verification attempts logged yet for this session.'}
              </p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
                Complete an authentication session from the home page, or switch to view all system audits.
              </p>
              {filterMode === 'session' && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('all');
                    fetchAuditLogs('all', 'all');
                  }}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.45rem 1rem',
                    borderRadius: 6,
                    border: '1px solid rgba(0,245,212,0.4)',
                    background: 'rgba(0,245,212,0.08)',
                    color: '#00f5d4',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                  }}
                >
                  View All Recent System Audits ↗
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>TIMESTAMP</th>
                    <th style={{ padding: '0.75rem 1rem' }}>SCORE</th>
                    <th style={{ padding: '0.75rem 1rem' }}>BAND</th>
                    <th style={{ padding: '0.75rem 1rem' }}>FLAGS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>LOG ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const dateStr = new Date(log.created_at).toLocaleString();
                    const scorePct = `${Math.round(Number(log.score) * 100)}%`;
                    const hasPaste = Boolean(log.flags?.pasteDetected);
                    const hasBot = Boolean(log.flags?.botSuspected);

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'JetBrains Mono, monospace' }}>
                        <td style={{ padding: '0.875rem 1rem', color: 'var(--muted-foreground)', fontSize: '0.78rem' }}>
                          {dateStr}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#f0f4f5' }}>
                          {scorePct}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {getBandBadge(log.band)}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {hasPaste || hasBot ? (
                            <span style={{ color: '#ff6b35', fontSize: '0.75rem' }}>
                              {hasPaste ? 'PASTE_INTERCEPT ' : ''}
                              {hasBot ? 'BOT_DETECTED' : ''}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: 'var(--muted-foreground)', fontSize: '0.72rem' }}>
                          {log.id.slice(0, 8)}…
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
