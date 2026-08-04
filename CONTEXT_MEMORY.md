# 🧠 CampusHive Context & Session Memory Log

This document serves as the persistent memory and technical log for AI Agents (Antigravity) and developers working on **CampusHive (onlyStudents)**. 

---

## 📌 1. Project Overview & Core Mission
* **App Name:** CampusHive (`onlyStudents`)
* **Purpose:** A university campus micro-freelancing marketplace for students to offer services (web dev, design, tutoring, event hosting, notes) and earn money.
* **Email Restriction:** Strictly restricted to university accounts ending in **`@cuchd.in`**.

---

<!-- ********************Also we need to make its UI dynamic for laptops too
          rn its not dynamic******************************* -->

## 🛠️ 2. Technical Stack & Fixed Environment Setup

### **Frontend (`/CampusHive`)**
* **Framework:** React Native with **Expo SDK 54** (using Expo Router v6).
* **Dependencies Locked:** 
  - `react`: `19.1.0`
  - `react-native`: `0.76.5` / `0.81.5`
  - `expo-router`: `~6.0.24`
  - `babel-preset-expo`: `~54.0.12`
* **Web Configuration:** `app.json` has `"output": "single"` (SPA Metro bundler mode).
* **Active Dev IP:** Configured in `constants/api.ts` to `http://10.167.41.27:5000/api`.

### **Backend (`/Backend`)**
* **Runtime:** Node.js with Express.js.
* **Database & ORM:** **SQLite** (`dev.db`) managed via **Prisma ORM**.
* **Authentication:** `bcryptjs` password hashing + `jsonwebtoken` (JWT) passed in `Authorization` headers.
* **Mailing:** `nodemailer` installed for password reset emails.

---

## 🚀 3. Features & Modifications Built Today

### **A. UPI ID Management System**
* **Location:** `CampusHive/app/(tabs)/profile.tsx`
* **Implementation:** Built an interactive **Edit Profile Modal** allowing users to enter and update their custom UPI ID (`upiId`), full name, bio, and skills.
* **Backend Sync:** Saves `upiId` to SQLite database via `PUT /api/auth/profile`.
* **GPay Integration:** In `CampusHive/app/earnings.tsx`, `triggerUPIPayment()` reads the seller's custom `upiId` and pre-fills it in GPay (`upi://pay?pa=sellerUpiId`).

### **B. Forgot Password & OTP Reset System**
* **Database Schema:** Added `resetOtp` (String) and `resetOtpExpires` (DateTime) to `User` model in `Backend/prisma/schema.prisma` and synced with `npx prisma db push`.
* **Backend Endpoints (`Backend/routes/auth.js`):**
  - `POST /api/auth/forgot-password`: Generates a 6-digit OTP code, stores it in SQLite with 15-min expiry, and sends an email via `nodemailer`.
  - `POST /api/auth/reset-password`: Validates OTP code, hashes new password with `bcryptjs`, and clears OTP.
* **Frontend UI (`CampusHive/app/(auth)/auth.tsx`):**
  - Hooked up **"Forgot password?"** button to open an OTP Reset Modal with clean step-by-step UI.

### **C. UPI Payment & GPay Deep-Linking Architecture**
* **Location:** `CampusHive/app/earnings.tsx` (`triggerUPIPayment()`)
* **Payment Flow:**
  1. **₹6 Platform Booking Fee:** Paid by Buyer to Admin UPI (`campushive@okaxis` / Admin UPI ID) when order is created (`PENDING` ➔ `IN_PROGRESS`).
  2. **Direct Seller Payout:** Paid by Buyer to Seller's UPI (`order.seller.upiId`) when work is delivered (`DELIVERED` ➔ `COMPLETED`).

### **D. Gated Chat Section (Locked Behind ₹6 Booking Fee)**
* **Requirement:** Buyers CANNOT message freelancers for free. Chat is strictly locked behind placing an order request (paying the ₹6 platform booking fee).
* **Backend Security:** `POST /api/messages` and `GET /api/messages/:userId` verify that an active order exists between sender and receiver. If no active order exists, returns HTTP 403 with `isLocked: true`.
* **Frontend UI:** `CampusHive/app/chats/[id].tsx` renders a locked banner `🔒 Chat Section Locked` and disables text input until an order request (₹6 booking fee) is placed.
* **Roadmap File:** Created `ROADMAP.md` detailing:
  - End-to-end testing checklists (Buyer vs Seller accounts).
  - UI refactoring for `marketplace.tsx` & `index.tsx`.
  - **Razorpay Integration & Escrow Workflow** (using Razorpay Route).
  - **Supabase Image Storage** (`avatars` & `gig-images` buckets).
  - **Production PostgreSQL Database Migration** via Prisma.

