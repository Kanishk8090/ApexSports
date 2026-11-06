import React, { useState } from 'react';

const CricketScorecard = ({ data }) => {
  const { inningsScorecards = [] } = data || {};
  const [activeTab, setActiveTab] = useState(0);

  if (!inningsScorecards || inningsScorecards.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No innings data recorded yet for this match.
      </div>
    );
  }

  const currentScorecard = inningsScorecards[activeTab] || inningsScorecards[0];

  return (
    <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
      {/* Innings Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {inningsScorecards.map((inn, idx) => (
          <button
            key={inn.inningsId || idx}
            onClick={() => setActiveTab(idx)}
            className={`btn btn-sm ${activeTab === idx ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            {inn.battingTeam.name} Innings ({inn.totalRuns}/{inn.totalWickets})
          </button>
        ))}
      </div>

      {/* Innings Header Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {currentScorecard.battingTeam.name} Batting
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Overs Limit: {currentScorecard.oversLimit} ov • Run Rate: {currentScorecard.currentRunRate}
          </span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-lime)' }}>
          {currentScorecard.totalRuns}/{currentScorecard.totalWickets}{' '}
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>({currentScorecard.overs} ov)</span>
        </div>
      </div>

      {/* Batting Table (ESPN-styled) */}
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.6rem 0.5rem', width: '30%' }}>Batter</th>
              <th style={{ padding: '0.6rem 0.5rem', width: '30%' }}>Dismissal</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>R</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>B</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>4s</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>6s</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>SR</th>
            </tr>
          </thead>
          <tbody>
            {currentScorecard.battingScorecard.map((b) => (
              <tr key={b.player.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.65rem 0.5rem', color: '#fff', fontWeight: 600 }}>
                  {b.player.name} {!b.isOut && <span style={{ color: 'var(--accent-lime)' }}>*</span>}
                </td>
                <td style={{ padding: '0.65rem 0.5rem', color: b.isOut ? 'var(--text-muted)' : 'var(--accent-lime)', fontSize: '0.82rem' }}>
                  {b.dismissal}
                </td>
                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                  {b.runs}
                </td>
                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                  {b.balls}
                </td>
                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                  {b.fours}
                </td>
                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                  {b.sixes}
                </td>
                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-dim)' }}>
                  {b.strikeRate}
                </td>
              </tr>
            ))}

            {/* Extras Row */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, color: '#fff' }}>
                Extras
              </td>
              <td style={{ padding: '0.65rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                (b {currentScorecard.extras.byes}, lb {currentScorecard.extras.legByes}, w {currentScorecard.extras.wides}, nb {currentScorecard.extras.noBalls}, p {currentScorecard.extras.penalty})
              </td>
              <td colSpan="5" style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                {currentScorecard.extras.total}
              </td>
            </tr>

            {/* Total Row */}
            <tr style={{ background: 'var(--bg-hover)', fontWeight: 800 }}>
              <td style={{ padding: '0.75rem 0.5rem', color: '#fff', fontSize: '0.95rem' }}>
                TOTAL
              </td>
              <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ({currentScorecard.overs} Overs, RR: {currentScorecard.currentRunRate})
              </td>
              <td colSpan="5" style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--accent-lime)' }}>
                {currentScorecard.totalRuns}/{currentScorecard.totalWickets}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fall of Wickets */}
      {currentScorecard.fallOfWickets.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            FALL OF WICKETS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', color: 'var(--text-muted)' }}>
            {currentScorecard.fallOfWickets.map((fow) => (
              <span key={fow.wicketNumber}>
                <strong style={{ color: '#fff' }}>{fow.score}-{fow.wicketNumber}</strong>{' '}
                ({fow.player?.name || 'Batter'}, {fow.overs} ov)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bowling Table */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
          {currentScorecard.bowlingTeam.name} Bowling
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.6rem 0.5rem', width: '35%' }}>Bowler</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>O</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>M</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>R</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>W</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>ECON</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>WD</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>NB</th>
              </tr>
            </thead>
            <tbody>
              {currentScorecard.bowlingScorecard.map((bw) => (
                <tr key={bw.player.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.65rem 0.5rem', color: '#fff', fontWeight: 600 }}>
                    {bw.player.name}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                    {bw.overs}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {bw.maidens}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {bw.runsConceded}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent-lime)' }}>
                    {bw.wickets}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-dim)' }}>
                    {bw.economy}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-dim)' }}>
                    {bw.wides}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-dim)' }}>
                    {bw.noBalls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CricketScorecard;

