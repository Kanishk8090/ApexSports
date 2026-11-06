
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PanelLeftClose } from 'lucide-react';

const Sidebar = ({ open = true, onClose }) => {
  const { user, isAdmin } = useAuth();

  const mainNavItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Tournaments', path: '/tournaments' },
    { label: 'Fixtures & Matches', path: '/matches' },
    { label: 'League Standings', path: '/standings' },
    //{ label: 'Sports Catalog', path: '/sports' },
    { label: 'Teams & Rosters', path: '/teams' },
    { label: 'Athletes & Players', path: '/players' },
    //{ label: 'Arenas & Venues', path: '/venues' },
  ];

  return (
    <aside
      className="sidebar"
      style={{
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        visibility: open ? "visible" : "hidden",
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: "1.15rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            title="Close sidebar"
            aria-label="Close sidebar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-hover)",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "var(--border-highlight)";
              e.currentTarget.style.background = "#2a2a2a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
          >
            <PanelLeftClose size={17} />
          </button>
        )}
      </div>

      <nav
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              padding: "0.65rem 0.9rem",
              borderRadius: "10px",
              fontSize: "0.875rem",
              fontWeight: isActive ? 700 : 500,
              textDecoration: "none",
              transition: "all 0.18s ease",
              background: isActive
                ? "linear-gradient(135deg, #1558C9, #0e3d8f)"
                : "transparent",
              color: isActive ? "#ffffff" : "var(--text-muted)",
              border: isActive
                ? "1px solid rgba(21, 88, 201, 0.5)"
                : "1px solid transparent",
              boxShadow: isActive
                ? "0 4px 12px rgba(21, 88, 201, 0.35)"
                : "none",
            })}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#f43f5e",
                padding: "0.75rem 0.75rem 0.25rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginTop: "0.5rem",
              }}
            >
              System Governance
            </div>

            <NavLink
              to="/users"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.65rem 0.9rem",
                borderRadius: "10px",
                fontSize: "0.875rem",
                fontWeight: isActive ? 700 : 500,
                textDecoration: "none",
                transition: "all 0.18s ease",
                background: isActive
                  ? "linear-gradient(135deg, #f43f5e, #be123c)"
                  : "rgba(244, 63, 94, 0.08)",
                color: isActive ? "#fff" : "#fda4af",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                boxShadow: isActive
                  ? "0 4px 12px rgba(244, 63, 94, 0.35)"
                  : "none",
              })}
            >
              <span style={{ flex: 1 }}>User Governance</span>
            </NavLink>
          </>
        )}
      </nav>

      
        
      
    </aside>
  );
};

export default Sidebar;

