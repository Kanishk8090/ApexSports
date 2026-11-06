import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ sidebarOpen, onToggleSidebar }) => {
  const { user, logout } = useAuth();

  

  const getAvatarGradient = (role) =>
    role === 'ADMIN'
      ? 'linear-gradient(135deg, #f43f5e, #be123c)'
      : 'linear-gradient(135deg, #1558C9, #0e3d8f)';

  return (
    <header className="topbar">
      {/* Left: toggle + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {/* Sidebar expand button when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--accent-lime)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ☰
          </button>
        )}

        <h3
          style={{
            fontSize: "2rem",
            color: "var(--text-muted)",
            fontFamily: "Josefin Sans",
            fontWeight: 1000,
            whiteSpace: "nowrap",
          }}
        >
          ApexSports
        </h3>
      </div>

      {/* Right: user info or guest actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {user ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                background: "rgba(21,88,201,0.08)",
                padding: "0.35rem 0.85rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  background: getAvatarGradient(user.role),
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: user.role === "ORGANIZER" ? "#D4FF24" : "#fff",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  boxShadow: "0 2px 8px rgba(21,88,201,0.4)",
                  flexShrink: 0,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#fff",
                    lineHeight: 1.2,
                  }}
                >
                  {user.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {user.email}
                </div>
              </div>
              
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Sign out"
            >
              Logout
            </button>
          </>
        ) : (
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}
          >
            
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-lime     btn-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
