import React from 'react';
import { Trophy, MapPin, Activity, Flame, Clock } from 'lucide-react';

const FootballScoreHeader = ({ data, onOpenConsole, isOrganizer }) => {
  if (!data) return null;
  const { match, homeTeam, awayTeam, homeScore = 0, awayScore = 0, clock } = data;

  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  // Format clock label: e.g. 67', HT, FT, 45+2'
  let clockLabel = `${clock?.minute || 0}'`;
  if (clock?.period === 'HT') clockLabel = 'HT';
  else if (clock?.period === 'FT') clockLabel = 'FT';
  else if (clock?.period === 'ET1') clockLabel = `105' ET`;
  else if (clock?.period === 'ET2') clockLabel = `120' ET`;
  else if (clock?.period === 'PEN') clockLabel = 'PEN';

  return (
    <div
      className="glass-card"
      style={{
        padding: '2rem 1.75rem',
        marginBottom: '1.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge badge-blue">
            <Trophy size={13} style={{ marginRight: '4px' }} />
            {match.tournament?.name || 'Football Championship'}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>• Matchday {match.round}</span>
          {match.venue && (
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={12} /> {match.venue.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isLive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              LIVE • {clock?.period || '1H'}
            </span>
          )}
          {isCompleted && (
            <span className="badge badge-emerald">
              FULL TIME
            </span>
          )}
          {match.status === 'SCHEDULED' && (
            <span className="badge badge-amber">
              UPCOMING
            </span>
          )}

          {isOrganizer && onOpenConsole && (
            <button
              onClick={onOpenConsole}
              className="btn btn-lime btn-sm"
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Flame size={14} /> Open Scoring Console
            </button>
          )}
        </div>
      </div>

      {/* ESPN-Style Centerpiece: Home vs Away Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1.5rem' }}>
        {/* Home Team */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.25rem', textAlign: 'right' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
              {homeTeam?.name || 'Home Team'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HOME
            </span>
          </div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1558C9, #0e3d8f)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#fff',
              border: '2px solid rgba(212, 255, 36, 0.3)',
              boxShadow: '0 4px 14px rgba(21, 88, 201, 0.4)',
            }}
          >
            {homeTeam?.name?.substring(0, 2).toUpperCase() || 'H'}
          </div>
        </div>

        {/* Big Score Display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '130px' }}>
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '0.5rem 1.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {homeScore}
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--text-dim)', lineHeight: 1 }}>
              -
            </span>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {awayScore}
            </span>
          </div>

          {/* Match Minute Ticker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.88rem',
              fontWeight: 800,
              color: isLive ? 'var(--accent-lime)' : 'var(--text-muted)',
              marginTop: '0.45rem',
            }}
          >
            <Clock size={13} /> {clockLabel}
          </div>
        </div>

        {/* Away Team */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1.25rem', textAlign: 'left' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #374151, #1f2937)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#fff',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {awayTeam?.name?.substring(0, 2).toUpperCase() || 'A'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
              {awayTeam?.name || 'Away Team'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AWAY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FootballScoreHeader;

