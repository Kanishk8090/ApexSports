import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, LogIn, ShieldAlert, Zap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(128, 128, 128, 0.4)",
        padding: "1rem",
      }}
    >
      {/* Decorative grid lines */}

      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2.5rem",
          position: "relative",
          zIndex: 1,
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Accent top bar */}

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>
            Sign In
          </h2>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              color: "#fda4af",
              padding: "0.75rem",
              borderRadius: "8px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "0.5rem",
              padding: "0.9rem",
              fontSize: "1rem",
            }}
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.25rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div>
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#D4FF24",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Create one here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
