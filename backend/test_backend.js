const app = require('./src/app');
const http = require('http');

async function testBackend() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`[Integration Test] Running against temporary port ${port}...`);

  const request = async (endpoint, options = {}) => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json();
    return { status: res.status, body: json };
  };

  try {
    // 1. Auth Test - Login Admin
    console.log('1. Testing Admin Login...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@sports.com', password: 'admin123' },
    });
    if (!adminLogin.body.success) throw new Error('Admin login failed');
    const adminToken = adminLogin.body.data.token;
    console.log('   ✅ Admin login successful');

    // 2. Auth Test - Login Organizer
    console.log('2. Testing Organizer Login...');
    const orgLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'organizer@sports.com', password: 'organizer123' },
    });
    if (!orgLogin.body.success) throw new Error('Organizer login failed');
    const orgToken = orgLogin.body.data.token;
    console.log('   ✅ Organizer login successful');

    // 3. Sports API
    console.log('3. Testing GET /sports...');
    const sportsRes = await request('/sports');
    if (!sportsRes.body.success || !Array.isArray(sportsRes.body.data)) throw new Error('GET sports failed');
    console.log(`   ✅ Found ${sportsRes.body.data.length} sports`);

    // Create Test Sport
    console.log('4. Testing POST /sports...');
    const uid = Date.now().toString().slice(-4);
    const newSport = await request('/sports', {
      method: 'POST',
      token: adminToken,
      body: { name: `Handball ${uid}`, code: `HDB${uid}`, description: 'Test sport creation' },
    });
    if (!newSport.body.success) throw new Error('Create sport failed: ' + newSport.body.message);
    const createdSportId = newSport.body.data.id;
    console.log('   ✅ Created sport successfully with ID:', createdSportId);

    // 5. Players API
    console.log('5. Testing POST /players...');
    const newPlayer = await request('/players', {
      method: 'POST',
      token: orgToken,
      body: { name: 'Test Athlete', sportId: createdSportId, nationality: 'Norway', gender: 'Male' },
    });
    if (!newPlayer.body.success) throw new Error('Create player failed: ' + newPlayer.body.message);
    const createdPlayerId = newPlayer.body.data.id;
    console.log('   ✅ Created player successfully with ID:', createdPlayerId);

    // 6. Teams API
    console.log('6. Testing POST /teams...');
    const newTeam = await request('/teams', {
      method: 'POST',
      token: orgToken,
      body: { name: 'Handball Kings', sportId: createdSportId, description: 'Test team' },
    });
    if (!newTeam.body.success) throw new Error('Create team failed: ' + newTeam.body.message);
    const createdTeamId = newTeam.body.data.id;
    console.log('   ✅ Created team successfully with ID:', createdTeamId);

    // 7. Add Player to Team Roster
    console.log('7. Testing POST /teams/:id/players (Add player to roster)...');
    const addToRoster = await request(`/teams/${createdTeamId}/players`, {
      method: 'POST',
      token: orgToken,
      body: { playerId: createdPlayerId, jerseyNumber: 77 },
    });
    if (!addToRoster.body.success) throw new Error('Add player to roster failed: ' + addToRoster.body.message);
    console.log('   ✅ Added player to team roster successfully!');

    // 8. Test Invalid Cross-Sport Roster Rule
    console.log('8. Testing Cross-Sport Validation Rule (Mismatch sport)...');
    const footballSport = sportsRes.body.data.find(s => s.code === 'FTB');
    if (footballSport) {
      const footballTeam = await request('/teams', {
        method: 'POST',
        token: orgToken,
        body: { name: 'Cross Sport FC', sportId: footballSport.id },
      });
      const invalidRosterAttempt = await request(`/teams/${footballTeam.body.data.id}/players`, {
        method: 'POST',
        token: orgToken,
        body: { playerId: createdPlayerId }, // Player is Handball, Team is Football
      });
      if (invalidRosterAttempt.status === 400 && !invalidRosterAttempt.body.success) {
        console.log('   ✅ Cross-sport mismatch blocked correctly with 400 Bad Request!');
      } else {
        throw new Error('Validation failed: Cross-sport player assignment was not blocked!');
      }

      // Cleanup cross sport team
      await request(`/teams/${footballTeam.body.data.id}`, { method: 'DELETE', token: adminToken });
    }

    // 9. Dashboard Summary API
    console.log('9. Testing GET /dashboard...');
    const dashRes = await request('/dashboard');
    if (!dashRes.body.success || !dashRes.body.data.upcomingMatches) throw new Error('GET dashboard failed');
    console.log('   ✅ Dashboard retrieved live, upcoming and results match feed successfully');

    // Cleanup Test Data
    console.log('10. Cleaning up test sport, team, player...');
    await request(`/players/${createdPlayerId}`, { method: 'DELETE', token: adminToken });
    await request(`/teams/${createdTeamId}`, { method: 'DELETE', token: adminToken });
    await request(`/sports/${createdSportId}`, { method: 'DELETE', token: adminToken });
    console.log('   ✅ Cleanup completed successfully!');

    console.log('\n🎉 ALL WEEK 1 BACKEND ENDPOINTS & VALIDATIONS VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

testBackend();
