import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { matchesAPI, tournamentsAPI, venuesAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Plus,
  PlayCircle,
  CheckCircle,
  XCircle,
  Filter,
  MapPin,
  Trophy,
  Award,
  AlertCircle,
  CheckCircle2,
  Activity,
  Flame,
  X
} from 'lucide-react';

const Matches = () => {
  const { user } = useAuth();
  const isOrganizer = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal: Schedule Match
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    tournamentId: '',
    homeTeamId: '',
    awayTeamId: '',
    venueId: '',
    scheduledAt: '',
    round: 1,
    matchNumber: 1,
  });

  // Modal: Enter Score / Complete Match
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoringMatch, setScoringMatch] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    homeScore: 0,
    awayScore: 0,
    period: 'Full Time',
    details: '',
  });

  const loadMatchesAndMeta = async () => {
    try {
      setLoading(true);
      const params = {};
      if (tournamentFilter) params.tournamentId = tournamentFilter;
      if (statusFilter) params.status = statusFilter;

      const [matchesRes, tourneysRes, venuesRes] = await Promise.all([
        matchesAPI.getAll(params),
        tournamentsAPI.getAll(),
        venuesAPI.getAll(),
      ]);

      if (matchesRes.data.success) {
        setMatches(matchesRes.data.data);
      }
      if (tourneysRes.data.success) {
        setTournaments(tourneysRes.data.data);
      }
      if (venuesRes.data.success) {
        setVenues(venuesRes.data.data);
      }
    } catch (err) {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchesAndMeta();
  }, [tournamentFilter, statusFilter]);

  // When tournament is chosen in schedule modal, load its registered teams
  const handleTournamentSelect = async (tourneyId) => {
    setScheduleData({ ...scheduleData, tournamentId: tourneyId, homeTeamId: '', awayTeamId: '' });
    if (!tourneyId) return;
    try {
      const res = await tournamentsAPI.getTeams(tourneyId);
      if (res.data.success) {
        setTournamentTeams(res.data.data.map((tt) => tt.team));
      }
    } catch (err) {
      setError('Failed to load registered teams for tournament');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await matchesAPI.create(scheduleData);
      setSuccess('Match scheduled successfully!');
      setShowScheduleModal(false);
      loadMatchesAndMeta();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule match');
    }
  };

  const handleOpenScoreModal = (match) => {
    const homeTeam = match.matchTeams.find((mt) => mt.side === 'HOME')?.team;
    const awayTeam = match.matchTeams.find((mt) => mt.side === 'AWAY')?.team;
    const hScore = match.scores?.find((s) => s.teamId === homeTeam?.id)?.scoreValue ?? 0;
    const aScore = match.scores?.find((s) => s.teamId === awayTeam?.id)?.scoreValue ?? 0;

    setScoringMatch(match);
    setScoreForm({
      homeScore: hScore,
      awayScore: aScore,
      period: 'Full Time',
      details: match.scores?.[0]?.details || '',
    });
    setShowScoreModal(true);
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await matchesAPI.submitScore(scoringMatch.id, scoreForm);
      setSuccess('Match completed and scores recorded! Standings updated automatically.');
      setShowScoreModal(false);
      loadMatchesAndMeta();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record scores');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return <span className="badge badge-emerald"><PlayCircle size={12} /> LIVE</span>;
      case 'COMPLETED':
        return <span className="badge badge-indigo"><CheckCircle size={12} /> COMPLETED</span>;
      case 'SCHEDULED':
        return <span className="badge badge-amber"><Clock size={12} /> SCHEDULED</span>;
      default:
        return <span className="badge badge-rose">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar color="var(--accent-primary)" size={28} /> Fixtures & Match Operations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Schedule fixtures, assign venues, enter live scores, and finalize results with automatic standings calculation
          </p>
        </div>

        {isOrganizer && (
          <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
            <Plus size={18} /> Schedule Match
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="glass-card" style={{ padding: '0.75rem 1rem', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="glass-card" style={{ padding: '0.75rem 1rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          <Filter size={16} /> Filter By:
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '220px' }}
          value={tournamentFilter}
          onChange={(e) => setTournamentFilter(e.target.value)}
        >
          <option value="">All Tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.sport.name})
            </option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Matches List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading fixtures...
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <h3>No matches found</h3>
          <p style={{ fontSize: '0.9rem' }}>Schedule a match or generate fixtures from the Tournaments tab.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {matches.map((m) => {
            const homeTeam = m.matchTeams.find((mt) => mt.side === 'HOME')?.team;
            const awayTeam = m.matchTeams.find((mt) => mt.side === 'AWAY')?.team;
            const homeScore = m.scores?.find((s) => s.teamId === homeTeam?.id)?.scoreValue;
            const awayScore = m.scores?.find((s) => s.teamId === awayTeam?.id)?.scoreValue;

            return (
              <div
                key={m.id}
                className="glass-card"
                style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
              >
                {/* Tournament & Venue info */}
                <div style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                      {m.tournament.sport.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      Round {m.round} • #{m.matchNumber}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    {m.tournament.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <MapPin size={13} color="var(--accent-emerald)" />
                    {m.venue?.name || 'TBD Arena'}
                  </div>
                </div>

                {/* Score / Teams Contest Board */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'right', flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: m.result?.winnerTeamId === homeTeam?.id ? 'var(--accent-emerald)' : '#fff' }}>
                      {homeTeam?.name || 'TBD'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>HOME</span>
                  </div>

                  {/* Score Pill */}
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1.25rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)', minWidth: '90px' }}>
                    {m.status === 'COMPLETED' ? (
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', letterSpacing: '0.1em' }}>
                        {homeScore} : {awayScore}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                        VS
                      </span>
                    )}
                    {m.scores?.[0]?.period && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {m.scores[0].period}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: m.result?.winnerTeamId === awayTeam?.id ? 'var(--accent-emerald)' : '#fff' }}>
                      {awayTeam?.name || 'TBD'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>AWAY</span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '160px', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(m.status)}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      {new Date(m.scheduledAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link
                      to={`/matches/${m.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                    >
                      <Activity size={14} color="var(--accent-lime)" /> Match Centre
                    </Link>

                    {isOrganizer && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenScoreModal(m)}
                        title="Quick Score Entry"
                      >
                        <Award size={14} /> Score
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Match Modal */}
      {showScheduleModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="var(--accent-primary)" /> Schedule New Fixture
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowScheduleModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tournament *</label>
                <select
                  required
                  className="form-control"
                  value={scheduleData.tournamentId}
                  onChange={(e) => handleTournamentSelect(e.target.value)}
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.sport.name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Home Team *</label>
                  <select
                    required
                    className="form-control"
                    value={scheduleData.homeTeamId}
                    onChange={(e) => setScheduleData({ ...scheduleData, homeTeamId: e.target.value })}
                  >
                    <option value="">Select Home Team</option>
                    {tournamentTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Away Team *</label>
                  <select
                    required
                    className="form-control"
                    value={scheduleData.awayTeamId}
                    onChange={(e) => setScheduleData({ ...scheduleData, awayTeamId: e.target.value })}
                  >
                    <option value="">Select Away Team</option>
                    {tournamentTeams
                      .filter((t) => t.id !== scheduleData.homeTeamId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Venue / Stadium</label>
                  <select
                    className="form-control"
                    value={scheduleData.venueId}
                    onChange={(e) => setScheduleData({ ...scheduleData, venueId: e.target.value })}
                  >
                    <option value="">Select Venue (Optional)</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-control"
                    value={scheduleData.scheduledAt}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Round</label>
                  <input
                    type="number"
                    className="form-control"
                    value={scheduleData.round}
                    onChange={(e) => setScheduleData({ ...scheduleData, round: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Match Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={scheduleData.matchNumber}
                    onChange={(e) => setScheduleData({ ...scheduleData, matchNumber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Enter Score / Complete Match Modal */}
      {showScoreModal && scoringMatch && createPortal(
        <div className="modal-backdrop" onClick={() => setShowScoreModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                  Record Match Score & Result
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                  {scoringMatch.tournament.name} ({scoringMatch.tournament.sport.name})
                </span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowScoreModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Head to Head Score Entry */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                {/* Home */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
                    {scoringMatch.matchTeams.find((mt) => mt.side === 'HOME')?.team?.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="form-control"
                    style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', color: 'var(--accent-amber)' }}
                    value={scoreForm.homeScore}
                    onChange={(e) => setScoreForm({ ...scoreForm, homeScore: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.3rem', display: 'block' }}>HOME</span>
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dim)' }}>
                  :
                </div>

                {/* Away */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
                    {scoringMatch.matchTeams.find((mt) => mt.side === 'AWAY')?.team?.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="form-control"
                    style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', color: 'var(--accent-amber)' }}
                    value={scoreForm.awayScore}
                    onChange={(e) => setScoreForm({ ...scoreForm, awayScore: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.3rem', display: 'block' }}>AWAY</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Period / Stage</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Full Time, Extra Time, 20 Overs"
                  value={scoreForm.period}
                  onChange={(e) => setScoreForm({ ...scoreForm, period: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Match Details / Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Scorers, penalty shootouts, overs info..."
                  value={scoreForm.details}
                  onChange={(e) => setScoreForm({ ...scoreForm, details: e.target.value })}
                />
              </div>

              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ℹ️ Submitting this form runs a <strong>database transaction</strong> that calculates the result, marks the match as completed, and recalculates tournament standings in real-time.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScoreModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald">
                  Finalize & Update Standings
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Matches;
