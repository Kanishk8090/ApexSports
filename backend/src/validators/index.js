const validateRegister = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!data.email || !data.email.includes('@')) errors.push('Valid email is required');
  if (!data.password || data.password.length < 6) errors.push('Password must be at least 6 characters');
  return errors;
};

const validateLogin = (data) => {
  const errors = [];
  if (!data.email) errors.push('Email is required');
  if (!data.password) errors.push('Password is required');
  return errors;
};

const validateSport = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) errors.push('Sport name is required');
  if (!data.code || data.code.trim().length < 2) errors.push('Sport code is required');
  return errors;
};

const validatePlayer = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) errors.push('Player name is required');
  if (!data.sportId) errors.push('Sport ID is required');
  return errors;
};

const validateTeam = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) errors.push('Team name is required');
  if (!data.sportId) errors.push('Sport ID is required');
  return errors;
};

const validateTeamPlayer = (data) => {
  const errors = [];
  if (!data.playerId) errors.push('Player ID is required');
  return errors;
};

module.exports = {
  validateRegister,
  validateLogin,
  validateSport,
  validatePlayer,
  validateTeam,
  validateTeamPlayer,
};
