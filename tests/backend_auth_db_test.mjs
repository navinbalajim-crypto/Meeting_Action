import http from 'http';

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running G13 Backend Auth & Database Security Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const rand = Math.random().toString(36).substr(2, 6);
    const emailA = `test_user_a_${rand}@enterprise.io`;
    const emailB = `test_user_b_${rand}@client.io`;
    const password = 'SecurePassword2026!';

    // TEST 1: Register User A
    const regA = await request('POST', '/api/auth/register', {
      name: 'User Alpha',
      email: emailA,
      password,
      organization: 'Alpha Corp'
    });
    assert(regA.status === 201 && regA.data.token && regA.data.user.email === emailA, '1. Register User A returns 201 and JWT token');
    const tokenA = regA.data.token;
    const refreshTokenA = regA.data.refreshToken;
    const userIdA = regA.data.user.id;

    // TEST 2: Duplicate Registration Check
    const regDup = await request('POST', '/api/auth/register', {
      name: 'User Alpha Duplicate',
      email: emailA,
      password
    });
    assert(regDup.status === 409 && regDup.data.error.code === 'EMAIL_EXISTS', '2. Duplicate registration rejected with 409 EMAIL_EXISTS');

    // TEST 3: Login with Invalid Password (tells wrong pass)
    const badLogin = await request('POST', '/api/auth/login', {
      email: emailA,
      password: 'WrongPassword!'
    });
    assert(badLogin.status === 401 && (badLogin.data.error.code === 'WRONG_PASSWORD' || badLogin.data.error.code === 'INVALID_CREDENTIALS'), '3. Invalid credentials rejected with 401 (Wrong ID or Password)');

    // TEST 3b: Login with Non-Existent User (tells user to generate new ID & pass)
    const notFoundLogin = await request('POST', '/api/auth/login', {
      email: `unregistered_${rand}@enterprise.io`,
      password: 'SomePassword123!'
    });
    assert(notFoundLogin.status === 404 && notFoundLogin.data.error.code === 'USER_NOT_FOUND' && notFoundLogin.data.notRegistered === true, '3b. Non-existent user rejected with 404 prompting to generate new user ID and pass');

    // TEST 4: Login with Valid Credentials
    const loginA = await request('POST', '/api/auth/login', {
      email: emailA,
      password
    });
    assert(loginA.status === 200 && loginA.data.token && !loginA.data.user.password_hash, '4. Valid login succeeds and password_hash is stripped');

    // TEST 5: GET /api/auth/me (Protected)
    const meA = await request('GET', '/api/auth/me', null, tokenA);
    assert(meA.status === 200 && meA.data.user.id === userIdA, '5. Protected /api/auth/me returns authenticated user');

    // TEST 6: GET /api/auth/me without token
    const meNoToken = await request('GET', '/api/auth/me');
    assert(meNoToken.status === 401 && meNoToken.data.error.code === 'UNAUTHORIZED', '6. Unauthenticated request to protected route blocked with 401');

    // TEST 7: Token Refresh Rotation
    const refreshRes = await request('POST', '/api/auth/refresh', { refreshToken: refreshTokenA });
    assert(refreshRes.status === 200 && refreshRes.data.token && refreshRes.data.refreshToken !== refreshTokenA, '7. Refresh token rotation generates new access & refresh tokens');

    // TEST 8: Register User B
    const regB = await request('POST', '/api/auth/register', {
      name: 'User Beta',
      email: emailB,
      password,
      organization: 'Beta Client'
    });
    const tokenB = regB.data.token;
    assert(regB.status === 201 && tokenB, '8. Register User B succeeds');

    // TEST 9: Multi-User Isolation - User A creates private meeting
    const createMeetA = await request('POST', '/api/meetings', {
      title: 'Confidential Strategy Sync (User A Only)',
      client: 'Acme Alpha'
    }, tokenA);
    assert(createMeetA.status === 201 && createMeetA.data.owner_id === userIdA, '9. Meeting created with owner_id bound to User A');
    const meetingAId = createMeetA.data.id;

    // TEST 10: Multi-User Isolation - User B CANNOT see User A's private meeting in list
    const meetingsListB = await request('GET', '/api/meetings', null, tokenB);
    const hasMeetingA = meetingsListB.data.some(m => m.id === meetingAId);
    assert(!hasMeetingA, "10. User B cannot see User A's private meeting in meetings list");

    // TEST 11: Multi-User Isolation - User B CANNOT access User A's private meeting directly
    const accessForbidden = await request('GET', `/api/meetings/${meetingAId}`, null, tokenB);
    assert(accessForbidden.status === 403, "11. User B direct access to User A's private meeting rejected with 403 Forbidden");

    // TEST 12: Action Tracker item creation and update
    const actionCreate = await request('POST', '/api/actions', {
      meetingId: meetingAId,
      task: 'Deploy payment gateway redundancy',
      owner: 'User Alpha',
      deadline: 'Friday 5PM'
    }, tokenA);
    const createdAct = actionCreate.data.action || actionCreate.data;
    assert(createdAct && createdAct.task === 'Deploy payment gateway redundancy', '12. Action item created persistently');
    const actionId = createdAct.id;

    const actionUpdate = await request('PATCH', `/api/actions/${actionId}`, {
      status: 'Completed'
    }, tokenA);
    assert(actionUpdate.status === 200 && actionUpdate.data.action.status === 'Completed', '13. Action item status successfully updated to Completed');

    // TEST 14: Voice Profile Security - Raw Embeddings Not Exposed
    const voiceProfile = await request('GET', '/api/voice-profile', null, tokenA);
    assert(voiceProfile.status === 200 && voiceProfile.data.profile.enrolledEmbedding === undefined, '14. Voice profile response excludes raw embedding vectors');

    // TEST 15: Logout Session Revocation
    const logoutRes = await request('POST', '/api/auth/logout', { refreshToken: refreshRes.data.refreshToken }, tokenA);
    assert(logoutRes.status === 200, '15. Logout invalidates session');

    console.log('\n====================================================');
    console.log(`Summary: ${passed} passed, ${failed} failed.`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (e) {
    console.error('Fatal test error:', e);
    process.exit(1);
  }
}

runTests();
