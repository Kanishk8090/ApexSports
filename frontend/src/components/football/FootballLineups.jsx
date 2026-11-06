import React from 'react';
import { UserCheck, Shield } from 'lucide-react';

const LineupColumn = ({ teamName, starting = [], bench = [], isHome }) => {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.65rem' }}>
        <Shield size={16} color={isHome ? 'var(--accent-primary)' : 'var(--accent-lime)'} />
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          {teamName}
        </h4>
      </div>

      {/* Starting XI */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
          STARTING LINEUP ({starting.length})
        </span>

        {starting.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No starting XI confirmed yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {starting.map((l) => (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.03)',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--accent-lime)',
                    }}
                  >
                    {l.jerseyNumber || '#'}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    {l.player?.name} {l.isCaptain && <strong style={{ color: 'var(--accent-amber)' }}>(C)</strong>}
                  </span>
                </div>
                <span className="badge badge-blue" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                  {l.position || 'FWD'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Substitutes */}
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
          SUBSTITUTES BENCH ({bench.length})
        </span>

        {bench.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No substitutes listed.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {bench.map((l) => (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: '20px' }}>
                    {l.jerseyNumber || '-'}
                  </span>
                  <span>{l.player?.name}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {l.position || 'SUB'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FootballLineups = ({ data }) => {
  const { lineups, homeTeam, awayTeam } = data || {};

  return (
    <div className="glass-card" style={{ padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>
        Team Lineups & Squads
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <LineupColumn
          teamName={homeTeam?.name || 'Home Team'}
          starting={lineups?.home?.starting || []}
          bench={lineups?.home?.bench || []}
          isHome={true}
        />
        <LineupColumn
          teamName={awayTeam?.name || 'Away Team'}
          starting={lineups?.away?.starting || []}
          bench={lineups?.away?.bench || []}
          isHome={false}
        />
      </div>
    </div>
  );
};

export default FootballLineups;

