import React from 'react';

const CricketCommentary = ({ data }) => {
  const { currentInnings, inningsScorecards = [] } = data || {};

  // All deliveries from current innings (or latest)
  const deliveries = currentInnings?.commentary || [];

  if (deliveries.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No ball-by-ball commentary recorded yet. Deliveries will stream here live as the match is scored!
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
          Ball-by-Ball Live Commentary
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {currentInnings?.battingTeam?.name} Innings • {deliveries.length} deliveries
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {deliveries.map((d) => {
          let badgeBg = 'rgba(255,255,255,0.08)';
          let badgeColor = '#fff';
          let badgeText = `${d.runs}`;

          if (d.isWicket) {
            badgeBg = '#ef4444';
            badgeColor = '#fff';
            badgeText = 'W';
          } else if (d.runs === 4) {
            badgeBg = '#1558C9';
            badgeColor = '#fff';
            badgeText = '4';
          } else if (d.runs === 6) {
            badgeBg = '#10b981';
            badgeColor = '#fff';
            badgeText = '6';
          } else if (d.extrasType) {
            badgeBg = 'rgba(245, 158, 11, 0.25)';
            badgeColor = '#f59e0b';
            badgeText = d.extrasType === 'WIDE' ? 'Wd' : d.extrasType === 'NO_BALL' ? 'Nb' : 'Ex';
          } else if (d.runs === 0) {
            badgeText = '•';
            badgeColor = 'var(--text-dim)';
          }

          const overBallFormatted = `${Math.floor(d.legalBallNumber / 6)}.${d.legalBallNumber % 6}`;

          return (
            <div
              key={d.id}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                padding: '0.85rem 1rem',
                background: d.isWicket ? 'rgba(239, 68, 68, 0.08)' : d.runs >= 4 ? 'rgba(21, 88, 201, 0.08)' : 'var(--bg-secondary)',
                border: d.isWicket ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {/* Over & Ball Badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '45px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-lime)' }}>
                  {overBallFormatted}
                </span>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: badgeBg,
                    color: badgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    marginTop: '4px',
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Delivery Details */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                  {d.bowler?.name} to {d.striker?.name}
                  {d.isWicket && (
                    <span style={{ marginLeft: '8px', color: '#f87171', fontWeight: 800 }}>
                      WICKET! ({d.wicketType})
                    </span>
                  )}
                  {d.runs >= 4 && !d.extrasType && (
                    <span style={{ marginLeft: '8px', color: d.runs === 6 ? '#34d399' : '#60a5fa', fontWeight: 800 }}>
                      {d.runs === 6 ? 'MAXIMUM!' : 'FOUR!'}
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {d.commentary || 'Delivery completed.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CricketCommentary;

