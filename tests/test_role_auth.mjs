import http from 'http';

const BASE_URL = 'http://127.0.0.1:5000';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing Dual Role Login & Single-Role Authorization Policies...\n');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. User login via User Portal
  const res1 = await post('/api/auth/login', {
    email: 'alex.rivera@finedge.io',
    password: 'DemoPass123!',
    portal: 'user'
  });
  assert(res1.status === 200 && res1.data.user.role === 'user', '1. User can log in through User Portal');

  // 2. Admin login via Admin Portal
  const res2 = await post('/api/auth/login', {
    email: 'admin@finedge.io',
    password: 'AdminPass123!',
    portal: 'admin'
  });
  assert(res2.status === 200 && res2.data.user.role === 'admin', '2. Admin can log in through Admin Portal');

  // 3. User tries to log in through Admin Portal
  const res3 = await post('/api/auth/login', {
    email: 'alex.rivera@finedge.io',
    password: 'DemoPass123!',
    portal: 'admin'
  });
  assert(res3.status === 403 && res3.data.error.code === 'ROLE_MISMATCH', '3. User is blocked from Admin Portal (403 ROLE_MISMATCH)');

  // 4. Admin tries to log in through User Portal
  const res4 = await post('/api/auth/login', {
    email: 'admin@finedge.io',
    password: 'AdminPass123!',
    portal: 'user'
  });
  assert(res4.status === 403 && res4.data.error.code === 'ROLE_MISMATCH', '4. Admin is blocked from User Portal (403 ROLE_MISMATCH)');

  // 5. Test unique email single-role policy
  const uniqueEmail = `role_test_${Date.now()}@finedge.io`;
  const resRegUser = await post('/api/auth/register', {
    name: 'New Officer',
    email: uniqueEmail,
    password: 'StrongPass123!',
    role: 'user'
  });
  assert(resRegUser.status === 201 && resRegUser.data.user.role === 'user', '5. New user account registered with role user');

  // 6. Try registering same email as admin -> MUST BE REJECTED
  const resRegAdminDup = await post('/api/auth/register', {
    name: 'New Officer Admin Duplicate',
    email: uniqueEmail,
    password: 'StrongPass123!',
    role: 'admin'
  });
  assert(resRegAdminDup.status === 409 && resRegAdminDup.data.error.code === 'EMAIL_EXISTS', '6. Registering same email for admin rejected with 409 (no same mail id for both user and admin)');

  // 7. Backward compatibility: Standard login without portal still works
  const resCompat = await post('/api/auth/login', {
    email: 'alex.rivera@finedge.io',
    password: 'DemoPass123!'
  });
  assert(resCompat.status === 200, '7. Backward compatibility: Existing system calls without portal parameter succeed');

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
