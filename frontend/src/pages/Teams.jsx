import React, { useState, useEffect } from 'react';
import { teamsAPI, sportsAPI, playersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { UserCheck, Plus, Search, Filter, Edit3, Trash2, ShieldAlert, CheckCircle, UserPlus, UserMinus, Shirt } from 'lucide-react';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [sports, setSports] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');

  // Team Create / Edit Modal state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', sportId: '', description: '' });

  // Roster View / Manage Modal state
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [addPlayerForm, setAddPlayerForm] = useState({ playerId: '', jerseyNumber: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isOrganizer, isAdmin } = useAuth();

  const fetchTeams = async () => {
    try {
      const [teamsRes, sportsRes] = await Promise.all([
        teamsAPI.getAll({ search, sportId: selectedSportId }),
        sportsAPI.getAll(),
      ]);
      if (teamsRes.data.success) setTeams(teamsRes.data.data);
      if (sportsRes.data.success) setSports(sportsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [search, selectedSportId]);

  const handleOpenCreateTeam = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', sportId: sports.length > 0 ? sports[0].id : '', description: '' });
    setError('');
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (team) => {
    setEditingTeam(team);
    setTeamForm({ name: team.name, sportId: team.sportId, description: team.description || '' });
    setError('');
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTeam) {
        await teamsAPI.update(editingTeam.id, teamForm);
        setSuccess(`Team '${teamForm.name}' updated.`);
      } else {
        await teamsAPI.create(teamForm);
        setSuccess(`Team '${teamForm.name}' created.`);
      }
      setIsTeamModalOpen(false);
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save team.');
    }
  };

  const handleDeleteTeam = async (team) => {
    if (window.confirm(`Are you sure you want to delete team ${team.name}?`)) {
      try {
        await teamsAPI.delete(team.id);
        setSuccess(`Team '${team.name}' deleted.`);
        fetchTeams();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete team.');
      }
    }
  };

  // Open Roster Details Modal for a given team
  const handleOpenRoster = async (team) => {
    try {
      const res = await teamsAPI.getById(team.id);
      if (res.data.success) {
        setSelectedTeam(res.data.data);
        // Load candidates for adding to this team (players of the SAME sport)
        const playersRes = await playersAPI.getAll({ sportId: res.data.data.sportId });
        if (playersRes.data.success) {
          setAvailablePlayers(playersRes.data.data);
        }
        setAddPlayerForm({ playerId: '', jerseyNumber: '' });
        setError('');
        setIsRosterModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load team details.');
    }
  };

  const handleAddPlayerToRoster = async (e) => {
    e.preventDefault();
    setError('');
    if (!addPlayerForm.playerId) {
      setError('Please select a player to add.');
      return;
    }

    try {
      await teamsAPI.addPlayer(selectedTeam.id, {
        playerId: addPlayerForm.playerId,
        jerseyNumber: addPlayerForm.jerseyNumber ? parseInt(addPlayerForm.jerseyNumber, 10) : null,
      });
      setSuccess('Player added to roster!');

      // Refresh team details & main team list
      const res = await teamsAPI.getById(selectedTeam.id);
      if (res.data.success) setSelectedTeam(res.data.data);
      fetchTeams();
      setAddPlayerForm({ playerId: '', jerseyNumber: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add player to roster.');
    }
  };

  const handleRemovePlayerFromRoster = async (playerId, playerName) => {
    if (window.confirm(`Remove ${playerName} from team roster?`)) {
      try {
        await teamsAPI.removePlayer(selectedTeam.id, playerId);
        setSuccess(`Removed ${playerName} from roster.`);
        const res = await teamsAPI.getById(selectedTeam.id);
        if (res.data.success) setSelectedTeam(res.data.data);
        fetchTeams();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove player.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck color="var(--accent-emerald)" size={28} />
            Teams & Roster Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage sports teams, roster memberships, and jersey assignments.
          </p>
        </div>

        {isOrganizer && (
          <button onClick={handleOpenCreateTeam} className="btn btn-primary">
            <Plus size={18} /> Create New Team
          </button>
        )}
      </div>

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select className="form-select" value={selectedSportId} onChange={(e) => setSelectedSportId(e.target.value)}>
            <option value="">All Sports</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {teams.map((team) => (
          <div key={team.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="badge badge-emerald">{team.sport?.name}</span>
                {isOrganizer && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => handleOpenEditTeam(team)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.5rem' }}>
                      <Edit3 size={14} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDeleteTeam(team)} className="btn btn-danger btn-sm" style={{ padding: '0.3rem 0.5rem' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>{team.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {team.description || 'No team description.'}
              </p>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Roster: <strong style={{ color: '#fff' }}>{team._count?.teamPlayers || 0} players</strong>
              </div>
              <button onClick={() => handleOpenRoster(team)} className="btn btn-secondary btn-sm" style={{ background: 'var(--bg-hover)' }}>
                View Roster & Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Team Create / Edit Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title={editingTeam ? 'Edit Team' : 'Create Team'}>
        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} />
            {error}
          </div>
        )}
        <form onSubmit={handleSaveTeam}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Thunder FC, Metro Hoops"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sport Category</label>
            <select
              className="form-select"
              value={teamForm.sportId}
              onChange={(e) => setTeamForm({ ...teamForm, sportId: e.target.value })}
              required
            >
              <option value="" disabled>Select Sport</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Team background or club details..."
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, paddingTop: '1rem' }}>
            <button type="button" onClick={() => setIsTeamModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTeam ? 'Save Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Team Roster Details & Player Assignment Modal */}
      <Modal isOpen={isRosterModalOpen} onClose={() => setIsRosterModalOpen(false)} title={selectedTeam ? `${selectedTeam.name} — Team Roster` : 'Team Roster'} maxWidth="720px">
        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        {selectedTeam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Sport: <span className="badge badge-emerald">{selectedTeam.sport?.name}</span>
              • Total Roster Size: <strong style={{ color: '#fff' }}>{selectedTeam.teamPlayers?.length || 0}</strong>
            </div>

            {/* Add Player Form (For Organizers) */}
            {isOrganizer && (
              <form onSubmit={handleAddPlayerToRoster} style={{ background: 'rgba(19,25,36,0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.75rem', uppercase: true }}>
                  ➕ Add Player of Same Sport ({selectedTeam.sport?.name})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Athlete</label>
                    <select
                      className="form-select"
                      style={{ padding: '0.5rem' }}
                      value={addPlayerForm.playerId}
                      onChange={(e) => setAddPlayerForm({ ...addPlayerForm, playerId: e.target.value })}
                    >
                      <option value="">-- Choose Athlete --</option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.nationality || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Jersey #</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                      placeholder="e.g. 10"
                      value={addPlayerForm.jerseyNumber}
                      onChange={(e) => setAddPlayerForm({ ...addPlayerForm, jerseyNumber: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-emerald btn-sm" style={{ height: '38px' }}>
                    <UserPlus size={16} /> Add
                  </button>
                </div>
              </form>
            )}

            {/* Current Roster Table */}
            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Jersey</th>
                    <th>Player Name</th>
                    <th>Nationality</th>
                    {isOrganizer && <th style={{ textAlign: 'right' }}>Remove</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedTeam.teamPlayers?.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                        No players currently assigned to this team.
                      </td>
                    </tr>
                  ) : (
                    selectedTeam.teamPlayers?.map((tp) => (
                      <tr key={tp.id}>
                        <td>
                          {tp.jerseyNumber ? (
                            <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Shirt size={12} /> #{tp.jerseyNumber}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{tp.player?.name}</td>
                        <td>{tp.player?.nationality || 'Unspecified'}</td>
                        {isOrganizer && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleRemovePlayerFromRoster(tp.playerId, tp.player?.name)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <UserMinus size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Teams;
