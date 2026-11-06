const app = require('./src/app');
const http = require('http');

async function runRbacTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`\n======================================================`);
  console.log(`🔒 RUNNING AUTHENTICATION, RBAC & ROLE-MANAGEMENT TESTS`);
  console.log(`Port: ${port} | Base URL: ${baseUrl}`);
  console.log(`======================================================\n`);

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
    // 1. Public Visitor Dashboard access (No authentication required)
    console.log('1. Testing Public Visitor Dashboard Access...');
    const publicDash = await request('/dashboard');
    if (!publicDash.body.success || (!publicDash.body.data.upcomingMatches && !publicDash.body.data.stats)) {
      throw new Error('Public visitor cannot fetch dashboard summary');
    }
    console.log('   ✅ Public visitor can view Dashboard summary without login');

    // 2. Admin Login & Role Recognition
    console.log('2. Testing Administrator Login & Role Recognition...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@sports.com', password: 'admin123' },
    });
    if (!adminLogin.body.success || adminLogin.body.data.user.role !== 'ADMIN') {
      throw new Error(`Admin role not preserved. Got: ${adminLogin.body?.data?.user?.role}`);
    }
    const adminToken = adminLogin.body.data.token;
    console.log(`   ✅ Admin account verified: Role is strictly '${adminLogin.body.data.user.role}'`);

    // Verify /api/auth/me for Admin
    const adminMe = await request('/auth/me', { token: adminToken });
    if (!adminMe.body.success || adminMe.body.data.role !== 'ADMIN') {
      throw new Error('Admin getMe role mismatch');
    }
    console.log('   ✅ /api/auth/me confirms DB-authoritative role ADMIN');

    // 3. Register New User - Automatic ORGANIZER Role Assignment
    console.log('3. Testing New User Registration & Automatic ORGANIZER Assignment...');
    const uniqueEmail = `new_organizer_${Date.now()}@sports.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Jordan Smith',
        email: uniqueEmail,
        password: 'password123',
        role: 'ADMIN', // Deliberate attempt to claim ADMIN role from client
      },
    });

    if (!regRes.body.success) {
      throw new Error('Registration failed: ' + regRes.body.message);
    }
    if (regRes.body.data.user.role !== 'ORGANIZER') {
      throw new Error(`Expected role 'ORGANIZER', got '${regRes.body.data.user.role}'`);
    }
    const newOrgToken = regRes.body.data.token;
    const newOrgId = regRes.body.data.user.id;
    console.log(`   ✅ Client role 'ADMIN' was ignored; assigned '${regRes.body.data.user.role}' automatically`);

    // 4. Existing Organizer Login Role Preservation
    console.log('4. Testing Existing Organizer Login Role Preservation...');
    const existingOrgLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'organizer@sports.com', password: 'organizer123' },
    });
    if (!existingOrgLogin.body.success || existingOrgLogin.body.data.user.role !== 'ORGANIZER') {
      throw new Error('Organizer role corrupted');
    }
    const existingOrgToken = existingOrgLogin.body.data.token;
    console.log('   ✅ Existing Organizer logged in with preserved ORGANIZER role');

    // 5. User Management & Governance API (Admin Only)
    console.log('5. Testing Admin User Governance API (/api/users)...');
    
    // Unauthenticated access
    const unauthUsers = await request('/users');
    if (unauthUsers.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated /users, got ${unauthUsers.status}`);
    }
    console.log('   ✅ Unauthenticated access to /users rejected (401)');

    // Organizer access
    const orgUsers = await request('/users', { token: existingOrgToken });
    if (orgUsers.status !== 403) {
      throw new Error(`Expected 403 for organizer on /users, got ${orgUsers.status}`);
    }
    console.log('   ✅ Organizer access to /users rejected (403 Forbidden)');

    // Admin access
    const adminUsers = await request('/users', { token: adminToken });
    if (!adminUsers.body.success || !Array.isArray(adminUsers.body.data)) {
      throw new Error('Admin failed to fetch users list');
    }
    console.log(`   ✅ Admin successfully retrieved ${adminUsers.body.count} system users`);

    // Self-demotion prevention test
    const adminSelfId = adminLogin.body.data.user.id;
    const demoteRes = await request(`/users/${adminSelfId}/role`, {
      method: 'PUT',
      token: adminToken,
      body: { role: 'USER' },
    });
    if (demoteRes.status !== 400) {
      throw new Error('Admin self-demotion was not blocked');
    }
    console.log('   ✅ Safety check passed: Admin cannot demote themselves');

    // 6. Sports Management: Admin only
    console.log('6. Testing Sports Management Permission (Admin only)...');
    const orgCreateSport = await request('/sports', {
      method: 'POST',
      token: existingOrgToken,
      body: { name: 'Unauthorized Sport', code: 'UNS' },
    });
    if (orgCreateSport.status !== 403) {
      throw new Error(`Expected 403 for Organizer creating sport, got ${orgCreateSport.status}`);
    }
    console.log('   ✅ Organizer cannot create sports (403 Forbidden)');

    // 7. Tournament Ownership Enforcement
    console.log('7. Testing Tournament Ownership Enforcement...');
    // Get sports
    const sportsRes = await request('/sports');
    const sportId = sportsRes.body.data[0].id;

    // Organizer A (newly registered) creates Tournament A
    const tourneyA = await request('/tournaments', {
      method: 'POST',
      token: newOrgToken,
      body: {
        name: 'Jordan Invitational 2026',
        sportId,
        startDate: '2026-11-01',
        endDate: '2026-11-15',
        format: 'LEAGUE',
      },
    });
    if (!tourneyA.body.success) throw new Error('Failed to create Tournament A');
    const tourneyAId = tourneyA.body.data.id;
    console.log(`   ✅ Organizer A created Tournament A (ID: ${tourneyAId})`);

    // Organizer B (existing organizer) attempts to update Tournament A
    const orgBUpdate = await request(`/tournaments/${tourneyAId}`, {
      method: 'PUT',
      token: existingOrgToken,
      body: { name: 'Hijacked Tournament Name' },
    });
    if (orgBUpdate.status !== 403) {
      throw new Error(`Expected 403 for Organizer B updating Tournament A, got ${orgBUpdate.status}`);
    }
    console.log('   ✅ Organizer B cannot update Organizer A\'s tournament (403 Forbidden)');

    // Admin updates Tournament A (Admin has system-wide permissions)
    const adminUpdate = await request(`/tournaments/${tourneyAId}`, {
      method: 'PUT',
      token: adminToken,
      body: { name: 'Admin Managed Invitational 2026' },
    });
    if (!adminUpdate.body.success) {
      throw new Error('Admin failed to update tournament across the system');
    }
    console.log('   ✅ System Administrator has system-wide management authority');

    // Clean up test tournament
    await request(`/tournaments/${tourneyAId}`, {
      method: 'DELETE',
      token: adminToken,
    });

    console.log(`\n======================================================`);
    console.log(`🎉 ALL AUTHENTICATION, RBAC & GOVERNANCE TESTS PASSED! 🎉`);
    console.log(`======================================================\n`);
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
}

runRbacTests();
