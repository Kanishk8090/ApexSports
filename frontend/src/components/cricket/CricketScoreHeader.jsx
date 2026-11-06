import React from 'react';
import { Trophy, MapPin, Activity, Flame } from 'lucide-react';

const CricketScoreHeader = ({ data, onOpenConsole, isOrganizer }) => {
  if (!data) return null;
  const { match, currentInnings, liveState, inningsScorecards = [] } = data;

  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  // Find recent deliveries for active over display
  const recentDeliveries = currentInnings?.commentary?.slice(0, 8).reverse() || [];

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        marginBottom: '1.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge badge-blue">
            <Trophy size={13} style={{ marginRight: '4px' }} />
            {match.tournament?.name || 'Cricket Tournament'}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>• Round {match.round} • Match #{match.matchNumber}</span>
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
                fontWeight: 700,
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              LIVE • {match.currentPeriod?.replace('_', ' ') || 'INNINGS 1'}
            </span>
          )}
          {isCompleted && (
            <span className="badge badge-emerald">
              FINAL RESULT
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

      {/* Main Score Centerpiece */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        {/* Batting Team Primary Score */}
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Innings • {currentInnings?.battingTeam?.name || 'Batting Team'}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {currentInnings ? `${currentInnings.totalRuns}/${currentInnings.totalWickets}` : '0/0'}
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-lime)' }}>
              ({currentInnings?.overs || '0.0'} / {currentInnings?.oversLimit || 20} ov)
            </span>
          </div>

          {/* Run Rates & Target Info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <div>
              CRR: <strong style={{ color: '#fff' }}>{currentInnings?.currentRunRate || '0.00'}</strong>
            </div>

            {currentInnings?.targetRuns && (
              <>
                <div>
                  Target: <strong style={{ color: 'var(--accent-amber)' }}>{currentInnings.targetRuns}</strong>
                </div>
                <div>
                  RRR: <strong style={{ color: 'var(--accent-lime)' }}>{liveState?.requiredRunRate || '0.00'}</strong>
                </div>
                <div style={{ color: 'var(--text-dim)' }}>
                  Need <strong>{liveState?.runsNeeded ?? 0}</strong> runs in <strong>{liveState?.ballsRemaining ?? 0}</strong> balls
                </div>
              </>
            )}
          </div>
        </div>

        {/* Previous Innings Summary if 2nd innings */}
        {inningsScorecards.length > 1 && (
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              1st Innings: {inningsScorecards[0].battingTeam.name}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              {inningsScorecards[0].totalRuns}/{inningsScorecards[0].totalWickets}{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({inningsScorecards[0].overs} ov)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Run Rate: {inningsScorecards[0].currentRunRate}
            </div>
          </div>
        )}
      </div>

      {/* On-Crease Batters & Active Bowler Bar (ESPN-style ticker) */}
      {isLive && currentInnings && (
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Batters */}
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
              BATTERS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>
                  {liveState?.activeStriker?.player?.name || 'Striker'} *
                </span>
                <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>
                  {liveState?.activeStriker?.runs ?? 0} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({liveState?.activeStriker?.balls ?? 0})</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {liveState?.activeNonStriker?.player?.name || 'Non-striker'}
                </span>
                <span style={{ color: '#fff' }}>
                  {liveState?.activeNonStriker?.runs ?? 0} <span style={{ color: 'var(--text-dim)' }}>({liveState?.activeNonStriker?.balls ?? 0})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bowler & Recent Balls */}
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                BOWLER
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>RECENT DELIVERIES</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                  {liveState?.activeBowler?.player?.name || 'Bowler'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {liveState?.activeBowler?.overs || '0.0'} ov • {liveState?.activeBowler?.wickets || 0}/{liveState?.activeBowler?.runsConceded || 0} • Econ {liveState?.activeBowler?.economy || '0.00'}
                </div>
              </div>

              {/* Recent Balls Badges */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {recentDeliveries.length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>New over</span>
                ) : (
                  recentDeliveries.map((del, idx) => {
                    let bg = 'rgba(255,255,255,0.08)';
                    let color = '#fff';
                    let label = `${del.runs}`;

                    if (del.isWicket) {
                      bg = '#ef4444';
                      color = '#fff';
                      label = 'W';
                    } else if (del.runs === 4) {
                      bg = '#1558C9';
                      color = '#fff';
                      label = '4';
                    } else if (del.runs === 6) {
                      bg = '#10b981';
                      color = '#fff';
                      label = '6';
                    } else if (del.extrasType) {
                      bg = 'rgba(245, 158, 11, 0.3)';
                      color = '#f59e0b';
                      label = del.extrasType === 'WIDE' ? 'Wd' : del.extrasType === 'NO_BALL' ? 'Nb' : 'Ex';
                    } else if (del.runs === 0) {
                      label = '•';
                      color = 'var(--text-dim)';
                    }

                    return (
                      <span
                        key={idx}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: bg,
                          color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {label}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Result Banner if finished */}
      {isCompleted && match.result && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Trophy size={18} color="var(--accent-lime)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {match.result.winnerTeam ? `${match.result.winnerTeam.name} WON` : 'MATCH TIED'}
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-lime)' }}>
            Official Result Published
          </span>
        </div>
      )}
    </div>
  );
};

export default CricketScoreHeader;

