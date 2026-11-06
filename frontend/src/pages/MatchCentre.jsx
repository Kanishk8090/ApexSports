import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cricketAPI, footballAPI, matchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CricketScoreHeader from '../components/cricket/CricketScoreHeader';
import CricketScorecard from '../components/cricket/CricketScorecard';
import CricketCommentary from '../components/cricket/CricketCommentary';
import CricketScoringConsole from '../components/cricket/CricketScoringConsole';

import FootballScoreHeader from '../components/football/FootballScoreHeader';
import FootballTimeline from '../components/football/FootballTimeline';
import FootballStats from '../components/football/FootballStats';
import FootballLineups from '../components/football/FootballLineups';
import FootballScoringConsole from '../components/football/FootballScoringConsole';

import {
  Trophy,
  ArrowLeft,
  RefreshCw,
  Flame,
  Calendar,
  Clock,
  Radio,
  FileText,
  BarChart3,
  Users,
  ShieldCheck,
} from 'lucide-react';

const MatchCentre = () => {
  const { matchId } = useParams();
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sportCode, setSportCode] = useState('');
  const [matchData, setMatchData] = useState(null);

  // Active Sport Tab
  const [activeTab, setActiveTab] = useState('summary');

  // Organizer console toggle
  const [showConsole, setShowConsole] = useState(false);

  // Live auto-polling
  const [isLivePolling, setIsLivePolling] = useState(true);
  const pollIntervalRef = useRef(null);

  const isOrganizer =
    isAdmin ||
    user?.role === 'ORGANIZER' ||
    user?.role === 'ADMIN';

  // Load match data based on sport
  const loadMatchDetails = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);

      // Determine sport code first if not yet known
      let code = sportCode;
      if (!code) {
        const baseMatchRes = await matchesAPI.getById(matchId);
        if (baseMatchRes.data.success) {
          code = baseMatchRes.data.data.tournament.sport.code;
          setSportCode(code);
        }
      }

      if (code === 'CRK') {
        const res = await cricketAPI.getDetails(matchId);
        if (res.data.success) {
          setMatchData(res.data.data);
        }
      } else if (code === 'FTB') {
        const res = await footballAPI.getDetails(matchId);
        if (res.data.success) {
          setMatchData(res.data.data);
        }
      } else {
        // Generic fallback
        const res = await matchesAPI.getById(matchId);
        if (res.data.success) {
          setMatchData({ match: res.data.data });
        }
      }
    } catch (err) {
      if (!isBackground) {
        setError('Failed to load match details.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchDetails();
  }, [matchId]);

  // Real-time polling when match is LIVE
  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const isMatchLive = matchData?.match?.status === 'LIVE';

    if (isLivePolling && isMatchLive) {
      pollIntervalRef.current = setInterval(() => {
        loadMatchDetails(true);
      }, 3000); // Poll every 3 seconds for live matches
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [matchId, isLivePolling, matchData?.match?.status, sportCode]);

  if (loading && !matchData) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="spin" size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>Connecting to Live Match Centre...</h3>
        <p style={{ fontSize: '0.88rem' }}>Loading live scorecards, timeline, and real-time commentary.</p>
      </div>
    );
  }

  if (error && !matchData) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <h3 style={{ color: '#f87171', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Match Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/matches" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Fixtures & Matches
        </Link>
      </div>
    );
  }

  const match = matchData?.match;
  const isCricket = sportCode === 'CRK';
  const isFootball = sportCode === 'FTB';

  return (
    <div>
      {/* Top Breadcrumb & Live Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <Link to="/matches" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.88rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Matches
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => loadMatchDetails(false)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Refresh Score"
          >
            <RefreshCw size={13} /> Refresh
          </button>

          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`btn btn-sm ${isLivePolling ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
          >
            <Radio size={13} color={isLivePolling ? 'var(--accent-lime)' : undefined} />
            {isLivePolling ? 'Live Sync Active' : 'Live Sync Paused'}
          </button>

          {isOrganizer && (
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`btn btn-sm ${showConsole ? 'btn-secondary' : 'btn-lime'}`}
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Flame size={14} /> {showConsole ? 'Hide Console' : 'Scoring Console'}
            </button>
          )}
        </div>
      </div>

      {/* Organizer Scoring Console Panel (if opened) */}
      {showConsole && isOrganizer && (
        <>
          {isCricket && (
            <CricketScoringConsole
              data={matchData}
              onUpdate={(updated) => setMatchData(updated)}
              onClose={() => setShowConsole(false)}
            />
          )}
          {isFootball && (
            <FootballScoringConsole
              data={matchData}
              onUpdate={(updated) => setMatchData(updated)}
              onClose={() => setShowConsole(false)}
            />
          )}
        </>
      )}

      {/* Main ESPN-Inspired Score Header */}
      {isCricket && (
        <CricketScoreHeader
          data={matchData}
          onOpenConsole={() => setShowConsole(true)}
          isOrganizer={isOrganizer}
        />
      )}

      {isFootball && (
        <FootballScoreHeader
          data={matchData}
          onOpenConsole={() => setShowConsole(true)}
          isOrganizer={isOrganizer}
        />
      )}

      {/* Generic Sport fallback header */}
      {!isCricket && !isFootball && match && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <span className="badge badge-blue">{match.tournament?.name}</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0.75rem 0' }}>
            {match.matchTeams.map((mt) => mt.team.name).join(' vs ')}
          </h2>
          <span className="badge badge-emerald">{match.status}</span>
        </div>
      )}

      {/* Navigation Tabs (ESPN-style sport tabs) */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('summary')}
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'summary' ? '3px solid var(--accent-lime)' : '3px solid transparent',
            color: activeTab === 'summary' ? '#fff' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isCricket ? 'Match Summary' : 'Timeline & Events'}
        </button>

        {isCricket && (
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`tab-btn ${activeTab === 'scorecard' ? 'active' : ''}`}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'scorecard' ? '3px solid var(--accent-lime)' : '3px solid transparent',
              color: activeTab === 'scorecard' ? '#fff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Detailed Scorecard
          </button>
        )}

        <button
          onClick={() => setActiveTab('commentary')}
          className={`tab-btn ${activeTab === 'commentary' ? 'active' : ''}`}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'commentary' ? '3px solid var(--accent-lime)' : '3px solid transparent',
            color: activeTab === 'commentary' ? '#fff' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Ball-by-Ball Commentary
        </button>

        {isFootball && (
          <button
            onClick={() => setActiveTab('stats')}
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'stats' ? '3px solid var(--accent-lime)' : '3px solid transparent',
              color: activeTab === 'stats' ? '#fff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Match Statistics
          </button>
        )}

        <button
          onClick={() => setActiveTab('lineups')}
          className={`tab-btn ${activeTab === 'lineups' ? 'active' : ''}`}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'lineups' ? '3px solid var(--accent-lime)' : '3px solid transparent',
            color: activeTab === 'lineups' ? '#fff' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isCricket ? 'Playing XI / Squads' : 'Team Lineups'}
        </button>
      </div>

      {/* Tab Content Display */}
      {isCricket && (
        <>
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <CricketScorecard data={matchData} />
              <CricketCommentary data={matchData} />
            </div>
          )}

          {activeTab === 'scorecard' && <CricketScorecard data={matchData} />}

          {activeTab === 'commentary' && <CricketCommentary data={matchData} />}

          {activeTab === 'lineups' && (
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
                Squad Members & Playing XI
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {match.matchTeams.map((mt) => (
                  <div key={mt.teamId} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                      {mt.team.name}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {mt.team.teamPlayers?.map((tp) => (
                        <div key={tp.playerId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{tp.player.name}</span>
                          <span style={{ color: 'var(--text-dim)' }}>{tp.player.nationality || 'Player'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isFootball && (
        <>
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <FootballTimeline data={matchData} />
              <FootballStats data={matchData} />
            </div>
          )}

          {activeTab === 'commentary' && <FootballTimeline data={matchData} />}

          {activeTab === 'stats' && <FootballStats data={matchData} />}

          {activeTab === 'lineups' && <FootballLineups data={matchData} />}
        </>
      )}
    </div>
  );
};

export default MatchCentre;

