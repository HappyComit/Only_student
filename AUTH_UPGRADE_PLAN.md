# 🔐 Auth Upgrade Implementation Plan
## Email Verification + Forgot/Reset Password (Resend-First, Secure Tokens)

> **Last Updated:** September 2, 2026  
> **Project:** OnlyStudents / CampusHive  
> **Status:** ⏳ Pending Execution

---

## 📋 Overview

The existing auth system has OTP-based flows but contains **3 critical security issues**:

| Issue | Current State | Target State |
|---|---|---|
| OTP Storage | ❌ Plain text in DB | ✅ SHA-256 hashed |
| Email Provider | ❌ Gmail SMTP primary (spam-prone) | ✅ Resend primary |
| Forgot Password | ❌ 404 reveals account existence | ✅ Generic 200 always |
| Token Fields | ❌ One shared `resetOtp` field | ✅ Separate fields per flow |

**Frontend impact: ZERO** — all modals, handlers, and cooldown timers already exist in `auth.tsx`.  
This plan is **backend-only** (except `.env` additions).

---

## 🏗️ Architecture After This Plan

```
REGISTRATION FLOW
─────────────────
  User registers
      │
      ▼
  Generate 6-digit OTP     (crypto.randomInt — cryptographically secure)
      │
      ▼
  Hash OTP with SHA-256    (never store raw OTP in DB)
      │
      ▼
  Store HASH in DB         (emailVerificationToken field)
  Store expiry in DB       (emailVerificationExpires field)
      │
      ▼
  Send RAW OTP via Resend  (user enters this code in the app)
      │
      ▼
  User submits OTP
      │
      ▼
  Hash submitted OTP → Compare with stored hash
      │
      ▼
  Match + not expired → set emailVerified=true, clear token fields


FORGOT PASSWORD FLOW
────────────────────
  User submits email
      │
      ▼
  Always return generic 200   (never reveal if account exists)
      │
      ├── If user NOT found → return 200, do nothing
      │
      └── If user found:
              │
              ▼
          Generate OTP → Hash → Store in passwordResetToken
              │
              ▼
          Send RAW OTP via Resend
              │
              ▼
          User submits OTP + new password
              │
              ▼
          Hash OTP → Compare → Check expiry
              │
              ▼
          Match → bcrypt new password → update → clear token (single-use)
```

---

## 📁 Files That Change

| File | Action | Phase |
|---|---|---|
| `Backend/prisma/schema.prisma` | MODIFY — Add 4 new token fields | Phase 1 |
| `Backend/utils/email.js` | **NEW** — Resend email helper module | Phase 2 |
| `Backend/routes/auth.js` | MODIFY — 5 surgical fixes | Phase 3 |
| `Backend/.env` | MODIFY — Add 2 expiry constants | Phase 4 |
| `Backend/.env.example` | MODIFY — Document new vars | Phase 4 |
| `Backend/prisma/schema.prisma` | MODIFY — Remove legacy fields | Phase 5 |

---

---

## ✅ PHASE 1 — Database Schema

**Goal:** Add 4 new secure token fields. Keep old `resetOtp` field untouched for now.

### File: `Backend/prisma/schema.prisma`

Add the following 4 fields inside the `User` model, after the existing `resetOtpExpires` field:

```prisma
// --- NEW: Email Verification (separate from password reset) ---
emailVerificationToken     String?    // SHA-256 hashed OTP (never store raw)
emailVerificationExpires   DateTime?  // When the email verification OTP expires

// --- NEW: Password Reset (separate from email verification) ---
passwordResetToken         String?    // SHA-256 hashed OTP (never store raw)
passwordResetExpires       DateTime?  // When the password reset OTP expires
```

> ⚠️ **DO NOT remove `resetOtp` or `resetOtpExpires` in this phase.** They are removed in Phase 5 only after all flows are confirmed working.

### Migration Command

```bash
cd Backend
npx prisma db push
```

### Phase 1 Verification Checklist

