import React, { useState, useEffect } from 'react';
import { playersAPI, sportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Users, Plus, Search, Filter, Edit3, Trash2, ShieldAlert, CheckCircle, Flag } from 'lucide-react';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sportId: '',
    nationality: '',
    gender: 'Male',
    dateOfBirth: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isOrganizer, isAdmin } = useAuth();

  const fetchInitialData = async () => {
    try {
      const [playersRes, sportsRes] = await Promise.all([
        playersAPI.getAll({ search, sportId: selectedSportId }),
        sportsAPI.getAll(),
      ]);
      if (playersRes.data.success) setPlayers(playersRes.data.data);
      if (sportsRes.data.success) setSports(sportsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [search, selectedSportId]);

  const handleOpenCreate = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      sportId: sports.length > 0 ? sports[0].id : '',
      gender: 'Male',
      dateOfBirth: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      sportId: player.sportId,
      gender: player.gender || 'Male',
      dateOfBirth: player.dateOfBirth ? player.dateOfBirth.substring(0, 10) : '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingPlayer) {
        await playersAPI.update(editingPlayer.id, formData);
        setSuccess(`Player '${formData.name}' updated successfully.`);
      } else {
        await playersAPI.create(formData);
        setSuccess(`Player '${formData.name}' created successfully.`);
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (player) => {
    if (window.confirm(`Are you sure you want to delete ${player.name}?`)) {
      try {
        await playersAPI.delete(player.id);
        setSuccess(`Player '${player.name}' deleted.`);
        fetchInitialData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete player.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users color="var(--accent-cyan)" size={28} />
            Player Registry
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            View, search, and manage athlete profiles across all sports.
          </p>
        </div>

        {isOrganizer && (
          <button onClick={handleOpenCreate} className="btn btn-emerald">
            <Plus size={18} /> Register New Player
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
            placeholder="Search by player name or nationality..."
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

      {/* Players Table */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Sport</th>
                <th>Gender</th>
                <th>Team Roster</th>
                {isOrganizer && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No players found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                players.map((p) => {
                  const currentTeamPlayer = p.teamPlayers && p.teamPlayers.length > 0 ? p.teamPlayers[0] : null;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div>{p.name}</div>
                            
                            
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.sport?.name}
                      </td>
                      <td>
                        {p.gender || 'N/A'}
                      </td>
                      <td>
                        {currentTeamPlayer ? (
                          <span className="badge badge-emerald">
                            {currentTeamPlayer.team?.name} {currentTeamPlayer.jerseyNumber ? `#${currentTeamPlayer.jerseyNumber}` : ''}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      {isOrganizer && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button onClick={() => handleOpenEdit(p)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem' }}>
                              <Edit3 size={14} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => handleDelete(p)} className="btn btn-danger btn-sm" style={{ padding: '0.3rem 0.6rem' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Player Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlayer ? 'Edit Player' : 'Register Player'}>
        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ravi Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sport Specialty</label>
            <select
              className="form-select"
              value={formData.sportId}
              onChange={(e) => setFormData({ ...formData, sportId: e.target.value })}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-input"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, paddingTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-emerald">
              {editingPlayer ? 'Save Changes' : 'Register Player'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Players;
