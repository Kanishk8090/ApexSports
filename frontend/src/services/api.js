import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getMe: () => API.get('/auth/me'),
};

export const dashboardAPI = {
  getSummary: () => API.get('/dashboard'),
};

export const sportsAPI = {
  getAll: () => API.get('/sports'),
  getById: (id) => API.get(`/sports/${id}`),
  create: (data) => API.post('/sports', data),
  update: (id, data) => API.put(`/sports/${id}`, data),
  delete: (id) => API.delete(`/sports/${id}`),
};

export const playersAPI = {
  getAll: (params) => API.get('/players', { params }),
  getById: (id) => API.get(`/players/${id}`),
  create: (data) => API.post('/players', data),
  update: (id, data) => API.put(`/players/${id}`, data),
  delete: (id) => API.delete(`/players/${id}`),
};

export const teamsAPI = {
  getAll: (params) => API.get('/teams', { params }),
  getById: (id) => API.get(`/teams/${id}`),
  create: (data) => API.post('/teams', data),
  update: (id, data) => API.put(`/teams/${id}`, data),
  delete: (id) => API.delete(`/teams/${id}`),
  addPlayer: (teamId, data) => API.post(`/teams/${teamId}/players`, data),
  removePlayer: (teamId, playerId) => API.delete(`/teams/${teamId}/players/${playerId}`),
};

export const tournamentsAPI = {
  getAll: (params) => API.get('/tournaments', { params }),
  getById: (id) => API.get(`/tournaments/${id}`),
  create: (data) => API.post('/tournaments', data),
  update: (id, data) => API.put(`/tournaments/${id}`, data),
  delete: (id) => API.delete(`/tournaments/${id}`),
  registerTeam: (id, data) => API.post(`/tournaments/${id}/teams`, data),
  removeTeam: (id, teamId) => API.delete(`/tournaments/${id}/teams/${teamId}`),
  getTeams: (id) => API.get(`/tournaments/${id}/teams`),
  generateFixtures: (id) => API.post(`/tournaments/${id}/generate-fixtures`),
  getStandings: (id) => API.get(`/tournaments/${id}/standings`),
};

export const venuesAPI = {
  getAll: (params) => API.get('/venues', { params }),
  getById: (id) => API.get(`/venues/${id}`),
  create: (data) => API.post('/venues', data),
  update: (id, data) => API.put(`/venues/${id}`, data),
  delete: (id) => API.delete(`/venues/${id}`),
};

export const matchesAPI = {
  getAll: (params) => API.get('/matches', { params }),
  getById: (id) => API.get(`/matches/${id}`),
  create: (data) => API.post('/matches', data),
  update: (id, data) => API.put(`/matches/${id}`, data),
  delete: (id) => API.delete(`/matches/${id}`),
  submitScore: (id, data) => API.post(`/matches/${id}/score`, data),
};

export const standingsAPI = {
  getByTournament: (tournamentId) => API.get(`/tournaments/${tournamentId}/standings`),
};

export const cricketAPI = {
  getDetails: (matchId) => API.get(`/matches/${matchId}/cricket`),
  startInnings: (matchId, data) => API.post(`/matches/${matchId}/cricket/innings`, data),
  recordDelivery: (matchId, data) => API.post(`/matches/${matchId}/cricket/deliveries`, data),
  undoDelivery: (matchId) => API.post(`/matches/${matchId}/cricket/undo`),
  updateActivePlayers: (matchId, data) => API.put(`/matches/${matchId}/cricket/active-players`, data),
  endInnings: (matchId, data) => API.post(`/matches/${matchId}/cricket/end-innings`, data),
  finalizeMatch: (matchId, data) => API.post(`/matches/${matchId}/cricket/finalize`, data),
};

export const footballAPI = {
  getDetails: (matchId) => API.get(`/matches/${matchId}/football`),
  startMatch: (matchId) => API.post(`/matches/${matchId}/football/start`),
  updateClock: (matchId, data) => API.post(`/matches/${matchId}/football/clock`, data),
  recordEvent: (matchId, data) => API.post(`/matches/${matchId}/football/events`, data),
  undoEvent: (matchId, eventId) => API.delete(`/matches/${matchId}/football/events/${eventId}`),
  saveLineups: (matchId, data) => API.post(`/matches/${matchId}/football/lineups`, data),
  updateStats: (matchId, data) => API.put(`/matches/${matchId}/football/stats`, data),
  finalizeMatch: (matchId, data) => API.post(`/matches/${matchId}/football/finalize`, data),
};

export const usersAPI = {
  getAll: () => API.get('/users'),
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
};

export default API;
