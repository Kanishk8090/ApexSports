import React, { useState } from 'react';
import { footballAPI } from '../../services/api';
import {
  Play,
  Pause,
  Award,
  ArrowRightLeft,
  CheckCircle,
  RotateCcw,
  Clock,
  X,
  Plus,
  Sliders,
  Trash2,
} from 'lucide-react';

const FootballScoringConsole = ({ data, onUpdate, onClose }) => {
  const { match, homeTeam, awayTeam, homeScore, awayScore, clock, events = [], stats } = data || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'GOAL', 'CARD', 'SUB', 'STATS', 'LINEUP'

  // Goal Form
  const [goalForm, setGoalForm] = useState({
    teamId: homeTeam?.id || '',
    primaryPlayerId: '',
    secondaryPlayerId: '',
    minute: clock?.minute || 1,
    addedTime: '',
    goalType: 'REGULAR',
    description: '',
  });

  // Card Form
  const [cardForm, setCardForm] = useState({
    teamId: homeTeam?.id || '',
    primaryPlayerId: '',
    eventType: 'YELLOW_CARD',
    minute: clock?.minute || 1,
    cardReason: 'Foul',
  });

  // Sub Form
  const [subForm, setSubForm] = useState({
    teamId: homeTeam?.id || '',
    primaryPlayerId: '', // player IN
    secondaryPlayerId: '', // player OUT
    minute: clock?.minute || 1,
  });

  // Stats Form
  const [statsForm, setStatsForm] = useState({
    homePossession: stats?.home?.possession ?? 50,
    awayPossession: stats?.away?.possession ?? 50,
    homeShots: stats?.home?.shots ?? 0,
    awayShots: stats?.away?.shots ?? 0,
    homeCorners: stats?.home?.corners ?? 0,
    awayCorners: stats?.away?.corners ?? 0,
    homeFouls: stats?.home?.fouls ?? 0,
    awayFouls: stats?.away?.fouls ?? 0,
  });

  // Players roster maps
  const homeRoster = match.matchTeams.find((mt) => mt.teamId === homeTeam?.id)?.team?.teamPlayers?.map((tp) => tp.player) || [];
  const awayRoster = match.matchTeams.find((mt) => mt.teamId === awayTeam?.id)?.team?.teamPlayers?.map((tp) => tp.player) || [];

  const getRoster = (teamId) => (teamId === homeTeam?.id ? homeRoster : awayRoster);

  // Start match
  const handleStartMatch = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.startMatch(match.id);
      if (res.data.success) {
        onUpdate(res.data.data);
        setMessage('Match kicked off! Live clock is running.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start match');
    } finally {
      setLoading(false);
    }
  };

  // Clock Actions
  const handleClockAction = async (action, period = null) => {
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.updateClock(match.id, { action, period });
      if (res.data.success) {
        onUpdate(res.data.data);
        setMessage(`Clock updated: ${action} ${period || ''}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update clock');
    } finally {
      setLoading(false);
    }
  };

  // Submit Goal
  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.recordEvent(match.id, {
        ...goalForm,
        eventType: 'GOAL',
        minute: parseInt(goalForm.minute, 10) || clock?.minute || 1,
        addedTime: goalForm.addedTime ? parseInt(goalForm.addedTime, 10) : null,
      });
      if (res.data.success) {
        onUpdate(res.data.data);
        setActiveModal(null);
        setMessage('Goal recorded successfully and score updated!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record goal');
    } finally {
      setLoading(false);
    }
  };

  // Submit Card
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.recordEvent(match.id, {
        ...cardForm,
        minute: parseInt(cardForm.minute, 10) || clock?.minute || 1,
      });
      if (res.data.success) {
        onUpdate(res.data.data);
        setActiveModal(null);
        setMessage('Card recorded.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record card');
    } finally {
      setLoading(false);
    }
  };

  // Submit Sub
  const handleSubSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.recordEvent(match.id, {
        ...subForm,
        eventType: 'SUBSTITUTION',
        minute: parseInt(subForm.minute, 10) || clock?.minute || 1,
      });
      if (res.data.success) {
        onUpdate(res.data.data);
        setActiveModal(null);
        setMessage('Substitution logged.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record substitution');
    } finally {
      setLoading(false);
    }
  };

  // Submit Stats Update
  const handleStatsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.updateStats(match.id, {
        homeStats: {
          teamId: homeTeam.id,
          possession: statsForm.homePossession,
          shots: statsForm.homeShots,
          corners: statsForm.homeCorners,
          fouls: statsForm.homeFouls,
        },
        awayStats: {
          teamId: awayTeam.id,
          possession: statsForm.awayPossession,
          shots: statsForm.awayShots,
          corners: statsForm.awayCorners,
          fouls: statsForm.awayFouls,
        },
      });
      if (res.data.success) {
        onUpdate(res.data.data);
        setActiveModal(null);
        setMessage('Statistics updated successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stats');
    } finally {
      setLoading(false);
    }
  };

  // Undo / Delete Event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? If it was a goal, the score will be reversed automatically.')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.undoEvent(match.id, eventId);
      if (res.data.success) {
        onUpdate(res.data.data);
        setMessage('Event deleted and score adjusted.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  // Finalize Match
  const handleFinalize = async () => {
    if (!window.confirm(`Finalize match with score ${homeScore} - ${awayScore}? This will update tournament standings.`)) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await footballAPI.finalizeMatch(match.id, {});
      if (res.data.success) {
        onUpdate(res.data.data);
        setMessage('Match finalized and tournament standings updated!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Console Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'var(--accent-lime)', width: 10, height: 10, borderRadius: '50%' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Organizer Football Scoring Console
          </h3>
          <span className="badge badge-blue">Official Referee Console</span>
        </div>

        <button onClick={onClose} className="btn btn-secondary btn-sm">
          <X size={15} /> Close Console
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {message}
        </div>
      )}

      {/* Clock & Period Control Bar */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={18} color="var(--accent-lime)" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              MATCH CLOCK & PERIOD
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
              {clock?.minute || 0}' ({clock?.period || match.currentPeriod || 'SCHEDULED'})
            </div>
          </div>
        </div>

        {/* Clock Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {match.status === 'SCHEDULED' && (
            <button onClick={handleStartMatch} disabled={loading} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              <Play size={14} /> Kickoff First Half
            </button>
          )}

          {match.status === 'LIVE' && (
            <>
              {clock?.isRunning ? (
                <button onClick={() => handleClockAction('PAUSE')} disabled={loading} className="btn btn-secondary btn-sm">
                  <Pause size={14} /> Pause Clock
                </button>
              ) : (
                <button onClick={() => handleClockAction('RESUME')} disabled={loading} className="btn btn-lime btn-sm">
                  <Play size={14} /> Resume Clock
                </button>
              )}

              {clock?.period === '1H' && (
                <button onClick={() => handleClockAction('SET_PERIOD', 'HT')} disabled={loading} className="btn btn-secondary btn-sm">
                  Half-Time Whistle
                </button>
              )}

              {clock?.period === 'HT' && (
                <button onClick={() => handleClockAction('SET_PERIOD', '2H')} disabled={loading} className="btn btn-primary btn-sm">
                  Kickoff 2nd Half
                </button>
              )}

              {(clock?.period === '2H' || clock?.period === 'ET2') && (
                <button onClick={() => handleClockAction('SET_PERIOD', 'FT')} disabled={loading} className="btn btn-emerald btn-sm">
                  Full-Time Whistle
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Scoring Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
        <button
          onClick={() => {
            setGoalForm({
              teamId: homeTeam?.id || '',
              primaryPlayerId: homeRoster[0]?.id || '',
              secondaryPlayerId: '',
              minute: clock?.minute || 1,
              addedTime: '',
              goalType: 'REGULAR',
              description: '',
            });
            setActiveModal('GOAL');
          }}
          disabled={loading || match.status === 'SCHEDULED'}
          className="btn btn-primary"
          style={{ height: '48px', fontWeight: 800, fontSize: '0.95rem' }}
        >
          ⚽ RECORD GOAL
        </button>

        <button
          onClick={() => {
            setCardForm({
              teamId: homeTeam?.id || '',
              primaryPlayerId: homeRoster[0]?.id || '',
              eventType: 'YELLOW_CARD',
              minute: clock?.minute || 1,
              cardReason: 'Foul',
            });
            setActiveModal('CARD');
          }}
          disabled={loading || match.status === 'SCHEDULED'}
          className="btn btn-secondary"
          style={{ height: '48px', fontWeight: 800, border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
        >
          🟨 🟥 RECORD CARD
        </button>

        <button
          onClick={() => {
            setSubForm({
              teamId: homeTeam?.id || '',
              primaryPlayerId: '',
              secondaryPlayerId: '',
              minute: clock?.minute || 1,
            });
            setActiveModal('SUB');
          }}
          disabled={loading || match.status === 'SCHEDULED'}
          className="btn btn-secondary"
          style={{ height: '48px', fontWeight: 700 }}
        >
          <ArrowRightLeft size={16} /> SUBSTITUTION
        </button>

        <button
          onClick={() => setActiveModal('STATS')}
          disabled={loading}
          className="btn btn-secondary"
          style={{ height: '48px', fontWeight: 700 }}
        >
          <Sliders size={16} /> EDIT STATS
        </button>

        <button
          onClick={handleFinalize}
          disabled={loading}
          className="btn btn-emerald"
          style={{ height: '48px', fontWeight: 800 }}
        >
          <CheckCircle size={16} /> FINALIZE RESULT
        </button>
      </div>

      {/* Event History with Quick Delete for corrections */}
      <div>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '0.65rem' }}>
          Recent Match Events & Audit Trail
        </h4>

        {events.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No match events logged yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '200px', overflowY: 'auto' }}>
            {events.slice().reverse().map((evt) => (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--accent-lime)', marginRight: '6px' }}>{evt.minute}'</strong>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{evt.eventType}</span> •{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{evt.description}</span>
                </div>

                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  className="btn btn-rose btn-sm"
                  title="Undo / Delete this event"
                  style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {activeModal === 'GOAL' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-lime)' }}>
                ⚽ Record Match Goal
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Team</label>
                <select
                  className="form-control"
                  value={goalForm.teamId}
                  onChange={(e) => {
                    const newTeamId = e.target.value;
                    const roster = getRoster(newTeamId);
                    setGoalForm({
                      ...goalForm,
                      teamId: newTeamId,
                      primaryPlayerId: roster[0]?.id || '',
                      secondaryPlayerId: '',
                    });
                  }}
                  required
                >
                  <option value={homeTeam?.id}>{homeTeam?.name} (Home)</option>
                  <option value={awayTeam?.id}>{awayTeam?.name} (Away)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Goal Scorer</label>
                <select
                  className="form-control"
                  value={goalForm.primaryPlayerId}
                  onChange={(e) => setGoalForm({ ...goalForm, primaryPlayerId: e.target.value })}
                  required
                >
                  <option value="">Select Scorer</option>
                  {getRoster(goalForm.teamId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assisting Player (Optional)</label>
                <select
                  className="form-control"
                  value={goalForm.secondaryPlayerId}
                  onChange={(e) => setGoalForm({ ...goalForm, secondaryPlayerId: e.target.value })}
                >
                  <option value="">No assist (Solo effort)</option>
                  {getRoster(goalForm.teamId)
                    .filter((p) => p.id !== goalForm.primaryPlayerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Match Minute</label>
                  <input
                    type="number"
                    min="1"
                    max="130"
                    className="form-control"
                    value={goalForm.minute}
                    onChange={(e) => setGoalForm({ ...goalForm, minute: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Goal Type</label>
                  <select
                    className="form-control"
                    value={goalForm.goalType}
                    onChange={(e) => setGoalForm({ ...goalForm, goalType: e.target.value })}
                  >
                    <option value="REGULAR">Regular Play</option>
                    <option value="PENALTY">Penalty Kick</option>
                    <option value="OWN_GOAL">Own Goal (credited to opponent)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontWeight: 800 }}>
                  Confirm Goal & Update Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Modal */}
      {activeModal === 'CARD' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                Record Match Card
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Team</label>
                <select
                  className="form-control"
                  value={cardForm.teamId}
                  onChange={(e) => {
                    const newTeamId = e.target.value;
                    const roster = getRoster(newTeamId);
                    setCardForm({
                      ...cardForm,
                      teamId: newTeamId,
                      primaryPlayerId: roster[0]?.id || '',
                    });
                  }}
                  required
                >
                  <option value={homeTeam?.id}>{homeTeam?.name} (Home)</option>
                  <option value={awayTeam?.id}>{awayTeam?.name} (Away)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Player</label>
                <select
                  className="form-control"
                  value={cardForm.primaryPlayerId}
                  onChange={(e) => setCardForm({ ...cardForm, primaryPlayerId: e.target.value })}
                  required
                >
                  {getRoster(cardForm.teamId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Card Type</label>
                  <select
                    className="form-control"
                    value={cardForm.eventType}
                    onChange={(e) => setCardForm({ ...cardForm, eventType: e.target.value })}
                  >
                    <option value="YELLOW_CARD">🟨 Yellow Card</option>
                    <option value="RED_CARD">🟥 Direct Red Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Minute</label>
                  <input
                    type="number"
                    min="1"
                    max="130"
                    className="form-control"
                    value={cardForm.minute}
                    onChange={(e) => setCardForm({ ...cardForm, minute: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Offense</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Reckless tackle, Dissent, Handball"
                  value={cardForm.cardReason}
                  onChange={(e) => setCardForm({ ...cardForm, cardReason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  Confirm Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub Modal */}
      {activeModal === 'SUB' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Record Substitution
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Team</label>
                <select
                  className="form-control"
                  value={subForm.teamId}
                  onChange={(e) => {
                    const newTeamId = e.target.value;
                    const roster = getRoster(newTeamId);
                    setSubForm({
                      ...subForm,
                      teamId: newTeamId,
                      primaryPlayerId: roster[0]?.id || '',
                      secondaryPlayerId: roster[1]?.id || '',
                    });
                  }}
                  required
                >
                  <option value={homeTeam?.id}>{homeTeam?.name} (Home)</option>
                  <option value={awayTeam?.id}>{awayTeam?.name} (Away)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Player Entering (IN) 🟢</label>
                <select
                  className="form-control"
                  value={subForm.primaryPlayerId}
                  onChange={(e) => setSubForm({ ...subForm, primaryPlayerId: e.target.value })}
                  required
                >
                  <option value="">Select incoming substitute</option>
                  {getRoster(subForm.teamId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Player Leaving (OUT) 🔴</label>
                <select
                  className="form-control"
                  value={subForm.secondaryPlayerId}
                  onChange={(e) => setSubForm({ ...subForm, secondaryPlayerId: e.target.value })}
                  required
                >
                  <option value="">Select outgoing player</option>
                  {getRoster(subForm.teamId)
                    .filter((p) => p.id !== subForm.primaryPlayerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Minute</label>
                <input
                  type="number"
                  min="1"
                  max="130"
                  className="form-control"
                  value={subForm.minute}
                  onChange={(e) => setSubForm({ ...subForm, minute: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  Confirm Substitution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {activeModal === 'STATS' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Update Match Statistics
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStatsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Possession */}
              <div>
                <label className="form-label">Ball Possession (%)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{homeTeam?.name}: {statsForm.homePossession}%</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      value={statsForm.homePossession}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setStatsForm({
                          ...statsForm,
                          homePossession: val,
                          awayPossession: Math.max(0, 100 - val),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{awayTeam?.name}: {statsForm.awayPossession}%</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      value={statsForm.awayPossession}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Shots */}
              <div>
                <label className="form-label">Total Shots</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={homeTeam?.name}
                    value={statsForm.homeShots}
                    onChange={(e) => setStatsForm({ ...statsForm, homeShots: e.target.value })}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={awayTeam?.name}
                    value={statsForm.awayShots}
                    onChange={(e) => setStatsForm({ ...statsForm, awayShots: e.target.value })}
                  />
                </div>
              </div>

              {/* Corners */}
              <div>
                <label className="form-label">Corners</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={homeTeam?.name}
                    value={statsForm.homeCorners}
                    onChange={(e) => setStatsForm({ ...statsForm, homeCorners: e.target.value })}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={awayTeam?.name}
                    value={statsForm.awayCorners}
                    onChange={(e) => setStatsForm({ ...statsForm, awayCorners: e.target.value })}
                  />
                </div>
              </div>

              {/* Fouls */}
              <div>
                <label className="form-label">Fouls</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={homeTeam?.name}
                    value={statsForm.homeFouls}
                    onChange={(e) => setStatsForm({ ...statsForm, homeFouls: e.target.value })}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder={awayTeam?.name}
                    value={statsForm.awayFouls}
                    onChange={(e) => setStatsForm({ ...statsForm, awayFouls: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  Save Statistics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FootballScoringConsole;

