import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, CheckCircle2, User, UserCheck, ShieldCheck } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersAPI.getAll();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    setError('');
    setSuccess('');
    try {
      const res = await usersAPI.updateRole(userId, newRole);
      if (res.data.success) {
        setSuccess(`User role updated to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Email Address</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>Current Role</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>Tournaments</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Created At</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>Role Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: u.role === 'ADMIN' ? 'var(--accent-rose)' : 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {u.name}
                        
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {u.role}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--accent-amber)' }}>
                    {u._count?.tournaments ?? 0}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem', width: 'auto' }}
                      value={u.role}
                      disabled={isSelf || updatingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="USER">USER</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No users found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
