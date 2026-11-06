import React, { useState, useEffect } from 'react';
import { sportsAPI } from '../services/api';
import {
  Dribbble,
  Users,
  Trophy,
  ShieldCheck,
} from 'lucide-react';

// Sport icon map — visual identity per sport
const SPORT_META = {
  FTB: { emoji: '⚽', accent: '#1558C9', label: 'Football' },
  CRK: { emoji: '🏏', accent: '#10b981', label: 'Cricket' },
  BSK: { emoji: '🏀', accent: '#f59e0b', label: 'Basketball' },
  TNS: { emoji: '🎾', accent: '#06b6d4', label: 'Tennis' },
  BDM: { emoji: '🏸', accent: '#8b5cf6', label: 'Badminton' },
  VLB: { emoji: '🏐', accent: '#f43f5e', label: 'Volleyball' },
};

const Sports = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sportsAPI
      .getAll()
      .then((res) => {
        if (res.data.success) setSports(res.data.data);
      })
      .catch((err) => console.error('Failed to load sports:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div>
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '0.35rem',
          }}
        >
          <Dribbble color="var(--accent-primary)" size={28} />
          Sports Catalog
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          The platform supports the following 6 sports. Each sport has its own dedicated
          scoring engine, team roster, and tournament structure.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
          Loading sports…
        </div>
      )}

      {/* Sports Grid */}
      {!loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {sports.map((sport) => {
            const meta = SPORT_META[sport.code] || {};
            return (
              <div
                key={sport.id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: `3px solid ${meta.accent || 'var(--accent-primary)'}`,
                }}
              >
                {/* Sport name + emoji */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{meta.emoji || '🏅'}</span>
                  <div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#fff',
                        lineHeight: 1.2,
                      }}
                    >
                      {sport.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: meta.accent || 'var(--accent-primary)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {sport.code}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {sport.description || 'No description available.'}
                </p>

                {/* Stats row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    textAlign: 'center',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-color)',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: meta.accent || 'var(--accent-primary)',
                      }}
                    >
                      {sport._count?.teams ?? 0}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Users size={10} /> Teams
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: 'var(--accent-emerald)',
                      }}
                    >
                      {sport._count?.players ?? 0}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <ShieldCheck size={10} /> Players
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: 'var(--accent-amber)',
                      }}
                    >
                      {sport._count?.tournaments ?? 0}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Trophy size={10} /> Tournaments
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state (shouldn't happen but just in case) */}
      {!loading && sports.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          No sports found. Contact your system administrator.
        </div>
      )}
    </div>
  );
};

export default Sports;
