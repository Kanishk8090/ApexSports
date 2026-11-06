import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { venuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Search, Building2, Users, Calendar, AlertCircle, CheckCircle, Trash2, Edit2, X } from 'lucide-react';

const Venues = () => {
  const { user } = useAuth();
  const isAdminOrOrg = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
  });

  const loadVenues = async () => {
    try {
      setLoading(true);
      const res = await venuesAPI.getAll({ search });
      if (res.data.success) {
        setVenues(res.data.data);
      }
    } catch (err) {
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', location: '', capacity: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (venue) => {
    setEditingId(venue.id);
    setFormData({
      name: venue.name,
      location: venue.location,
      capacity: venue.capacity,
      description: venue.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await venuesAPI.update(editingId, formData);
        setSuccess('Venue updated successfully!');
      } else {
        await venuesAPI.create(formData);
        setSuccess('Venue registered successfully!');
      }
      setShowModal(false);
      loadVenues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save venue');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;
    try {
      await venuesAPI.delete(id);
      setSuccess('Venue deleted successfully');
      loadVenues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete venue');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building2 color="var(--accent-primary)" size={28} /> Stadium & Venue Facilities
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-sport arena infrastructure, capacity management, and schedule conflict resolution
          </p>
        </div>

        {isAdminOrOrg && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Register Venue
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

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="var(--text-dim)" />
        <input
          type="text"
          className="form-control"
          style={{ background: 'transparent', border: 'none', padding: 0 }}
          placeholder="Search venues by arena name or location city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Venues Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading venue facilities...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {venues.map((v) => (
            <div key={v.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{v.name}</h3>
                <span className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Users size={12} /> {v.capacity.toLocaleString()} cap
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <MapPin size={15} color="var(--accent-emerald)" /> {v.location}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', minHeight: '2.5rem' }}>
                {v.description || 'Standard multi-sport competition stadium facility.'}
              </p>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} color="var(--accent-amber)" /> Scheduled Matches:
                </span>
                <strong style={{ color: '#fff' }}>{v.matches?.length || 0}</strong>
              </div>

              {isAdminOrOrg && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleOpenEdit(v)}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(v.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                {editingId ? 'Edit Venue' : 'Register New Arena / Venue'}
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Venue Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Apex Arena Central"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / City *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Manchester, UK"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seating Capacity *</label>
                <input
                  type="number"
                  required
                  className="form-control"
                  placeholder="e.g. 45000"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Facility Details</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Grass type, pitch dimensions, indoor specs..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Register Venue'}
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

export default Venues;