- [ ] `npx prisma db push` exits with no errors
- [ ] Supabase Table Editor shows 4 new nullable columns on the `User` table
- [ ] Existing user records are unaffected (all new columns are `null` by default)

---

---

## ✅ PHASE 2 — Resend Email Service

**Goal:** Create a clean, dedicated Resend-only email helper module. No SMTP fallback for auth emails.

### File: `Backend/utils/email.js` *(NEW FILE)*

This file exports two functions:

```
sendVerificationEmail({ to, otp })
────────────────────────────────
  Uses:     RESEND_API_KEY + RESEND_FROM_EMAIL from .env
  Subject:  "XXXXXX is your OnlyStudents verification code"
  HTML:     Branded card with large OTP display + 15-min expiry note
  Behavior: Throws error on failure (caller catches it)
  Provider: Resend ONLY — no SMTP fallback


sendPasswordResetEmail({ to, otp })
───────────────────────────────────
  Uses:     RESEND_API_KEY + RESEND_FROM_EMAIL from .env
  Subject:  "Reset your OnlyStudents password"
  HTML:     Branded card with OTP + warning that it expires in 15 min
  Behavior: Throws error on failure (caller catches it)
  Provider: Resend ONLY — no SMTP fallback
```

### Environment Variables Used

| Variable | Already in `.env`? | Notes |
|---|---|---|
| `RESEND_API_KEY` | ✅ Yes | Already set to `re_b7bVgtFJ_...` |
| `RESEND_FROM_EMAIL` | ✅ Yes | Currently `onboarding@resend.dev` (sandbox) |

> 📌 **Note:** With `onboarding@resend.dev`, emails can only be sent to the Resend account owner during development. For production delivery to `@cuchd.in` students, a verified custom domain is required — see `RESEND_DOMAIN_SETUP.md`.

### Phase 2 Verification Checklist

- [ ] `require('./utils/email')` works without errors in a test script
- [ ] `sendVerificationEmail({ to: 'your-own@email.com', otp: '123456' })` resolves without throwing
- [ ] Resend dashboard (`resend.com/emails`) shows the email as delivered
- [ ] Email HTML renders correctly (OTP visible, branding correct)

---

---

## ✅ PHASE 3 — Auth Route Fixes (5 Surgical Edits)

**Goal:** Fix 5 specific sections of `Backend/routes/auth.js`. No new routes needed — all endpoints already exist.

---

### Fix 1 — `POST /api/auth/register`

**Lines affected:** ~62–99 in current `auth.js`

**Before (current):**
```js
// Insecure — Math.random OTP stored as plain text in resetOtp field
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

const newUser = await prisma.user.create({
  data: {
    ...
    resetOtp: otp,            // ❌ plain text stored
    resetOtpExpires: expiresAt
  }
});

sendOtpEmail({ to: newUser.email, otp, ... })  // ❌ Gmail SMTP first
```

**After (target):**
```js
// Secure — crypto random OTP, SHA-256 hashed, stored in new field
const rawOtp = crypto.randomInt(100000, 999999).toString();
const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

const newUser = await prisma.user.create({
  data: {
    ...
    emailVerificationToken: hashedOtp,    // ✅ hash stored
    emailVerificationExpires: expiresAt,  // ✅ new field
    // resetOtp and resetOtpExpires are NOT set here anymore
  }
});

sendVerificationEmail({ to: newUser.email, otp: rawOtp })  // ✅ Resend only
  .catch(err => console.error("Async Verification Email Error:", err));
```

---

### Fix 2 — `POST /api/auth/send-verification-otp`

**Lines affected:** ~294–336 in current `auth.js`

**Changes:**
- Generate OTP with `crypto.randomInt` (not `Math.random`)
- Hash with SHA-256 before storing
- Store in `emailVerificationToken` + `emailVerificationExpires` (not `resetOtp`)
- Replace `sendOtpEmail()` call with `sendVerificationEmail()`

---

### Fix 3 — `POST /api/auth/verify-email-otp`

**Lines affected:** ~342–420 in current `auth.js`

