# 📱 CampusHive — Pre-APK Release Testing Checklist

Run through this checklist in Expo (`npx expo start`) before generating the standalone Android `.apk` for campus distribution.

---

## 1. 🔐 Authentication & Security

- [ ] **University Email Restriction**
  - Try registering with a standard `@gmail.com` address.
  - *Expected:* Blocked with error: *"Registration is restricted to university email accounts ending in @cuchd.in"*.

- [ ] **Valid Student Registration**
  - Register a new account using a valid `@cuchd.in` email.
  - *Expected:* Account created successfully; user lands on the Home tab.

- [ ] **Persistent Auth Session**
  - Close the app completely and reopen it.
  - *Expected:* User remains logged in (JWT token read from `AsyncStorage`).

- [ ] **Forgot Password OTP (Gmail SMTP)**
  - Tap **Forgot Password**, enter a registered email, and request reset code.
  - *Expected:* Receives 6-digit OTP email from `onlystudentshelps@gmail.com` within 30 seconds.

---

## 2. 🛍️ Marketplace & Service Listings

- [ ] **Category Filtering**
  - Open Marketplace tab and toggle between categories (*Dev, Design, Video, Photo*).
  - *Expected:* Feed updates immediately with category-matched services.

- [ ] **Dynamic Search**
  - Type terms like *"Figma"* or *"Web"* into the search bar.
  - *Expected:* Service list filters in real-time.

- [ ] **Post a Service (Freelancers)**
  - Switch to a Seller account profile and tap **Post Service**.
  - Upload a cover image and submit details (title, description, category, price, delivery days).
  - *Expected:* Image uploads to Supabase storage (`gig-images` bucket) and new gig appears at the top of the feed.

---

## 3. 💳 Payments & Order State Machine

- [ ] **Razorpay Booking Fee (₹6)**
  - Tap a gig listing → tap **Hire Now**.
  - *Expected:* Razorpay Checkout WebView opens with options for UPI, Cards, Netbanking, and Wallets.

- [ ] **Order Lifecycle Progression**
  - Verify status moves: `PENDING` → `IN_PROGRESS` (upon booking fee payment confirmation).
  - Seller delivers work → status becomes `DELIVERED`.
  - Buyer pays remaining gig price → status becomes `COMPLETED`.

---

## 4. 💬 Real-time Chat & WebSockets

- [ ] **Chat Lockdown Guard**
  - Attempt to open a chat thread with a user before placing an order.
  - *Expected:* Shows *"Chat Section Locked 🔒"* notice.

- [ ] **Instant Messaging**
  - Open an unlocked chat thread and send a message.
  - *Expected:* Message appears instantly without manual refresh (Socket.IO `new_message` event).

- [ ] **Notifications**
  - Trigger a new message or order update.
  - *Expected:* Top notification bell badge increments in real time.

---

## 5. 👑 Master Admin Portal

- [ ] **Web Admin Access**
  - Open `https://only-student.onrender.com/admin` in a web browser.
  - Log in using master password: `HiveAdmin#2026!SecureKey`
  - *Expected:* Grants access to real-time stats dashboard, registered students directory, and gig moderation tools.

---

## 🚀 Ready to Build APK?

Once all checks pass, run the build command:

```bash
cd CampusHive
npx eas build -p android --profile preview
```
