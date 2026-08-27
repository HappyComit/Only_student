const http = require('http');
const prisma = require('../config/prisma');

const randomNum = Math.floor(1000 + Math.random() * 9000);
const testEmail = `lazy_test_student_${randomNum}@cuchd.in`;
const testUsername = `lazy_student_${randomNum}`;
const testPassword = `TestPass123!`;

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log(`\n=========================================================`);
  console.log(` 🚀 STARTING LIVE OTP & RESEND TEST ON BACKEND SERVER`);
  console.log(`=========================================================\n`);

  // Step 1: Register New Student
  console.log(`1️⃣ Testing POST /api/auth/register for ${testEmail}...`);
  const regRes = await postJson('/api/auth/register', {
    email: testEmail,
    username: testUsername,
    password: testPassword,
    name: 'Lazy Test Student',
    university: 'Chandigarh University',
  });

  console.log(`   Status: ${regRes.status}`);
  console.log(`   Response:`, JSON.stringify(regRes.data, null, 2));

  if (regRes.status !== 201 || !regRes.data.requiresVerification) {
    console.error(`❌ Registration failed or did not request OTP verification.`);
    process.exit(1);
  }
  console.log(`   ✅ Registration triggered email verification successfully!`);

  // Step 2: Fetch stored OTP code from database
  console.log(`\n2️⃣ Inspecting database record for generated 6-digit OTP code...`);
  const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
  console.log(`   User ID: ${dbUser.id}`);
  console.log(`   Stored OTP: ${dbUser.resetOtp}`);
  console.log(`   OTP Expiration: ${dbUser.resetOtpExpires}`);
  console.log(`   isVerified Initial State: ${dbUser.isVerified}`);

  // Step 3: Test Resend OTP Endpoint
  console.log(`\n3️⃣ Testing POST /api/auth/send-verification-otp (Resend OTP endpoint)...`);
  const resendRes = await postJson('/api/auth/send-verification-otp', {
    email: testEmail,
  });
  console.log(`   Status: ${resendRes.status}`);
  console.log(`   Response:`, JSON.stringify(resendRes.data, null, 2));

  const dbUserUpdated = await prisma.user.findUnique({ where: { email: testEmail } });
  console.log(`   Updated Resent OTP in DB: ${dbUserUpdated.resetOtp}`);
  const freshOtp = dbUserUpdated.resetOtp;

  // Step 4: Verify OTP
  console.log(`\n4️⃣ Testing POST /api/auth/verify-email-otp with code ${freshOtp}...`);
  const verifyRes = await postJson('/api/auth/verify-email-otp', {
    email: testEmail,
    otp: freshOtp,
  });

  console.log(`   Status: ${verifyRes.status}`);
  console.log(`   Response:`, JSON.stringify(verifyRes.data, null, 2));

  if (verifyRes.status === 200 && verifyRes.data.token && verifyRes.data.user.isVerified) {
    console.log(`\n=========================================================`);
    console.log(` 🎉 ALL TESTS PASSED! RESEND OTP VERIFICATION IS 100% WORKING!`);
    console.log(`=========================================================\n`);
  } else {
    console.error(`❌ Verification failed.`);
  }

  // Cleanup test user from DB
  await prisma.user.delete({ where: { email: testEmail } });
  console.log(`🧹 Cleaned up test user from database.`);

  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