**Before (current):**
```js
// ❌ Plain text comparison, wrong field name
if (user.resetOtp !== otp.trim()) { ... }
if (new Date() > new Date(user.resetOtpExpires)) { ... }

await prisma.user.update({
  data: {
    isVerified: true,
    resetOtp: null,         // ❌ wrong field
    resetOtpExpires: null   // ❌ wrong field
  }
});
```

**After (target):**
```js
// ✅ Hash comparison, correct new fields
const hashedIncoming = crypto.createHash('sha256').update(otp.trim()).digest('hex');

if (!user.emailVerificationToken || user.emailVerificationToken !== hashedIncoming) {
  return res.status(400).json({ error: "Incorrect verification code." });
}
if (new Date() > new Date(user.emailVerificationExpires)) {
  return res.status(400).json({ error: "Verification code has expired." });
}

await prisma.user.update({
  data: {
    isVerified: true,
    emailVerified: true,
    emailVerificationToken: null,    // ✅ clear after use (single-use)
    emailVerificationExpires: null   // ✅ clear after use
  }
});
```

---

### Fix 4 — `POST /api/auth/forgot-password`

**Lines affected:** ~426–465 in current `auth.js`

**Before (current):**
```js
// ❌ SECURITY BUG — reveals whether account exists
const user = await prisma.user.findUnique({ where: { email: ... } });
if (!user) {
  return res.status(404).json({ error: "No user found with this email address." });
}
// ... then sends OTP with Math.random into resetOtp field
```

**After (target):**
```js
// ✅ Secure — always return generic 200
const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

// Always return the same generic response (never reveal account existence)
const GENERIC_RESPONSE = {
  message: "If an account exists with this email, a password reset code has been sent."
};

if (!user) {
  return res.json(GENERIC_RESPONSE); // 200 — no info leak
}

const rawOtp = crypto.randomInt(100000, 999999).toString();
const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

await prisma.user.update({
  where: { id: user.id },
  data: {
    passwordResetToken: hashedOtp,    // ✅ hash only
    passwordResetExpires: expiresAt   // ✅ new field
  }
});

sendPasswordResetEmail({ to: user.email, otp: rawOtp })
  .catch(err => console.error("Password Reset Email Error:", err));

return res.json(GENERIC_RESPONSE); // ✅ same response either way
```

---

### Fix 5 — `POST /api/auth/reset-password`

**Lines affected:** ~471–512 in current `auth.js`

**Before (current):**
```js
// ❌ Takes email + otp + newPassword. Compares plain text. Uses resetOtp field.
const { email, otp, newPassword } = req.body;
if (user.resetOtp !== otp.trim()) { ... }
if (new Date() > new Date(user.resetOtpExpires)) { ... }
await prisma.user.update({ data: { passwordHash, resetOtp: null, resetOtpExpires: null }});
```

**After (target):**
```js
// ✅ Takes email + otp + newPassword. Compares hash. Uses new field.
const { email, otp, newPassword } = req.body;

const hashedIncoming = crypto.createHash('sha256').update(otp.trim()).digest('hex');

if (!user.passwordResetToken || user.passwordResetToken !== hashedIncoming) {
  return res.status(400).json({ error: "Invalid or expired reset code." });
}
if (new Date() > new Date(user.passwordResetExpires)) {
  return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
}

const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(newPassword, salt);

await prisma.user.update({
  where: { id: user.id },
  data: {
    passwordHash,
    passwordResetToken: null,    // ✅ single-use: clear after success
    passwordResetExpires: null   // ✅ clear after success
  }
});
```

### Phase 3 Verification Checklist

- [ ] **Register** → OTP email arrives via Resend → enter code → account verified
- [ ] **Resend OTP** → click "Resend" → new OTP arrives → old OTP is rejected ✅
- [ ] **Forgot Password (real email)** → returns 200 generic message → OTP arrives via Resend
- [ ] **Forgot Password (fake email)** → returns same 200 generic message → no email sent (no account leak)
- [ ] **Reset Password** → enter OTP + new password → success message
- [ ] **Reset Password (replay)** → enter same OTP again → rejected (single-use confirmed)

