import React from 'react';

const StatBar = ({ label, homeValue, awayValue, isPercentage = false }) => {
  const hVal = Number(homeValue) || 0;
  const aVal = Number(awayValue) || 0;
  const total = hVal + aVal;

  let homePct = 50;
  let awayPct = 50;

  if (total > 0) {
    homePct = Math.round((hVal / total) * 100);
    awayPct = 100 - homePct;
  }

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.88rem' }}>
        <span style={{ fontWeight: 800, color: '#fff', minWidth: '35px' }}>
          {isPercentage ? `${hVal}%` : hVal}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <span style={{ fontWeight: 800, color: '#fff', minWidth: '35px', textAlign: 'right' }}>
          {isPercentage ? `${aVal}%` : aVal}
        </span>
      </div>

      <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${homePct}%`, background: 'var(--accent-primary)', transition: 'width 0.4s ease' }} />
        <div style={{ width: `${awayPct}%`, background: '#64748b', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

const FootballStats = ({ data }) => {
  const { stats, homeTeam, awayTeam } = data || {};
  const home = stats?.home || {};
  const away = stats?.away || {};

  return (
    <div className="glass-card" style={{ padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      {/* Header with Team Legends */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--accent-primary)' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            {homeTeam?.name || 'Home Team'}
          </h4>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
          Match Statistics
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            {awayTeam?.name || 'Away Team'}
          </h4>
          <div style={{ width: 12, height: 12, borderRadius: '3px', background: '#64748b' }} />
        </div>
      </div>

      {/* Comparison Bars */}
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <StatBar label="Ball Possession" homeValue={home.possession || 50} awayValue={away.possession || 50} isPercentage={true} />
        <StatBar label="Total Shots" homeValue={home.shots || 0} awayValue={away.shots || 0} />
        <StatBar label="Shots on Target" homeValue={home.shotsOnTarget || 0} awayValue={away.shotsOnTarget || 0} />
        <StatBar label="Corner Kicks" homeValue={home.corners || 0} awayValue={away.corners || 0} />
        <StatBar label="Fouls Committed" homeValue={home.fouls || 0} awayValue={away.fouls || 0} />
        <StatBar label="Yellow Cards" homeValue={home.yellowCards || 0} awayValue={away.yellowCards || 0} />
        <StatBar label="Red Cards" homeValue={home.redCards || 0} awayValue={away.redCards || 0} />
        <StatBar label="Goalkeeper Saves" homeValue={home.saves || 0} awayValue={away.saves || 0} />
        <StatBar label="Offsides" homeValue={home.offsides || 0} awayValue={away.offsides || 0} />
      </div>
    </div>
  );
};

export default FootballStats;

