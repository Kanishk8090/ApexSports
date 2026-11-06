import React from 'react';
import { Calendar, Trophy, BarChart3, Clock } from 'lucide-react';

const PlaceholderPage = ({ title, week, description }) => {
  return (
    <div style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="glass-card" style={{ padding: '3rem', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <Clock size={40} color="var(--accent-amber)" />
        </div>

        <span className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>
          Scheduled for {week}
        </span>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          {title}
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {description}
        </p>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', width: '100%', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Week 1 core foundation (Database, Auth, Sports, Players, Teams, Rosters) is 100% active and running.
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