---

---

## ✅ PHASE 4 — Environment Variables

**Goal:** Add two expiry duration constants so they can be tuned without code changes.

### File: `Backend/.env`

Add these two lines:

```env
# Auth Token Expiry Durations (milliseconds)
EMAIL_VERIFICATION_EXPIRES_MS=900000
PASSWORD_RESET_EXPIRES_MS=900000
```

*(900000 ms = 15 minutes — matches existing behavior)*

### File: `Backend/.env.example`

Add same lines (for documentation):

```env
# Auth Token Expiry Durations (milliseconds)
EMAIL_VERIFICATION_EXPIRES_MS=900000
PASSWORD_RESET_EXPIRES_MS=900000
```

> 📌 `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are **already in both files** — no changes needed there.

### Phase 4 Verification Checklist

- [ ] Server restarts without any "missing environment variable" errors
- [ ] `process.env.EMAIL_VERIFICATION_EXPIRES_MS` returns `"900000"` in a test log

---

---

## ✅ PHASE 5 — Legacy Cleanup

**Goal:** Remove the old plain-text OTP fields from the schema now that all flows use the new secure fields.

> ⚠️ **Only execute this phase AFTER Phase 3 is fully tested end-to-end.**

### Step 1 — Search for any remaining references

Before touching the schema, run this search in `routes/auth.js`:

```bash
grep -n "resetOtp" Backend/routes/auth.js
```

Expected output: **zero matches**. If any appear, fix them first.

### Step 2 — Remove from schema

**File: `Backend/prisma/schema.prisma`**

Delete these two lines from the `User` model:
```prisma
resetOtp         String?
resetOtpExpires  DateTime?
```

### Step 3 — Push migration

```bash
cd Backend
npx prisma db push
```

### Phase 5 Verification Checklist

- [ ] `grep -n "resetOtp" Backend/routes/auth.js` → zero results
- [ ] `npx prisma db push` exits with no errors
- [ ] Supabase Table Editor confirms `resetOtp` and `resetOtpExpires` columns are gone
- [ ] All 5 auth flows still work end-to-end after cleanup

---

---

## 🔒 Security Properties: Before vs After

| Property | Before | After |
|---|---|---|
| OTP storage in DB | ❌ Plain text `Math.random()` | ✅ SHA-256 hashed `crypto.randomInt()` |
| Email provider | ❌ Gmail SMTP primary (spam risk) | ✅ Resend primary (DKIM/SPF/DMARC) |
| Forgot-password leak | ❌ `404` reveals account exists | ✅ Generic `200` always |
| Token field separation | ❌ Shared `resetOtp` for both flows | ✅ `emailVerificationToken` + `passwordResetToken` |
| Single-use enforcement | ⚠️ Cleared on success | ✅ Explicitly nulled after use |
| Token expiry | ✅ 15 min | ✅ 15 min (maintained) |
| Password hashing | ✅ bcrypt (10 rounds) | ✅ Unchanged |
| Rate limiting | ✅ Per-email `authRateLimiter` | ✅ Unchanged |

---

## 🚀 New Routes Added

**None.** All 5 endpoints already exist. Only their internals change.

---

## 📌 Notes & Caveats

1. **Resend Sandbox Limitation:** Until a custom domain is verified (see `RESEND_DOMAIN_SETUP.md`), Resend can only deliver to the account owner's email. Plan your testing accordingly.

2. **Existing Users:** Users registered before this upgrade will have `emailVerificationToken = null`. They won't need re-verification — their `isVerified` flag is already set.

3. **No JWT Changes:** The JWT payload and cookie setup are untouched. Existing logged-in users won't be logged out.

4. **No Frontend Changes:** The `auth.tsx` modals, `handleRequestOtp`, `handleResetPassword`, `handleVerifyOtp`, and `handleResendOtp` functions already call the correct endpoints with the correct payloads.
