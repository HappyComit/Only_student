/**
 * CampusHive — End-to-End (E2E) API Test Suite
 * Run with: node Backend/scripts/e2e_test.js [BASE_URL]
 * Default target: http://localhost:5000/api (or pass https://only-student.onrender.com/api)
 */

const TARGET_URL = process.argv[2] || process.env.TEST_API_URL || 'http://localhost:5000/api';
const BASE_HOST = TARGET_URL.replace(/\/api\/?$/, '');

console.log(`=======================================================`);
console.log(`🧪 CampusHive End-to-End API Test Suite`);
console.log(`🎯 Target Endpoint: ${TARGET_URL}`);
console.log(`=======================================================\n`);

let testsPassed = 0;
let testsFailed = 0;

function logResult(title, success, details = '') {
  if (success) {
    testsPassed++;
    console.log(`✅ [PASS] ${title}`);
    if (details) console.log(`   └─ ${details}`);
  } else {
    testsFailed++;
    console.log(`❌ [FAIL] ${title}`);
    if (details) console.log(`   └─ ERROR: ${details}`);
  }
}

async function request(path, options = {}, token = null) {
  const url = path.startsWith('http') ? path : `${TARGET_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { text: await res.text() };
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: { error: err.message } };
  }
}

async function runE2ESuite() {
  const timestamp = Date.now().toString().slice(-6);
  const buyerEmail = `e2e_buyer_${timestamp}@cuchd.in`;
  const buyerUsername = `buyer_${timestamp}`;
  const sellerEmail = `e2e_seller_${timestamp}@cuchd.in`;
  const sellerUsername = `seller_${timestamp}`;
  const password = `TestPass#2026`;

  let buyerToken = null;
  let buyerId = null;
  let sellerToken = null;
  let sellerId = null;
  let createdGigId = null;
  let createdOrderId = null;

  // ---------------------------------------------------------
  // 1. Health & Server Ping Check
  // ---------------------------------------------------------
  console.log(`--- Section 1: Health & Server Verification ---`);
  const healthRes = await request(`${BASE_HOST}/health`);
  logResult(
    'Server Health Ping (/health)',
    healthRes.ok && healthRes.data.status === 'OK',
    `Status: ${healthRes.status}, Response: ${JSON.stringify(healthRes.data)}`
  );

  // ---------------------------------------------------------
  // 2. Authentication & Domain Restrictions
  // ---------------------------------------------------------
  console.log(`\n--- Section 2: Auth & Security Checks ---`);
  
  // 2a. Rejection of Non-University Email
  const invalidEmailRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `fakeuser_${timestamp}@gmail.com`,
      username: `fake_${timestamp}`,
      password: password
    })
  });
  logResult(
    'Block Invalid Non-University Email (@gmail.com)',
    invalidEmailRes.status === 400 && invalidEmailRes.data.error?.includes('@cuchd.in'),
    `Message: "${invalidEmailRes.data.error}"`
  );

  // 2b. Valid Buyer Account Registration (@cuchd.in)
  const regBuyerRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: buyerEmail,
      username: buyerUsername,
      password: password,
      name: 'E2E Buyer Student',
      university: 'Chandigarh University',
      department: 'Computer Science',
      year: '3rd Year'
    })
  });
  const buyerCreated = regBuyerRes.status === 201 && regBuyerRes.data.user?.id;
  if (buyerCreated) buyerId = regBuyerRes.data.user.id;
  logResult(
    'Register Valid Buyer (@cuchd.in)',
    buyerCreated,
    buyerCreated ? `User ID: ${buyerId}` : `Status: ${regBuyerRes.status}, Response: ${JSON.stringify(regBuyerRes.data)}`
  );

  // 2c. Valid Seller Account Registration (@cuchd.in)
  const regSellerRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: sellerEmail,
      username: sellerUsername,
      password: password,
      isSeller: true,
      name: 'E2E Seller Freelancer',
      bio: 'Expert Mobile App Developer',
      upiId: 'seller@upi',
      university: 'Chandigarh University',
      department: 'Computer Applications',
      year: '4th Year'
    })
  });
  const sellerCreated = regSellerRes.status === 201 && regSellerRes.data.user?.id;
  if (sellerCreated) sellerId = regSellerRes.data.user.id;
  logResult(
    'Register Valid Seller Freelancer (@cuchd.in)',
    sellerCreated,
    `User ID: ${sellerId}`
  );

  // 2d. Buyer Login
  const loginBuyerRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: buyerEmail, password })
  });
  if (loginBuyerRes.ok && loginBuyerRes.data.token) {
    buyerToken = loginBuyerRes.data.token;
  }
  logResult(
    'Buyer Login & JWT Token Retrieval',
    !!buyerToken,
    `Token generated: ${buyerToken ? buyerToken.slice(0, 20) + '...' : 'NONE'}`
  );

  // 2e. Seller Login
  const loginSellerRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: sellerEmail, password })
  });
  if (loginSellerRes.ok && loginSellerRes.data.token) {
    sellerToken = loginSellerRes.data.token;
  }
  logResult(
    'Seller Login & JWT Token Retrieval',
    !!sellerToken,
    `Token generated: ${sellerToken ? sellerToken.slice(0, 20) + '...' : 'NONE'}`
  );

  // 2f. Fetch Protected Profile
  const profileRes = await request('/auth/profile', { method: 'GET' }, buyerToken);
  logResult(
    'Get Protected Profile (/auth/profile)',
    profileRes.ok && profileRes.data.user?.email === buyerEmail,
    `Email: ${profileRes.data.user?.email}`
  );

  // ---------------------------------------------------------
  // 3. Marketplace & Service Gigs
  // ---------------------------------------------------------
  console.log(`\n--- Section 3: Marketplace & Service Listing Checks ---`);

  // 3a. Seller Posts a New Gig Listing
  const createGigRes = await request('/gigs', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Full Stack React Native App Development',
      description: 'Custom mobile app built with Expo, TypeScript and Node.js backend.',
      price: 4999,
      deliveryDays: 3,
      category: 'Dev',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
      tags: 'mobile,react-native,dev'
    })
  }, sellerToken);

  if (createGigRes.ok && createGigRes.data.gig?.id) {
    createdGigId = createGigRes.data.gig.id;
  }
  logResult(
    'Post Service Gig (Seller)',
    createGigRes.status === 201 && !!createdGigId,
    `Gig ID: ${createdGigId}, Title: "${createGigRes.data.gig?.title}"`
  );

  // 3b. Fetch Marketplace Gigs with Pagination
  const fetchGigsRes = await request('/gigs?page=1&limit=10&category=Dev');
  const gigsHasPagination = fetchGigsRes.ok && Array.isArray(fetchGigsRes.data.gigs) && fetchGigsRes.data.page === 1;
  logResult(
    'Fetch Marketplace Gigs List with DB Pagination',
    gigsHasPagination,
    `Retrieved ${fetchGigsRes.data.gigs?.length || 0} gigs. Total: ${fetchGigsRes.data.totalCount || 0}`
  );

  // 3c. Get Single Gig Details
  const getGigRes = await request(`/gigs/${createdGigId}`);
  logResult(
    'Fetch Single Gig Details by ID',
    getGigRes.ok && getGigRes.data.gig?.id === createdGigId,
    `Seller Orders Count dynamically returned: ${getGigRes.data.gig?.seller?.completedOrdersCount ?? 'N/A'}`
  );

  // ---------------------------------------------------------
  // 4. Payments & Order State Machine
  // ---------------------------------------------------------
  console.log(`\n--- Section 4: Razorpay Payments & Order State Machine ---`);

  // 4a. Buyer Places an Order
  const createOrderRes = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({ gigId: createdGigId })
  }, buyerToken);

  if (createOrderRes.status === 201 && createOrderRes.data.order?.id) {
    createdOrderId = createOrderRes.data.order.id;
  }
  logResult(
    'Buyer Places Order (/orders)',
    createOrderRes.status === 201 && !!createdOrderId,
    `Order ID: ${createdOrderId}, Initial Status: ${createOrderRes.data.order?.status}`
  );

  // 4b. Create Razorpay Order for ₹6 Booking Fee
  let razorpayOrderId = null;
  if (createdOrderId) {
    const rzpOrderRes = await request('/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({
        orderId: createdOrderId,
        paymentType: 'booking'
      })
    }, buyerToken);

    if (rzpOrderRes.ok && rzpOrderRes.data.razorpayOrderId) {
      razorpayOrderId = rzpOrderRes.data.razorpayOrderId;
    }
    logResult(
      'Razorpay Create Order (₹6 Booking Fee)',
      rzpOrderRes.ok && !!razorpayOrderId,
      `Razorpay Order ID: ${razorpayOrderId}, Amount: ₹${(rzpOrderRes.data.amount || 600) / 100}`
    );
  }

  // 4c. Verify Razorpay Payment Signature & Move to PENDING_ACCEPTANCE / IN_PROGRESS
  let verifySigRes = null;
  if (createdOrderId && razorpayOrderId) {
    const crypto = require('crypto');
    const paymentId = `pay_mock_${timestamp}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'OhmeQFjPxkg95KZmCejvGsC1';
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest('hex');

    verifySigRes = await request('/payments/razorpay/verify-signature', {
      method: 'POST',
      body: JSON.stringify({
        orderId: createdOrderId,
        paymentType: 'booking',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: computedSignature
      })
    }, buyerToken);

    logResult(
      'Verify Razorpay Payment Signature (Booking Fee)',
      verifySigRes.ok,
      `Status: ${verifySigRes.data.message || verifySigRes.data.error}`
    );
  }

  // 4d. Order is now IN_PROGRESS after booking fee verification
  logResult(
    'Order Status Progression -> IN_PROGRESS (Booking Fee Verified)',
    verifySigRes?.ok && verifySigRes?.data.order?.status === 'IN_PROGRESS',
    `New Status: ${verifySigRes?.data.order?.status || 'IN_PROGRESS'}`
  );

  // 4e. Fetch Buyer Orders
  const buyerOrdersRes = await request('/orders/buyer', { method: 'GET' }, buyerToken);
  logResult(
    'Fetch Buyer Orders List',
    buyerOrdersRes.ok && Array.isArray(buyerOrdersRes.data.orders),
    `Buyer has ${buyerOrdersRes.data.orders?.length || 0} active/completed orders`
  );

  // 4f. Seller Delivers Work -> DELIVERED
  if (createdOrderId) {
    const deliverRes = await request(`/orders/${createdOrderId}/deliver`, {
      method: 'POST'
    }, sellerToken);

    logResult(
      'Order Status Progression -> DELIVERED (Seller Submits Work)',
      deliverRes.ok && deliverRes.data.order?.status === 'DELIVERED',
      `New Status: ${deliverRes.data.order?.status}`
    );

    // 4g. Buyer Pays Final Gig Price -> COMPLETED
    const completeRes = await request(`/orders/${createdOrderId}/pay-gig`, {
      method: 'POST',
      body: JSON.stringify({ gigTransactionId: `upi_ref_${timestamp}` })
    }, buyerToken);

    logResult(
      'Order Status Progression -> COMPLETED (Buyer Final Payment)',
      completeRes.ok && completeRes.data.order?.status === 'COMPLETED',
      `Final Status: ${completeRes.data.order?.status}`
    );
  }

  // ---------------------------------------------------------
  // 5. Messaging & Real-Time Notifications
  // ---------------------------------------------------------
  console.log(`\n--- Section 5: Real-Time Messaging & Notifications ---`);

  // 5a. Send Chat Message from Buyer to Seller
  const sendMsgRes = await request('/messages', {
    method: 'POST',
    body: JSON.stringify({
      receiverId: sellerId,
      content: 'Hello! Excited to work on this mobile app project.'
    })
  }, buyerToken);

  logResult(
    'Send Direct Chat Message (Buyer -> Seller)',
    sendMsgRes.status === 201 && !!sendMsgRes.data.chatMessage?.content,
    `Message Content: "${sendMsgRes.data.chatMessage?.content || sendMsgRes.data.error}"`
  );

  // 5b. Fetch Seller Chat Threads
  const threadsRes = await request('/messages', { method: 'GET' }, sellerToken);
  logResult(
    'Fetch Seller Chat Inbox Threads',
    threadsRes.ok && Array.isArray(threadsRes.data.threads),
    `Retrieved ${threadsRes.data.threads?.length || 0} active chat threads`
  );

  // 5c. Fetch Notifications & Unread Count
  const notifRes = await request('/notifications', { method: 'GET' }, sellerToken);
  logResult(
    'Fetch User Notifications & Unread Count',
    notifRes.ok && typeof notifRes.data.unreadCount === 'number',
    `Unread Count: ${notifRes.data.unreadCount}`
  );

  // ---------------------------------------------------------
  // 6. Security, Input Sanitization & Master Admin Portal
  // ---------------------------------------------------------
  console.log(`\n--- Section 6: Security Sanitization & Admin Verification ---`);

  // 6a. XSS Sanitization Check
  const xssMsgRes = await request('/messages', {
    method: 'POST',
    body: JSON.stringify({
      receiverId: sellerId,
      content: '<script>alert("XSS Attack")</script>Safe Text Here'
    })
  }, buyerToken);

  const cleanText = xssMsgRes.data.chatMessage?.content || '';
  logResult(
    'XSS HTML Sanitization Guard on Messages',
    !cleanText.includes('<script>'),
    `Sanitized Output: "${cleanText}"`
  );

  // 6b. Admin Dashboard Access Guard (Non-Admin Rejection)
  const nonAdminStatsRes = await request('/auth/admin/stats', { method: 'GET' }, buyerToken);
  logResult(
    'Admin Route Access Guard (Block standard users)',
    nonAdminStatsRes.status === 403,
    `Access Denied Response: "${nonAdminStatsRes.data.error}"`
  );

  // ---------------------------------------------------------
  // E2E Summary Report
  // ---------------------------------------------------------
  console.log(`\n=======================================================`);
  console.log(`📊 E2E Test Suite Execution Summary`);
  console.log(`=======================================================`);
  console.log(` TOTAL TESTS : ${testsPassed + testsFailed}`);
  console.log(` ✅ PASSED   : ${testsPassed}`);
  console.log(` ❌ FAILED   : ${testsFailed}`);
  console.log(` SUCCESS RATE: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log(`=======================================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runE2ESuite();
