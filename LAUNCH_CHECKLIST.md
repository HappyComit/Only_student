# 🚀 CampusHive — Pre-Launch Checklist

> **Strategy**: Launch to ONE college first. Get 20 real students. Fix what breaks. Then expand.
> Narrow and perfect beats wide and broken.

---

## 🔴 CRITICAL — App Cannot Launch Without These

### Core Hiring Flow
- [x] Test full hire flow (Buyer hires → pays ₹6 → Seller gets notification → opens Chat → Accept/Decline)
- [x] Verify Accept/Decline banner appears correctly in Chat for all order states
- [x] Verify buyer sees "Waiting for seller to accept..." banner in Chat
- [x] Verify seller gets notified after buyer accepts/declines
- [x] Verify chat unlocks immediately after seller accepts
- [x] Verify locked chat message shows correctly before ₹6 payment
- [ ] Test on both Android and iOS devices
- [ ] Test on slow 3G / bad network — make sure app doesn't crash or freeze

### Payments — Go Live
- [ ] Complete Razorpay KYC (student ID or business registration)
- [ ] Switch Razorpay from **test mode → live mode** in production environment
- [ ] Set Razorpay live keys in Render environment variables (never in code)
- [ ] Test one real ₹6 transaction end-to-end
- [ ] Confirm money reaches your Razorpay account
- [x] Set up refund policy — what happens if seller declines after buyer paid ₹6?

### Legal Pages (Required by Razorpay & App Stores)
- [x] Write and publish a **Privacy Policy** page
- [x] Write and publish **Terms & Conditions** page
- [x] Write and publish **Refund Policy** page
- [x] Add links to all three pages in the app's settings/profile screen

### App Distribution
- [ ] Build a production **Android APK / AAB** with `eas build`
- [ ] Test the production build on a real Android phone (not just Expo Go)
- [ ] Build **iOS TestFlight** build (if targeting iOS users)
- [ ] Either publish to **Google Play Store** OR share direct APK download link
- [ ] Set up proper app icon and splash screen (no placeholder)
- [ ] Set app name to "CampusHive" (not "Expo" or default)

---

## 🟡 IMPORTANT — Needed Within First Week of Launch

### Onboarding
- [ ] Add a 3-screen onboarding flow on first app launch:
  - Screen 1: "Post your skill → Get discovered"
  - Screen 2: "Hire a fellow student → Pay securely"
  - Screen 3: "Chat, Deliver, Earn → Build your college portfolio"
- [ ] Add a "Skip" button on onboarding
- [ ] Show onboarding only once (save flag in AsyncStorage)

### Error Handling & Stability
- [ ] Add proper error messages when API calls fail (not silent crashes)
- [ ] Add loading spinners wherever data is being fetched
- [ ] Handle no-internet connection gracefully (show offline message)
- [ ] Handle session expiry — auto redirect to login when token expires
- [ ] Add try/catch in all critical payment and order API calls
- [ ] Test app crash scenarios — what happens if backend is down?

### Profile & Trust
- [ ] Make profile photo upload mandatory before posting a service
- [ ] Add college email verification (e.g. must end in .edu or college domain)
- [ ] Add a "Profile Completion %" indicator to encourage complete profiles
- [ ] Add skills tags to profiles (e.g. "Web Dev", "Graphic Design", "Writing")

### Push Notifications
- [ ] Integrate **Firebase Cloud Messaging (FCM)** for real push notifications
- [ ] Currently notifications only show inside the app — if app is closed, seller won't know
- [ ] Send push notification when: new hire request, order accepted, order declined, new message
- [ ] Ask for notification permission on app launch (with explanation of why)

---

## 🟢 NICE TO HAVE — Post-Launch Polish

### Discovery & Growth
- [ ] Add search/filter on Marketplace (by skill, price range, college)
- [ ] Add "Featured" or "Top Rated" section for gigs with good reviews
- [ ] Add share button on gig pages (so students can share their service on WhatsApp/Instagram)
- [ ] Add referral system: "Invite a friend → Both get ₹10 credit"

### Trust & Safety
- [ ] Add report/block feature for bad users
- [ ] Add admin dashboard to monitor suspicious activity
- [ ] Add ID verification for sellers (college ID upload)
- [ ] Build dispute resolution flow (what happens when buyer and seller disagree?)

### Revenue
- [ ] Decide final commission structure (currently ₹6 flat fee — is that sustainable?)
- [ ] Consider adding: Featured listing fee, Premium seller badges, % commission on full gig price
- [ ] Track revenue metrics in admin dashboard

### UX Improvements
- [ ] Add dark mode
- [ ] Add rating & review system (currently basic)
- [ ] Add order progress tracker (Pending → Accepted → In Progress → Delivered → Completed)
- [ ] Add delivery file upload (seller uploads work files when done)
- [ ] Add "Request Revision" button for buyers

---

## 📊 Launch Day Targets (First 30 Days)

| Metric | Target |
|---|---|
| Registered users | 50+ |
| Gigs posted | 20+ |
| Successful orders | 10+ |
| College campuses | 1 (your own) |
| Bugs reported | Fix within 24hrs |

---

## 🎯 Go-To-Market Plan

1. **Week 1**: Get 5 friends to post real gigs. You personally hire 2-3 of them to test the full flow with real money.
2. **Week 2**: Share in your college WhatsApp groups. Offer first 10 sellers "zero commission for 1 month".
3. **Week 3**: Ask every seller to share their CampusHive gig link on their Instagram story.
4. **Week 4**: Count orders, fix bugs, talk to every user personally. Ask: "What confused you? What would make you use this more?"
5. **Month 2**: Expand to one more college based on what you learned.

---

> **Remember**: A buggy app with 5 loyal users is better than a polished app with 0 users.
> Launch small. Learn fast. Fix quickly.
