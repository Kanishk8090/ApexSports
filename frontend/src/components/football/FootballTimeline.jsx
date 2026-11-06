import React from 'react';
import { Award, ArrowRightLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const FootballTimeline = ({ data }) => {
  const { events = [], homeTeam, awayTeam } = data || {};

  if (!events || events.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No match events recorded yet. Goals, cards, and substitutions will stream here in real-time.
      </div>
    );
  }

  // Sort events chronologically descending for vertical timeline
  const sortedEvents = events.slice().reverse();

  return (
    <div className="glass-card" style={{ padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>
        Match Events Timeline
      </h3>

      <div style={{ position: 'relative', maxWidth: '750px', margin: '0 auto' }}>
        {/* Central Vertical Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(-50%)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sortedEvents.map((evt) => {
            const isHome = evt.teamId === homeTeam?.id;
            const isPeriod = evt.eventType === 'PERIOD_START' || evt.eventType === 'PERIOD_END';

            // Period Whistle in Center
            if (isPeriod) {
              return (
                <div key={evt.id} style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      padding: '4px 14px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Clock size={12} /> {evt.minute}' {evt.description}
                  </div>
                </div>
              );
            }

            // Normal Event: Left for Home, Right for Away
            return (
              <div
                key={evt.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 1fr',
                  alignItems: 'center',
                  gap: '1rem',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Left (Home Side) */}
                <div style={{ textAlign: 'right' }}>
                  {isHome && (
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                        {evt.primaryPlayer?.name || 'Player'}
                        {evt.eventType === 'GOAL' && (
                          <span style={{ color: 'var(--accent-lime)', fontWeight: 800, marginLeft: '6px' }}>
                            GOAL!
                          </span>
                        )}
                        {evt.eventType === 'YELLOW_CARD' && (
                          <span style={{ color: '#fbbf24', marginLeft: '6px' }}>🟨</span>
                        )}
                        {evt.eventType === 'RED_CARD' && (
                          <span style={{ color: '#f87171', marginLeft: '6px' }}>🟥</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {evt.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Center Minute Bubble */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: evt.eventType === 'GOAL' ? '#1558C9' : evt.eventType === 'RED_CARD' ? '#ef4444' : evt.eventType === 'YELLOW_CARD' ? 'rgba(245, 158, 11, 0.3)' : 'var(--bg-secondary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      border: '2px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}
                  >
                    {evt.minute}'
                  </div>
                </div>

                {/* Right (Away Side) */}
                <div style={{ textAlign: 'left' }}>
                  {!isHome && (
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                        {evt.eventType === 'GOAL' && (
                          <span style={{ color: 'var(--accent-lime)', fontWeight: 800, marginRight: '6px' }}>
                            GOAL!
                          </span>
                        )}
                        {evt.eventType === 'YELLOW_CARD' && (
                          <span style={{ color: '#fbbf24', marginRight: '6px' }}>🟨</span>
                        )}
                        {evt.eventType === 'RED_CARD' && (
                          <span style={{ color: '#f87171', marginRight: '6px' }}>🟥</span>
                        )}
                        {evt.primaryPlayer?.name || 'Player'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {evt.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FootballTimeline;

