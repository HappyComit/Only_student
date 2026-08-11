/**
 * CampusHive — Per-User Rate Limiting Verification Script
 * 
 * Tests that:
 * 1. Login endpoint returns HTTP 429 after 10 requests for the SAME email
 * 2. Forgot-password (OTP) endpoint returns HTTP 429 after 10 requests for the SAME email
 * 3. A DIFFERENT user email from the same IP is NOT blocked (campus Wi-Fi isolation)
 * 
 * Run with: node Backend/scripts/test_rate_limiting.js [BASE_URL]
 */

const TARGET_URL = process.argv[2] || process.env.TEST_API_URL || 'http://localhost:5000/api';

console.log(`=======================================================`);
console.log(`🔒 CampusHive Per-User Rate Limiting Test Suite`);
console.log(`🎯 Target: ${TARGET_URL}`);
console.log(`=======================================================\n`);

let passed = 0;
let failed = 0;

function log(title, success, details = '') {
  if (success) {
    passed++;
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    failed++;
    console.log(`  ❌ [FAIL] ${title}`);
  }
  if (details) console.log(`     └─ ${details}`);
}

async function post(path, body) {
  const url = `${TARGET_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { error: err.message } };
  }
}

async function runTests() {
  const user1Email = 'ratelimit_test_user1@cuchd.in';
  const user2Email = 'ratelimit_test_user2@cuchd.in';
  const fakePassword = 'WrongPass123';

  // ─── Test 1: Login Rate Limit (10 requests then 429) ───────
  console.log(`\n--- Test 1: POST /auth/login — 10 requests then HTTP 429 ---`);

  let lastLoginStatus = 0;
  for (let i = 1; i <= 10; i++) {
    const res = await post('/auth/login', { email: user1Email, password: fakePassword });
    lastLoginStatus = res.status;
    // Expecting 400 (invalid email/password) for all 10 — NOT 429
  }
  log(
    'Requests 1-10 are NOT rate limited (return 400 bad credentials)',
    lastLoginStatus === 400,
    `Last status: ${lastLoginStatus}`
  );

  // Request 11 should be rate limited
  const login11 = await post('/auth/login', { email: user1Email, password: fakePassword });
  log(
    'Request 11 returns HTTP 429 (rate limited)',
    login11.status === 429,
    `Status: ${login11.status}, Message: "${login11.data.error || ''}"`
  );

  // ─── Test 2: Different user on same IP is NOT blocked ──────
  console.log(`\n--- Test 2: Different email from same IP is NOT blocked ---`);

  const user2Login = await post('/auth/login', { email: user2Email, password: fakePassword });
  log(
    'User 2 can still login (not blocked by User 1 rate limit)',
    user2Login.status !== 429,
    `Status: ${user2Login.status} (expected 400 bad credentials, NOT 429)`
  );

  // ─── Test 3: Forgot-password Rate Limit ────────────────────
  console.log(`\n--- Test 3: POST /auth/forgot-password — 10 requests then HTTP 429 ---`);

  // Use a fresh email so we start with 0 counter
  const otpEmail = 'ratelimit_otp_test@cuchd.in';
  let lastOtpStatus = 0;
  for (let i = 1; i <= 10; i++) {
    const res = await post('/auth/forgot-password', { email: otpEmail });
    lastOtpStatus = res.status;
  }
  log(
    'OTP requests 1-10 are NOT rate limited',
    lastOtpStatus !== 429,
    `Last status: ${lastOtpStatus}`
  );

  const otp11 = await post('/auth/forgot-password', { email: otpEmail });
  log(
    'OTP request 11 returns HTTP 429 (rate limited)',
    otp11.status === 429,
    `Status: ${otp11.status}, Message: "${otp11.data.error || ''}"`
  );

  // ─── Summary ───────────────────────────────────────────────
  console.log(`\n=======================================================`);
  console.log(`📊 Rate Limiting Test Results`);
  console.log(`=======================================================`);
  console.log(` TOTAL : ${passed + failed}`);
  console.log(` ✅ PASSED: ${passed}`);
  console.log(` ❌ FAILED: ${failed}`);
  console.log(`=======================================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
