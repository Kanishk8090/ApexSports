import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { tournamentsAPI, sportsAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Trophy,
  Plus,
  Calendar,
  Filter,
  CheckCircle,
  PlayCircle,
  Clock,
  Shuffle,
  Users,
  Eye,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';

const Tournaments = () => {
  const { user } = useAuth();
  const isOrganizer = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [sportFilter, setSportFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, teams, matches, standings

  // Create Form State
  const [formData, setFormData] = useState({
    name: '',
    sportId: '',
    description: '',
    startDate: '',
    endDate: '',
    format: 'LEAGUE',
    status: 'UPCOMING',
  });

  // Team Registration State
  const [showRegisterTeamModal, setShowRegisterTeamModal] = useState(false);
  const [availableSportTeams, setAvailableSportTeams] = useState([]);
  const [registerTeamId, setRegisterTeamId] = useState('');
  const [registerSeed, setRegisterSeed] = useState('');

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (sportFilter) params.sportId = sportFilter;
      if (statusFilter) params.status = statusFilter;

      const [tourneyRes, sportsRes] = await Promise.all([
        tournamentsAPI.getAll(params),
        sportsAPI.getAll(),
      ]);

      if (tourneyRes.data.success) {
        setTournaments(tourneyRes.data.data);
      }
      if (sportsRes.data.success) {
        setSports(sportsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load tournaments. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, [sportFilter, statusFilter]);

  const handleOpenDetails = async (tourney) => {
    try {
      const res = await tournamentsAPI.getById(tourney.id);
      if (res.data.success) {
        setSelectedTournament(res.data.data);
        setActiveTab('overview');
      }
    } catch (err) {
      setError('Failed to fetch tournament details');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await tournamentsAPI.create(formData);
      if (res.data.success) {
        setSuccess('Tournament created successfully!');
        setShowCreateModal(false);
        setFormData({
          name: '',
          sportId: '',
          description: '',
          startDate: '',
          endDate: '',
          format: 'LEAGUE',
          status: 'UPCOMING',
        });
        loadTournaments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tournament');
    }
  };

  const handleGenerateFixtures = async (tournamentId) => {
    if (!window.confirm('Generate automated match fixtures for this tournament?')) return;
    try {
      setError('');
      const res = await tournamentsAPI.generateFixtures(tournamentId);
      if (res.data.success) {
        setSuccess(res.data.message);
        const refreshed = await tournamentsAPI.getById(tournamentId);
        setSelectedTournament(refreshed.data.data);
        loadTournaments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate fixtures');
    }
  };

  const handleOpenRegisterTeam = async () => {
    if (!selectedTournament) return;
    try {
      const res = await teamsAPI.getAll({ sportId: selectedTournament.sportId });
      if (res.data.success) {
        const alreadyRegistered = selectedTournament.tournamentTeams.map((tt) => tt.teamId);
        const filtered = res.data.data.filter((t) => !alreadyRegistered.includes(t.id));
        setAvailableSportTeams(filtered);
        setRegisterTeamId(filtered[0]?.id || '');
        setRegisterSeed(selectedTournament.tournamentTeams.length + 1);
        setShowRegisterTeamModal(true);
      }
    } catch (err) {
      setError('Failed to load teams for registration');
    }
  };

  const handleRegisterTeamSubmit = async (e) => {
    e.preventDefault();
    if (!registerTeamId) return;
    try {
      await tournamentsAPI.registerTeam(selectedTournament.id, {
        teamId: registerTeamId,
        seed: registerSeed,
      });
      setSuccess('Team registered successfully!');
      setShowRegisterTeamModal(false);
      const refreshed = await tournamentsAPI.getById(selectedTournament.id);
      setSelectedTournament(refreshed.data.data);
      loadTournaments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register team');
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (!window.confirm('Remove this team from the tournament?')) return;
    try {
      await tournamentsAPI.removeTeam(selectedTournament.id, teamId);
      setSuccess('Team removed from tournament');
      const refreshed = await tournamentsAPI.getById(selectedTournament.id);
      setSelectedTournament(refreshed.data.data);
      loadTournaments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove team');
    }
  };

  const handleDeleteTournament = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) return;
    try {
      await tournamentsAPI.delete(id);
      setSuccess('Tournament deleted successfully');
      setSelectedTournament(null);
      loadTournaments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tournament');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ONGOING':
        return <span className="badge badge-emerald"><PlayCircle size={12} /> ONGOING</span>;
      case 'COMPLETED':
        return <span className="badge badge-indigo"><CheckCircle size={12} /> COMPLETED</span>;
      case 'UPCOMING':
        return <span className="badge badge-amber"><Clock size={12} /> UPCOMING</span>;
      default:
        return <span className="badge badge-rose">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Trophy color="var(--accent-primary)" size={28} /> Tournament Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-sport tournament orchestration with round-robin fixtures and knockout brackets
          </p>
        </div>

        {isOrganizer && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Create Tournament
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
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
        >
          <option value="">All Sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
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
          <option value="UPCOMING">Upcoming</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading tournaments...
        </div>
      ) : tournaments.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Trophy size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <h3>No tournaments found</h3>
          <p style={{ fontSize: '0.9rem' }}>Create a tournament or adjust your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {tournaments.map((t) => (
            <div key={t.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-indigo" style={{ marginBottom: '0.4rem' }}>
                    {t.sport.name}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{t.name}</h3>
                </div>
                {getStatusBadge(t.status)}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minHeight: '2.5rem' }}>
                {t.description || 'No description provided'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Format:</span>{' '}
                  <strong style={{ color: '#fff' }}>{t.format}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Teams:</span>{' '}
                  <strong style={{ color: '#fff' }}>{t.tournamentTeams?.length || 0}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Matches:</span>{' '}
                  <strong style={{ color: '#fff' }}>{t.matches?.length || 0}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Start:</span>{' '}
                  <span style={{ color: '#fff' }}>{new Date(t.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleOpenDetails(t)}
                >
                  <Eye size={16} /> View & Manage
                </button>
                {isOrganizer && t.matches?.length === 0 && (
                  <button
                    className="btn btn-emerald"
                    style={{ padding: '0.6rem' }}
                    title="Generate Fixtures"
                    onClick={() => handleGenerateFixtures(t.id)}
                  >
                    <Shuffle size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tournament Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Tournament"
        maxWidth="560px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Tournament Name *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Champions League 2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Sport *</label>
              <select
                required
                className="form-control"
                value={formData.sportId}
                onChange={(e) => setFormData({ ...formData, sportId: e.target.value })}
              >
                <option value="">Select Sport</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Format</label>
              <select
                className="form-control"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              >
                <option value="LEAGUE">League (Round-Robin)</option>
                <option value="KNOCKOUT">Knockout Bracket</option>
                <option value="GROUP_KNOCKOUT">Group + Knockout</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Rules, venue details, or notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Tournament
            </button>
          </div>
        </form>
      </Modal>

      {/* Detailed Tournament View Modal / Workspace */}
      {selectedTournament && createPortal(
        <div className="modal-backdrop" onClick={() => setSelectedTournament(null)}>
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-indigo">{selectedTournament.sport.name}</span>
                  {getStatusBadge(selectedTournament.status)}
                  <span className="badge badge-amber">{selectedTournament.format}</span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                  {selectedTournament.name}
                </h2>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSelectedTournament(null)}
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('teams')}
              >
                Teams ({selectedTournament.tournamentTeams.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'matches' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('matches')}
              >
                Fixtures ({selectedTournament.matches.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'standings' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('standings')}
              >
                Standings Table
              </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {selectedTournament.description || 'No description provided.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Start Date</span>
                    <h4 style={{ color: '#fff', marginTop: '0.2rem' }}>
                      {new Date(selectedTournament.startDate).toLocaleDateString()}
                    </h4>
                  </div>
                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>End Date</span>
                    <h4 style={{ color: '#fff', marginTop: '0.2rem' }}>
                      {new Date(selectedTournament.endDate).toLocaleDateString()}
                    </h4>
                  </div>
                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Organizer</span>
                    <h4 style={{ color: '#fff', marginTop: '0.2rem' }}>
                      {selectedTournament.creator?.name || 'System Admin'}
                    </h4>
                  </div>
                </div>

                {isOrganizer && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      className="btn btn-emerald"
                      onClick={() => handleGenerateFixtures(selectedTournament.id)}
                    >
                      <Shuffle size={16} /> Auto-Generate Match Fixtures
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteTournament(selectedTournament.id)}
                      >
                        <Trash2 size={16} /> Delete Tournament
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Teams */}
            {activeTab === 'teams' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#fff', fontWeight: 700 }}>
                    Registered Teams ({selectedTournament.tournamentTeams.length})
                  </h4>
                  {isOrganizer && (
                    <button className="btn btn-primary btn-sm" onClick={handleOpenRegisterTeam}>
                      <Plus size={16} /> Register Team
                    </button>
                  )}
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Seed</th>
                        <th>Team Name</th>
                        <th>Roster Size</th>
                        <th>Registered Date</th>
                        {isOrganizer && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTournament.tournamentTeams.map((tt) => (
                        <tr key={tt.id}>
                          <td><strong>#{tt.seed || '-'}</strong></td>
                          <td style={{ color: '#fff', fontWeight: 600 }}>{tt.team.name}</td>
                          <td>{tt.team.teamPlayers?.length || 0} players</td>
                          <td>{new Date(tt.registeredAt).toLocaleDateString()}</td>
                          {isOrganizer && (
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveTeam(tt.teamId)}
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {selectedTournament.tournamentTeams.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No teams registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Matches */}
            {activeTab === 'matches' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#fff', fontWeight: 700 }}>
                    Tournament Fixtures ({selectedTournament.matches.length})
                  </h4>
                  {isOrganizer && (
                    <button
                      className="btn btn-emerald btn-sm"
                      onClick={() => handleGenerateFixtures(selectedTournament.id)}
                    >
                      <Shuffle size={14} /> Regenerate Fixtures
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedTournament.matches.map((m) => {
                    const homeTeam = m.matchTeams?.find((mt) => mt.side === 'HOME')?.team;
                    const awayTeam = m.matchTeams?.find((mt) => mt.side === 'AWAY')?.team;
                    const homeScore = m.scores?.find((s) => s.teamId === homeTeam?.id)?.scoreValue ?? '-';
                    const awayScore = m.scores?.find((s) => s.teamId === awayTeam?.id)?.scoreValue ?? '-';

                    return (
                      <div
                        key={m.id}
                        className="glass-card"
                        style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}
                      >
                        <div style={{ minWidth: '100px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Round {m.round} • #{m.matchNumber}
                          </span>
                          <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                            {m.venue?.name || 'TBD Venue'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#fff', textAlign: 'right', flex: 1 }}>
                            {homeTeam?.name || 'TBD'}
                          </span>
                          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.35rem 0.85rem', borderRadius: '6px', fontWeight: 800, color: 'var(--accent-amber)', fontSize: '1.1rem' }}>
                            {homeScore} : {awayScore}
                          </div>
                          <span style={{ fontWeight: 700, color: '#fff', textAlign: 'left', flex: 1 }}>
                            {awayTeam?.name || 'TBD'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {getStatusBadge(m.status)}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {new Date(m.scheduledAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {selectedTournament.matches.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No fixtures generated yet. Register teams and click 'Auto-Generate Match Fixtures'.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Standings */}
            {activeTab === 'standings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ color: '#fff', fontWeight: 700 }}>
                  Tournament Standings & Ranking Table
                </h4>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>GD</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTournament.standings?.map((s) => (
                        <tr key={s.id}>
                          <td><strong>#{s.rank}</strong></td>
                          <td style={{ color: '#fff', fontWeight: 600 }}>{s.team?.name}</td>
                          <td>{s.played}</td>
                          <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{s.wins}</td>
                          <td>{s.draws}</td>
                          <td style={{ color: 'var(--accent-rose)' }}>{s.losses}</td>
                          <td>{s.goalsFor}</td>
                          <td>{s.goalsAgainst}</td>
                          <td>{s.scoreDifference > 0 ? `+${s.scoreDifference}` : s.scoreDifference}</td>
                          <td>
                            <span className="badge badge-indigo" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                              {s.points}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!selectedTournament.standings || selectedTournament.standings.length === 0) && (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No standings calculated yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Register Team Modal */}
      <Modal
        isOpen={showRegisterTeamModal}
        onClose={() => setShowRegisterTeamModal(false)}
        title="Register Team into Tournament"
        maxWidth="460px"
      >
        <form onSubmit={handleRegisterTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Select Team ({selectedTournament?.sport?.name} only)</label>
            <select
              required
              className="form-control"
              value={registerTeamId}
              onChange={(e) => setRegisterTeamId(e.target.value)}
            >
              {availableSportTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              {availableSportTeams.length === 0 && (
                <option value="">No other teams available for this sport</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Seed Number</label>
            <input
              type="number"
              className="form-control"
              value={registerSeed}
              onChange={(e) => setRegisterSeed(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterTeamModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!registerTeamId}>
              Confirm Registration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tournaments;
