import React, { useState } from 'react';
import { cricketAPI } from '../../services/api';
import {
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Play,
  UserCheck,
  ShieldAlert,
  ArrowRightLeft,
  X,
  Flag,
} from 'lucide-react';

const CricketScoringConsole = ({ data, onUpdate, onClose }) => {
  const { match, currentInnings, liveState } = data || {};

  // Form states for starting innings
  const [showStartModal, setShowStartModal] = useState(!currentInnings || currentInnings.isCompleted);
  const [battingTeamId, setBattingTeamId] = useState(currentInnings?.battingTeamId || match.matchTeams[0]?.teamId || '');
  const [strikerId, setStrikerId] = useState('');
  const [nonStrikerId, setNonStrikerId] = useState('');
  const [bowlerId, setBowlerId] = useState('');
  const [oversLimit, setOversLimit] = useState(20);

  // Wicket Modal state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketForm, setWicketForm] = useState({
    wicketType: 'CAUGHT',
    dismissedPlayerId: '',
    fielderId: '',
    newBatterId: '',
    runs: 0,
    extrasType: null,
  });

  // End Over / Change Bowler Modal
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [newBowlerId, setNewBowlerId] = useState('');

  // Loading & feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Teams & Players
  const homeTeamRel = match.matchTeams.find((mt) => mt.side === 'HOME');
  const awayTeamRel = match.matchTeams.find((mt) => mt.side === 'AWAY');

  const battingTeamRel = match.matchTeams.find((mt) => mt.teamId === battingTeamId) || homeTeamRel;
  const bowlingTeamRel = match.matchTeams.find((mt) => mt.teamId !== battingTeamId) || awayTeamRel;

  const battingRoster = battingTeamRel?.team?.teamPlayers?.map((tp) => tp.player) || [];
  const bowlingRoster = bowlingTeamRel?.team?.teamPlayers?.map((tp) => tp.player) || [];

  // Currently batted players in this innings
  const alreadyBattedIds = currentInnings?.battingScorecard?.filter((b) => b.isOut).map((b) => b.player.id) || [];
  const availableBatters = battingRoster.filter(
    (p) => !alreadyBattedIds.includes(p.id) && p.id !== match.currentStrikerId && p.id !== match.currentNonStrikerId
  );

  // Submit delivery
  const handleScoreBall = async (runs = 0, extrasType = null, extraRuns = 0) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const payload = {
        runs,
        extrasType,
        extraRuns,
        isWicket: false,
      };

      const res = await cricketAPI.recordDelivery(match.id, payload);
      if (res.data.success) {
        onUpdate(res.data.data);
        setMessage(`Delivery recorded: ${extrasType ? extrasType : runs + ' runs'}`);

        // Check if over ended: 6 legal balls reached in this over
        const newInnings = res.data.data.currentInnings;
        if (newInnings && newInnings.legalBalls > 0 && newInnings.legalBalls % 6 === 0) {
          setShowBowlerModal(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record delivery');
    } finally {
      setLoading(false);
    }
  };

  // Submit Wicket Delivery
  const handleWicketSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const payload = {
        runs: parseInt(wicketForm.runs, 10) || 0,
        extrasType: wicketForm.extrasType || null,
        isWicket: true,
        wicketType: wicketForm.wicketType,
        dismissedPlayerId: wicketForm.dismissedPlayerId || match.currentStrikerId,
        fielderId: wicketForm.fielderId || null,
        newBatterId: wicketForm.newBatterId || null,
      };

      const res = await cricketAPI.recordDelivery(match.id, payload);
      if (res.data.success) {
        onUpdate(res.data.data);
        setShowWicketModal(false);
        setMessage(`Wicket recorded: ${wicketForm.wicketType}`);

        // Check if over ended
        const newInnings = res.data.data.currentInnings;
        if (newInnings && newInnings.legalBalls > 0 && newInnings.legalBalls % 6 === 0) {
          setShowBowlerModal(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record wicket');
    } finally {
      setLoading(false);
    }
  };

  // Undo Last Delivery
  const handleUndo = async () => {
    if (!window.confirm('Are you sure you want to undo the last delivery? This will revert scores and player figures.')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await cricketAPI.undoDelivery(match.id);
      if (res.data.success) {
        onUpdate(res.data.data);
        setMessage('Last delivery reverted successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to undo delivery');
    } finally {
      setLoading(false);
    }
  };

  // Start Innings Handler
  const handleStartInnings = async (e) => {
    e.preventDefault();
    if (!battingTeamId || !strikerId || !nonStrikerId || !bowlerId) {
      setError('Please select Batting Team, Opening Striker, Non-Striker, and Opening Bowler.');
      return;
    }
    if (strikerId === nonStrikerId) {
      setError('Striker and Non-striker must be different players.');
      return;
    }

    const otherTeamId = match.matchTeams.find((mt) => mt.teamId !== battingTeamId)?.teamId;

    try {
      setLoading(true);
      setError('');
      const payload = {
        battingTeamId,
        bowlingTeamId: otherTeamId,
        strikerId,
        nonStrikerId,
        bowlerId,
        oversLimit: parseInt(oversLimit, 10) || 20,
      };

      const res = await cricketAPI.startInnings(match.id, payload);
      if (res.data.success) {
        onUpdate(res.data.data);
        setShowStartModal(false);
        setMessage('Innings commenced successfully! You can now score ball-by-ball.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start innings');
    } finally {
      setLoading(false);
    }
  };

  // Switch Strike Manually
  const handleSwapStrike = async () => {
    try {
      setLoading(true);
      const res = await cricketAPI.updateActivePlayers(match.id, {
        strikerId: match.currentNonStrikerId,
        nonStrikerId: match.currentStrikerId,
      });
      if (res.data.success) {
        onUpdate(res.data.data);
        setMessage('Strike rotated');
      }
    } catch (err) {
      setError('Failed to swap strike');
    } finally {
      setLoading(false);
    }
  };

  // Change Bowler
  const handleChangeBowler = async (e) => {
    e.preventDefault();
    if (!newBowlerId) return;
    try {
      setLoading(true);
      const res = await cricketAPI.updateActivePlayers(match.id, {
        bowlerId: newBowlerId,
      });
      if (res.data.success) {
        onUpdate(res.data.data);
        setShowBowlerModal(false);
        setNewBowlerId('');
        setMessage('New bowler assigned for the over');
      }
    } catch (err) {
      setError('Failed to change bowler');
    } finally {
      setLoading(false);
    }
  };

  // Finalize Cricket Match
  const handleFinalize = async () => {
    if (!window.confirm('Finalize this Cricket match and update tournament standings? This will record the result.')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await cricketAPI.finalizeMatch(match.id, {});
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

  // End Innings
  const handleEndInnings = async () => {
    if (!window.confirm('Conclude this innings? You can then start the 2nd innings with target chase.')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await cricketAPI.endInnings(match.id, {});
      if (res.data.success) {
        onUpdate(res.data.data);
        setShowStartModal(true);
        setMessage('Innings concluded. Please configure the next innings.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end innings');
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
            Organizer Cricket Scoring Console
          </h3>
          <span className="badge badge-blue">Official Scorer</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={15} /> Close Console
          </button>
        </div>
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

      {/* If No Innings Started -> Show Setup */}
      {(!currentInnings || currentInnings.isCompleted || showStartModal) ? (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
            Configure Innings {currentInnings ? currentInnings.inningsNumber + 1 : 1}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Select batting and bowling lineups, opening batters, and opening bowler to start ball-by-ball scoring.
          </p>

          <form onSubmit={handleStartInnings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Batting Team</label>
              <select
                className="form-control"
                value={battingTeamId}
                onChange={(e) => setBattingTeamId(e.target.value)}
                required
              >
                {match.matchTeams.map((mt) => (
                  <option key={mt.teamId} value={mt.teamId}>
                    {mt.team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Overs Limit</label>
              <input
                type="number"
                min="1"
                max="100"
                className="form-control"
                value={oversLimit}
                onChange={(e) => setOversLimit(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Opening Striker (*)</label>
              <select
                className="form-control"
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                required
              >
                <option value="">Select Opening Striker</option>
                {battingRoster.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Opening Non-Striker</label>
              <select
                className="form-control"
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                required
              >
                <option value="">Select Non-Striker</option>
                {battingRoster.filter((p) => p.id !== strikerId).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Opening Bowler</label>
              <select
                className="form-control"
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                required
              >
                <option value="">Select Opening Bowler</option>
                {bowlingRoster.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>
                <Play size={16} /> Commence Innings
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Innings Active - Live Scoring Pad */
        <div>
          {/* Active Batsmen & Bowler summary */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Striker:</span>{' '}
                <strong style={{ color: 'var(--accent-lime)' }}>{liveState?.activeStriker?.player?.name || 'Striker'} *</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Non-Striker:</span>{' '}
                <span style={{ color: '#fff' }}>{liveState?.activeNonStriker?.player?.name || 'Non-Striker'}</span>
              </div>
              <button
                type="button"
                onClick={handleSwapStrike}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                title="Swap Strike"
                style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <ArrowRightLeft size={12} /> Swap Strike
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Bowler:</span>{' '}
                <strong style={{ color: '#fff' }}>{liveState?.activeBowler?.player?.name || 'Bowler'}</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowBowlerModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              >
                Change Bowler
              </button>
            </div>
          </div>

          {/* Quick Runs Controls */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              RECORD RUNS OFF BAT:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(65px, 1fr))', gap: '0.65rem' }}>
              {[0, 1, 2, 3, 4, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => handleScoreBall(r, null, 0)}
                  disabled={loading}
                  className={`btn ${r === 4 ? 'btn-primary' : r === 6 ? 'btn-emerald' : 'btn-secondary'}`}
                  style={{
                    height: '52px',
                    fontSize: '1.3rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: r >= 4 ? '0 4px 14px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {r === 0 ? '• 0' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Extras Controls & Wicket Button */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => handleScoreBall(0, 'WIDE', 1)}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
            >
              Wide (+1)
            </button>
            <button
              onClick={() => handleScoreBall(0, 'NO_BALL', 1)}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
            >
              No Ball (+1)
            </button>
            <button
              onClick={() => handleScoreBall(0, 'BYE', 1)}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontWeight: 700 }}
            >
              Bye (+1)
            </button>
            <button
              onClick={() => handleScoreBall(0, 'LEG_BYE', 1)}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontWeight: 700 }}
            >
              Leg Bye (+1)
            </button>
            <button
              onClick={() => {
                setWicketForm({
                  wicketType: 'BOWLED',
                  dismissedPlayerId: match.currentStrikerId,
                  fielderId: '',
                  newBatterId: availableBatters[0]?.id || '',
                  runs: 0,
                  extrasType: null,
                });
                setShowWicketModal(true);
              }}
              disabled={loading}
              className="btn btn-rose"
              style={{ fontWeight: 800, fontSize: '0.95rem' }}
            >
              WICKET!
            </button>
          </div>

          {/* Undo and Conclude Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <button
              onClick={handleUndo}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RotateCcw size={14} /> Undo Last Ball
            </button>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={handleEndInnings}
                disabled={loading}
                className="btn btn-secondary btn-sm"
              >
                Conclude Innings
              </button>
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="btn btn-emerald btn-sm"
                style={{ fontWeight: 700 }}
              >
                <CheckCircle size={14} /> Finalize Match & Standings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wicket Dialog Modal */}
      {showWicketModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>
                Record Fall of Wicket
              </h3>
              <button onClick={() => setShowWicketModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Dismissal Type</label>
                <select
                  className="form-control"
                  value={wicketForm.wicketType}
                  onChange={(e) => setWicketForm({ ...wicketForm, wicketType: e.target.value })}
                  required
                >
                  <option value="BOWLED">Bowled</option>
                  <option value="CAUGHT">Caught</option>
                  <option value="LBW">LBW (Leg Before Wicket)</option>
                  <option value="RUN_OUT">Run Out</option>
                  <option value="STUMPED">Stumped</option>
                  <option value="HIT_WICKET">Hit Wicket</option>
                  <option value="RETIRED_OUT">Retired Out</option>
                  <option value="RETIRED_HURT">Retired Hurt</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Batter Dismissed</label>
                <select
                  className="form-control"
                  value={wicketForm.dismissedPlayerId}
                  onChange={(e) => setWicketForm({ ...wicketForm, dismissedPlayerId: e.target.value })}
                  required
                >
                  <option value={match.currentStrikerId}>
                    {liveState?.activeStriker?.player?.name} (Striker)
                  </option>
                  <option value={match.currentNonStrikerId}>
                    {liveState?.activeNonStriker?.player?.name} (Non-Striker)
                  </option>
                </select>
              </div>

              {(wicketForm.wicketType === 'CAUGHT' || wicketForm.wicketType === 'RUN_OUT' || wicketForm.wicketType === 'STUMPED') && (
                <div className="form-group">
                  <label className="form-label">Fielder / Catcher / Keeper</label>
                  <select
                    className="form-control"
                    value={wicketForm.fielderId}
                    onChange={(e) => setWicketForm({ ...wicketForm, fielderId: e.target.value })}
                  >
                    <option value="">Select Fielder (Optional)</option>
                    {bowlingRoster.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Next Incoming Batter</label>
                <select
                  className="form-control"
                  value={wicketForm.newBatterId}
                  onChange={(e) => setWicketForm({ ...wicketForm, newBatterId: e.target.value })}
                >
                  <option value="">Select New Batter</option>
                  {availableBatters.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowWicketModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-rose" style={{ fontWeight: 700 }}>
                  Confirm Wicket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Select New Bowler for Over Modal */}
      {showBowlerModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                End of Over: Select New Bowler
              </h3>
              <button onClick={() => setShowBowlerModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              6 legal deliveries completed. Under cricket rules, the same bowler cannot bowl consecutive overs.
            </p>

            <form onSubmit={handleChangeBowler}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Next Bowler</label>
                <select
                  className="form-control"
                  value={newBowlerId}
                  onChange={(e) => setNewBowlerId(e.target.value)}
                  required
                >
                  <option value="">Choose Bowler</option>
                  {bowlingRoster
                    .filter((p) => p.id !== match.currentBowlerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowBowlerModal(false)} className="btn btn-secondary">
                  Dismiss
                </button>
                <button type="submit" disabled={!newBowlerId || loading} className="btn btn-primary">
                  Confirm Bowler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CricketScoringConsole;

