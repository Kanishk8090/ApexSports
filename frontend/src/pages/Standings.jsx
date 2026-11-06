import React, { useState, useEffect } from 'react';
import { tournamentsAPI, standingsAPI } from '../services/api';
import { Trophy, BarChart3, Filter, Award, Shield, ChevronUp, ChevronDown } from 'lucide-react';

const Standings = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTourneyId, setSelectedTourneyId] = useState('');
  const [standings, setStandings] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await tournamentsAPI.getAll();
        if (res.data.success && res.data.data.length > 0) {
          setTournaments(res.data.data);
          setSelectedTourneyId(res.data.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedTourneyId) return;
    const loadStandings = async () => {
      try {
        setLoading(true);
        const [standRes, tourneyRes] = await Promise.all([
          standingsAPI.getByTournament(selectedTourneyId),
          tournamentsAPI.getById(selectedTourneyId),
        ]);

        if (standRes.data.success) {
          setStandings(standRes.data.data);
        }
        if (tourneyRes.data.success) {
          setTournamentInfo(tourneyRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load standings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStandings();
  }, [selectedTourneyId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 color="var(--accent-primary)" size={28} /> Tournament Standings & Tables
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Automatic real-time league rankings, goal/run differences, and competition progression
          </p>
        </div>

        {/* Tournament Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Tournament:</span>
          <select
            className="form-control"
            style={{ minWidth: '260px' }}
            value={selectedTourneyId}
            onChange={(e) => setSelectedTourneyId(e.target.value)}
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.sport.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tournament Info Banner */}
      {tournamentInfo && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.06))', border: '1px solid var(--border-highlight)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), #4338ca)', padding: '0.85rem', borderRadius: '12px', display: 'flex' }}>
              <Trophy size={28} color="#fff" />
            </div>
            <div>
              
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {tournamentInfo.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Teams Registered:</span>{' '}
              <strong style={{ color: '#fff' }}>{tournamentInfo.tournamentTeams?.length || 0}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Matches Played:</span>{' '}
              <strong style={{ color: '#fff' }}>
                {tournamentInfo.matches?.filter((m) => m.status === 'COMPLETED').length || 0} / {tournamentInfo.matches?.length || 0}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Standings Table Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            Official Competition Table
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Scoring Rules: {tournamentInfo?.sport?.code === 'FTB' ? 'Win: 3pts • Draw: 1pt • Loss: 0pts' : 'Win: 2pts • Tie: 1pt • Loss: 0pts'}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Calculating standings...
          </div>
        ) : standings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Award size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3>No standings data</h3>
            <p style={{ fontSize: '0.9rem' }}>Fixtures must be generated and completed to display standings.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Team</th>
                  <th>Played</th>
                  <th>Won</th>
                  <th>Drawn</th>
                  <th>Lost</th>
                  <th>GF / Runs</th>
                  <th>GA / Conceded</th>
                  <th>Diff</th>
                  <th style={{ textAlign: 'center' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => {
                  const isLeader = idx === 0 && s.points > 0;
                  return (
                    <tr
                      key={s.id}
                      style={{
                        background: isLeader ? 'rgba(16, 185, 129, 0.08)' : undefined,
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isLeader ? (
                            <Trophy size={16} color="var(--accent-amber)" />
                          ) : (
                            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>#{s.rank}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Shield size={16} color="var(--accent-primary)" />
                          <span style={{ color: '#fff', fontWeight: 700 }}>{s.team?.name}</span>
                        </div>
                      </td>
                      <td>{s.played}</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{s.wins}</td>
                      <td>{s.draws}</td>
                      <td style={{ color: 'var(--accent-rose)' }}>{s.losses}</td>
                      <td>{s.goalsFor}</td>
                      <td>{s.goalsAgainst}</td>
                      <td style={{ fontWeight: 600, color: s.scoreDifference > 0 ? 'var(--accent-emerald)' : s.scoreDifference < 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                        {s.scoreDifference > 0 ? `+${s.scoreDifference}` : s.scoreDifference}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-indigo" style={{ fontSize: '1rem', fontWeight: 800, padding: '0.35rem 0.85rem' }}>
                          {s.points}
                        </span>
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
  );
};

export default Standings;
