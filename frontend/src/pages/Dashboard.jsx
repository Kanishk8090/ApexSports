import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

/* ─── Helper: display team name pair ─────────────────────────── */
const getTeams = (matchTeams = []) => ({
  home: matchTeams.find((mt) => mt.side === 'HOME')?.team,
  away: matchTeams.find((mt) => mt.side === 'AWAY')?.team,
});

const getScore = (scores = [], teamId) =>
  scores.find((s) => s.teamId === teamId)?.scoreValue ?? 0;

/* ─── Pulse dot for LIVE indicator ───────────────────────────── */
const PulseDot = () => (
  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10 }}>
    <span style={{
      position: 'absolute', width: '100%', height: '100%',
      borderRadius: '50%', background: '#D4FF24', opacity: 0.5,
      animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
    }} />
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4FF24', display: 'block' }} />
    <style>{`@keyframes ping{0%{transform:scale(1);opacity:.6}80%,100%{transform:scale(2);opacity:0}}`}</style>
  </span>
);

/* ─── Dashboard ───────────────────────────────────────────────── */
const Dashboard = () => {
  const { user, isAdmin, isOrganizer } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.getSummary();
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { liveMatches = [], upcomingMatches = [], recentResults = [] } = data || {};

  /* ── Shared empty state ── */
  const EmptyState = ({ message }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem', color: 'var(--text-dim)' }}>
      <p style={{ fontSize: '0.9rem' }}>{message}</p>
    </div>
  );

  /* ── Panel wrapper ── */
  const Panel = ({ title, iconColor, count, accent, headerExtra, children }) => (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: accent }} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{title}</h2>
          {count > 0 && (
            <span style={{ background: iconColor, color: '#030407', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem' }}>
              {count}
            </span>
          )}
        </div>
        {headerExtra}
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0.75rem', color: 'var(--text-muted)' }}>
      Loading Sports Dashboard...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      

      {/* ── Layout: Live full-width top, then 2-col bottom ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Row 1 – full width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>


        {/* ── 1. LIVE MATCHES ──────────────────────────────── */}
        <Panel
          title="Live Matches"
          iconColor="#D4FF24"
          count={liveMatches.length}
          
          headerExtra={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PulseDot />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4FF24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Now</span>
            </div>
          }
          gridBody
        >
          {liveMatches.length === 0 ? (
            <EmptyState message="No matches are live right now. Check back soon!" />
          ) : (
            liveMatches.map((m) => {
              const { home, away } = getTeams(m.matchTeams);
              const homeScore = getScore(m.scores, home?.id);
              const awayScore = getScore(m.scores, away?.id);
              return (
                <div key={m.id} style={matchCardStyle('#D4FF24', '0.06')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)' }}>{m.tournament?.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <PulseDot />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#D4FF24', textTransform: 'uppercase' }}>Live</span>
                    </div>
                  </div>

                  {/* Score row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{home?.name ?? '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>HOME</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(212,255,36,0.12)', border: '1px solid rgba(212,255,36,0.3)', padding: '0.35rem 0.85rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D4FF24', fontVariantNumeric: 'tabular-nums' }}>
                        {homeScore} : {awayScore}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{away?.name ?? '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>AWAY</div>
                    </div>
                  </div>

                  {/* Venue */}
                  {m.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {m.venue.name}{m.venue.location ? `, ${m.venue.location}` : ''}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </Panel>
      </div>{/* /row-1 full-width */}

      {/* Row 2 – two columns side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── 2. UPCOMING FIXTURES ─────────────────────────── */}
        <Panel
          title="Upcoming Fixtures"
          iconColor="var(--accent-primary)"
          count={upcomingMatches.length}
          
          headerExtra={
            <Link to="/matches" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
              View all 
            </Link>
          }
        >
          {upcomingMatches.length === 0 ? (
            <EmptyState message="No upcoming fixtures scheduled." />
          ) : (
            upcomingMatches.map((m) => {
              const { home, away } = getTeams(m.matchTeams);
              const dateObj = new Date(m.scheduledAt);
              return (
                <div key={m.id} style={matchCardStyle('#1558C9', '0.07')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                        {m.tournament?.sport?.name && <span className="badge badge-blue" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', marginRight: '0.35rem' }}>{m.tournament.sport.name}</span>}
                        {m.tournament?.name}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                        {home?.name ?? '—'} <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.8rem' }}>vs</span> {away?.name ?? '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5b9aff' }}>
                        {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--text-dim)', justifyContent: 'flex-end', marginTop: '0.1rem' }}>
                        {dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  {m.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {m.venue.name}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </Panel>

        {/* ── 3. RECENT COMPLETED RESULTS ──────────────────── */}
        <Panel
          title="Recent Results"
          iconColor="var(--accent-emerald)"
          count={recentResults.length}
          
          headerExtra={
            <Link to="/standings" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600, textDecoration: 'none' }}>
              Standings 
            </Link>
          }
        >
          {recentResults.length === 0 ? (
            <EmptyState message="No completed results yet." />
          ) : (
            recentResults.map((m) => {
              const { home, away } = getTeams(m.matchTeams);
              const homeScore = getScore(m.scores, home?.id);
              const awayScore = getScore(m.scores, away?.id);
              const winner = m.result?.winnerTeam;
              const isDraw = m.result?.resultType === 'DRAW' || m.result?.resultType === 'TIE';

              const homeIsWinner = !isDraw && winner?.id === home?.id;
              const awayIsWinner = !isDraw && winner?.id === away?.id;

              return (
                <div key={m.id} style={matchCardStyle('#10b981', '0.05')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {m.tournament?.sport?.name && <span className="badge badge-emerald" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', marginRight: '0.3rem' }}>{m.tournament.sport.name}</span>}
                      {m.tournament?.name}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Final</span>
                  </div>

                  {/* Score row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: homeIsWinner ? 800 : 500, color: homeIsWinner ? '#fff' : 'var(--text-muted)' }}>
                        {home?.name ?? '—'} {homeIsWinner && '🏆'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0.3rem 0.8rem' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: isDraw ? '#fbbf24' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
                        {homeScore} : {awayScore}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: awayIsWinner ? 800 : 500, color: awayIsWinner ? '#fff' : 'var(--text-muted)' }}>
                        {awayIsWinner && '🏆'} {away?.name ?? '—'}
                      </div>
                    </div>
                  </div>

                  {isDraw && (
                    <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>Draw / Tie</div>
                  )}
                </div>
              );
            })
          )}
        </Panel>
      </div>{/* /row-2 two-col */}
      </div>{/* /outer flex column */}
    </div>
  );
};

/* Shared match card style helper */
const matchCardStyle = (accentColor) => ({
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderLeft: accentColor ? `3px solid ${accentColor}` : '1px solid var(--border-color)',
  padding: '1rem',
  transition: 'all 0.18s ease',
});

export default Dashboard;