### **E. Supabase Cloud Image Storage Integration**
* **Backend Packages:** Installed `@supabase/supabase-js` and `multer`.
* **Upload Endpoint (`Backend/routes/upload.js`):** Built `POST /api/upload` route that receives multipart image uploads via `multer` memory storage buffer, uploads them to Supabase Storage (`avatars` and `gig-images` buckets), and returns public HTTPS URLs.
* **Frontend Helper (`CampusHive/constants/api.ts`):** Created `uploadImage(localUri, bucket)` helper function to send `FormData` uploads to `/api/upload`.
* **Profile & Gig Integration:** Updated `CampusHive/app/(tabs)/profile.tsx` (avatar uploads) and `CampusHive/app/post-service.tsx` (gig cover photo uploads) to save public HTTPS Supabase URLs to the backend database.

---

## ⚠️ 4. Behavioral & Execution Directives
* **User Permission Rule:** ALWAYS ask for user permission before making file modifications or running terminal commands.
* **Dependency Upgrades:** DO NOT manually edit version numbers in `package.json`. Keep Expo SDK 54 versions locked as configured.
* **Running Backend:** Run backend via `npm run dev` or `npx nodemon server.js` in `/Backend`.
* **Running Frontend:** Run frontend via `npx expo start` in `/CampusHive`.

---

## 🎯 5. Quick Resume Checklist for Next Session
1. Start Backend: `cd Backend` ➔ `npm run dev`
2. Start Frontend: `cd CampusHive` ➔ `npx expo start`

---

## 🗓️ 6. Planned Agenda Options for Next Session

- [ ] **Option A: Razorpay Payment Gateway & Escrow Integration (PRIORITY #1)**
  - Install `razorpay` backend package & create `/api/payments/razorpay/create-order` + signature verification endpoints.
  - Connect Razorpay Checkout Modal in frontend (`earnings.tsx`).
  - Set up Razorpay Route to automate escrow holding & seller payouts.

- [ ] **Option B: End-to-End Order & Payment Flow Testing**
  - Register Seller (`seller@cuchd.in`) with custom UPI ID & Buyer (`buyer@cuchd.in`).
  - Test ordering a gig, paying ₹9 booking fee, delivering work, and confirming final seller GPay/Razorpay payment.

- [ ] **Option C: UI & Screen Modernization**
  - Refactor **Explore / Marketplace Screen** (`marketplace.tsx`) & **Home Screen** (`index.tsx`) to use `ModernCard` and clean icons.

- [x] **Option D: Supabase Cloud Database & Storage Setup (COMPLETED)**
  - Connected **Supabase PostgreSQL Database** via Prisma (`npx prisma db push` succeeded).
  - Connected **Supabase Storage** (`avatars`, `gig-images`, `events` buckets) via `POST /api/upload`.

### **F. Professional Hire Request, Accept/Decline & Notification System (COMPLETED)**
* **Database Schema:** Added `Notification` model to `schema.prisma` (`userId`, `title`, `message`, `type`, `relatedId`, `isRead`, `createdAt`).
* **Order Status Machine:** Updated hiring lifecycle: `PENDING` / `PENDING_ACCEPTANCE` ➔ `IN_PROGRESS` (or `DECLINED`) ➔ `DELIVERED` ➔ `COMPLETED`.
* **Backend Endpoints:**
  - `POST /api/orders`: Buyer initiates order with ₹9 booking fee, status set to `PENDING_ACCEPTANCE`, sends `ORDER_REQUEST` alert to seller.
  - `POST /api/orders/:id/accept`: Seller accepts job request, updates status to `IN_PROGRESS`, notifies buyer (`ORDER_ACCEPTED`).
  - `POST /api/orders/:id/decline`: Seller declines job request, updates status to `DECLINED`, notifies buyer (`ORDER_DECLINED`).
  - `GET /api/notifications` & `PUT /api/notifications/:id/read`: Fetches unread count and marks notifications as read.
* **Frontend Components & Screens:**
  - **`NotificationBell.tsx`**: Reusable header component polling `/api/notifications` and displaying real-time red unread counter badges (`🔔 3`) across Home, Marketplace, Earnings, and Profile headers.
  - **`earnings.tsx`**: Seller Manage Orders section features explicit **[ ✅ Accept ]** and **[ ❌ Decline ]** action buttons.
  - **`notifications.tsx`**: Connected live inbox fetching database alerts with pull-to-refresh and mark-all-read.

### **G. Tab Bar Focus: Core Student Marketplace**
* **Active Main Tabs:** Home (`index`), Explore (`marketplace`), Chats (`chats`), Profile (`profile`), Earnings (`earnings`).
* **Secondary Tabs:** `events` and `communities` tabs have `href: null` in `CampusHive/app/(tabs)/_layout.tsx` to keep the application focused 100% on student freelancing, hiring, orders, and payouts.



