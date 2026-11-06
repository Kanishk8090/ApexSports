import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorStyles = {
    blue:    { bg: 'rgba(21, 88, 201, 0.14)', border: 'rgba(21, 88, 201, 0.35)', text: '#5b9aff', glow: 'rgba(21, 88, 201, 0.25)' },
    indigo:  { bg: 'rgba(21, 88, 201, 0.14)', border: 'rgba(21, 88, 201, 0.35)', text: '#5b9aff', glow: 'rgba(21, 88, 201, 0.25)' },
    lime:    { bg: 'rgba(212, 255, 36, 0.1)',  border: 'rgba(212, 255, 36, 0.3)',  text: '#D4FF24', glow: 'rgba(212, 255, 36, 0.2)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399', glow: 'rgba(16, 185, 129, 0.2)' },
    amber:   { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.2)' },
    cyan:    { bg: 'rgba(6, 182, 212, 0.12)',   border: 'rgba(6, 182, 212, 0.3)',   text: '#22d3ee', glow: 'rgba(6, 182, 212, 0.2)'  },
    rose:    { bg: 'rgba(244, 63, 94, 0.12)',   border: 'rgba(244, 63, 94, 0.3)',   text: '#fda4af', glow: 'rgba(244, 63, 94, 0.2)'  },
  };

  const theme = colorStyles[color] || colorStyles.blue;

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.boxShadow = `0 8px 24px ${theme.glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', margin: '0.2rem 0', lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{subtitle}</div>}
      </div>

      <div
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          padding: '0.9rem',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 14px ${theme.glow}`,
        }}
      >
        <Icon size={28} color={theme.text} />
      </div>
    </div>
  );
};

export default StatCard;
