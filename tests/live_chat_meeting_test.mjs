// ===================================================================
// G13 Live Chat Meeting, AI Bot & Meeting ID Match Verification Test
// ===================================================================

import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running G13 Live Chat Meeting & AI Report Tests');
  console.log('====================================================\n');

  let passed = 0;
  const timestamp = Date.now();

  const user1Email = `user1_${timestamp}@g13intelligence.io`;
  const user2Email = `user2_${timestamp}@g13intelligence.io`;
  const password = 'TestPassword123!';

  let user1Token = '';
  let user1Id = '';
  let user2Token = '';
  let user2Id = '';
  let meetingCode = '';
  let meetingId = '';

  // 1. Register User 1
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User One (Host)', email: user1Email, password })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert(data.token, 'Expected token for user 1');
    user1Token = data.token;
    user1Id = data.user.id;
    console.log('✅ [PASS] 1. User 1 registered successfully');
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 1. User 1 registration failed:', err.message);
  }

  // 2. Register User 2
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Two (Engineer)', email: user2Email, password })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert(data.token, 'Expected token for user 2');
    user2Token = data.token;
    user2Id = data.user.id;
    console.log('✅ [PASS] 2. User 2 registered successfully');
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 2. User 2 registration failed:', err.message);
  }

  // 3. User 1 Creates Meeting
  try {
    const res = await fetch(`${BASE_URL}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'Q3 Payment API Architecture Sync',
        client: 'FinEdge Corp',
        organization: 'Core Backend Team'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert(data.code, 'Expected meeting code');
    assert(data.code.startsWith('G13-'), 'Expected G13- prefix');
    meetingCode = data.code;
    meetingId = data.id;
    console.log(`✅ [PASS] 3. User 1 created meeting (Meeting ID: ${meetingCode})`);
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 3. Create meeting failed:', err.message);
  }

  // 4. User 2 Joins Meeting with same Meeting ID
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user2Token}`
      },
      body: JSON.stringify({
        participant: {
          userId: user2Id,
          name: 'User Two (Engineer)',
          role: 'Backend Architect'
        }
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    console.log(`✅ [PASS] 4. User 2 joined meeting using matching ID (${meetingCode})`);
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 4. Join meeting failed:', err.message);
  }

  // 5. User 1 sends chat message
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingCode}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        meetingCode: meetingCode,
        text: 'We need the payment API refactor and idempotency fixes for high concurrency.',
        sender: { id: user1Id, name: 'User One (Host)', role: 'Host', isUser: true }
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert(data.message.id);
    console.log('✅ [PASS] 5. User 1 sent live chat message');
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 5. User 1 chat message failed:', err.message);
  }

  // 6. User 2 sends chat message with commitment and deadline
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingCode}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user2Token}`
      },
      body: JSON.stringify({
        meetingCode: meetingCode,
        text: "I'll complete the payment API refactor and idempotency fixes by Friday at 5:00 PM EST.",
        sender: { id: user2Id, name: 'User Two (Engineer)', role: 'Backend Architect', isUser: true }
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert(data.message.commitment_details || data.message.commitmentDetails, 'Commitment should be detected');
    console.log('✅ [PASS] 6. User 2 sent commitment message with verified deadline');
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 6. User 2 commitment message failed:', err.message);
  }

  // 7. Enforce Meeting ID Match: Sending message with mismatched meetingCode is rejected
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingCode}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        meetingCode: 'G13-WRONG99',
        text: 'This message has a mismatched meeting code.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.error, 'MEETING_ID_MISMATCH');
    console.log('✅ [PASS] 7. Mismatched meeting ID rejected with 400 MEETING_ID_MISMATCH');
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 7. Meeting ID mismatch check failed:', err.message);
  }

  // 8. Fetch Chat Messages: Both User 1 and User 2 messages are present
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingCode}/messages`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(data.messages));
    assert(data.messages.length >= 2, 'Expected at least 2 chat messages');
    const hasUser1 = data.messages.some(m => m.sender.name.includes('User One'));
    const hasUser2 = data.messages.some(m => m.sender.name.includes('User Two'));
    assert(hasUser1 && hasUser2, 'Both User 1 and User 2 messages should be stored');
    console.log(`✅ [PASS] 8. Retrieved ${data.messages.length} chat messages stored under Meeting ID ${meetingCode}`);
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 8. Fetch chat messages failed:', err.message);
  }

  // 9. Generate Final Intelligence Report via /analyze
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingCode}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert(data.report, 'Expected intelligence report');
    assert(data.report.actionItems, 'Expected action items in report');
    assert(data.report.actionItems.length > 0, 'Expected at least 1 action item');
    
    const commitmentAction = data.report.actionItems[0];
    assert(commitmentAction.task, 'Expected task');
    assert(commitmentAction.deadline, 'Expected deadline');
    assert(commitmentAction.evidence, 'Expected verbatim evidence quote');

    console.log('✅ [PASS] 9. Final meeting intelligence report generated from live chat');
    console.log(`   └─ Action: "${commitmentAction.task}" | Owner: ${commitmentAction.owner} | Due: ${commitmentAction.deadline}`);
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 9. Generate report failed:', err.message);
  }

  // 10. Verify Meeting Record in Database is marked 'completed' with report_data
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingCode}`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'completed');
    assert(data.report, 'Meeting should have attached report in DB');
    console.log('✅ [PASS] 10. Meeting status updated to completed with persistent report in DB');
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] 10. Verify meeting record failed:', err.message);
  }

  console.log('\n====================================================');
  console.log(`Summary: ${passed} passed, ${10 - passed} failed.`);
  console.log('====================================================');

  if (passed === 10) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
