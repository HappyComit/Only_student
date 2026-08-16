# 📝 File Changes Tracker

## 🎯 Completed UI & Feature Changes

1. **[x] Change Login Page UI**:
   - Modernized `CampusHive/app/(auth)/auth.tsx` with rich dark-mode glassmorphism, multi-orb motion mesh background, glowing ambient badges, electric royal blue CTA button, and clean logo-free branding.

2. **[x] Dark Mode Enabled & Capitalized Branding**:
   - Built a midnight dark theme backdrop (`#06152E` → `#0F2952` → `#1E3A8A`) for the authentication experience.
   - Updated title branding to **OnlyStudent** with capital 'O'.

3. **[x] Story-Style Onboarding Cards (`onboarding.tsx`)**:
   - Built Apple/Instagram story-style onboarding slides with top progress bars, frosted glass cards, and tap-to-navigate gestures.
   - Original code safely backed up in `CampusHive/app/(auth)/onboarding.tsx.bak`.

---

## 📌 Pending Requested Tasks

1. **[x] Add Phone Number Field on Sign-Up**:
   - Added Phone Number input box on Sign-Up screen (`auth.tsx`).
   - Added `phone String?` in Prisma database schema (`schema.prisma`) & ran `npx prisma db push`.
   - Displayed student phone numbers in Web Admin Console (`admin.html` & `admin.js`) with search filter & CSV export.

2. **[x] API Rate Limiting**:
   - Added `express-rate-limit` middleware (10 req / 5 min per email) on `/api/auth/login` and `/api/auth/forgot-password`.
   - Protects against brute-force and OTP spam while keeping campus Wi-Fi safe (keyed per user email).

3. **[x] User-Facing Alert Cleanups**:
   - Removed all developer/internal infrastructure wording ("with Supabase Cloud Storage photo") from post-service and profile photo upload alerts.

4. **[x] Unread Chat Badges (Per-Chat + Bottom Nav)**:
   - Fixed `Backend/routes/messages.js`: changed `isRead: true` → `isRead: false` on message creation so new messages are correctly counted as unread.
   - Fixed `CampusHive/app/(tabs)/chats.tsx`: changed `unreadCount: 0` → `unreadCount: thread.unreadCount || 0` to use real API data.
   - Per-chat green badge, bottom nav tab badge, hero stats, and "Unread" filter all now work with real-time Socket.IO updates.

---

### ↺ How to Undo Changes (Instant Revert)
If you ever want to get back to original files:
- **Auth Page:** `copy /Y "CampusHive/app/(auth)/auth.tsx.bak" "CampusHive/app/(auth)/auth.tsx"`
- **Onboarding Page:** `copy /Y "CampusHive/app/(auth)/onboarding.tsx.bak" "CampusHive/app/(auth)/onboarding.tsx"`
