# 🐝 onlyStudents — React Native / Expo App

A campus super app for Indian university students built with **Expo Router**, **React Navigation**, and **TypeScript**.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd onlyStudents
npm install
```

### 2. Start the dev server
```bash
npx expo start
```

Then press:
- `i` → iOS Simulator
- `a` → Android Emulator
- Scan QR code → Expo Go on your phone

---

## 📦 Tech Stack

| Library | Purpose |
|---|---|
| `expo` ~51 | Framework |
| `expo-router` | File-based routing |
| `react-navigation` v6 | Stack + Bottom Tabs |
| `expo-linear-gradient` | Gradient backgrounds & buttons |
| `react-native-reanimated` | Entrance animations |
| `react-native-gifted-charts` | Bar chart on Earnings screen |
| `expo-image` | Optimised image component |
| `@expo/vector-icons` (Ionicons) | All icons |
| `@react-native-async-storage/async-storage` | Local persistence |
| `react-native-svg` | Required by gifted-charts |

---

## 📁 Project Structure

```
onlyStudents/
├── app/
│   ├── (auth)/              ← Pre-login screens
│   │   ├── splash.tsx       ← Logo + gradient, auto-nav after 2s
│   │   ├── onboarding.tsx   ← 3-step cards + university selector
│   │   └── auth.tsx         ← Login / Sign Up toggle
│   ├── (tabs)/              ← Bottom tab navigator
│   │   ├── index.tsx        ← Home
│   │   ├── marketplace.tsx  ← Browse freelancers
│   │   ├── communities.tsx  ← Club list
│   │   ├── events.tsx       ← Events feed
│   │   └── profile.tsx      ← User profile + settings
│   ├── marketplace/[id].tsx ← Freelancer detail + order
│   ├── communities/[id].tsx ← Club page + posts feed
│   ├── events/[id].tsx      ← Event detail + registration
│   ├── notifications.tsx    ← Grouped notifications
│   ├── earnings.tsx         ← Bar chart + orders list
│   ├── post-service.tsx     ← Create service form
│   ├── create-event.tsx     ← Create event form
│   ├── admin.tsx            ← Admin panel
│   └── _layout.tsx          ← Root stack navigator
├── components/ui/           ← Reusable component library
│   ├── PrimaryButton.tsx    ← Gradient / outline / ghost
│   ├── Card.tsx             ← Elevated card container
│   ├── Badge.tsx            ← Status badges (pending/in-progress/completed/verified)
│   ├── Avatar.tsx           ← Image or initials fallback
│   ├── SectionHeader.tsx    ← Title + "See all" action
│   └── StarRating.tsx       ← Star display with rating
├── data/
│   └── mockData.ts          ← All mock data (universities, freelancers, communities, events...)
└── constants/
    └── theme.ts             ← Colors, spacing, typography, shadows, gradients
```

---

## 🖥️ All 19 Screens

| # | Screen | File |
|---|---|---|
| 1 | Splash Screen | `app/(auth)/splash.tsx` |
| 2 | Onboarding (3 steps + uni picker) | `app/(auth)/onboarding.tsx` |
| 3 | Auth (Login / Signup) | `app/(auth)/auth.tsx` |
| 4 | Home Tab | `app/(tabs)/index.tsx` |
| 5 | Marketplace Tab | `app/(tabs)/marketplace.tsx` |
| 6 | Freelancer Profile | `app/marketplace/[id].tsx` |
| 7 | Communities Tab | `app/(tabs)/communities.tsx` |
| 8 | Community Page | `app/communities/[id].tsx` |
| 9 | Events Tab | `app/(tabs)/events.tsx` |
| 10 | Event Details | `app/events/[id].tsx` |
| 11 | Notifications | `app/notifications.tsx` |
| 12 | User Profile Tab | `app/(tabs)/profile.tsx` |
| 13 | Earnings + Bar Chart | `app/earnings.tsx` |
| 14 | Post Service (form) | `app/post-service.tsx` |
| 15 | Create Event (form) | `app/create-event.tsx` |
| 16 | Admin Panel | `app/admin.tsx` |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#4F46E5` (Deep Indigo) |
| Secondary | `#7C3AED` (Violet) |
| Accent | `#EC4899` (Pink) |
| Background | `#F8F8FF` |
| Text | `#111827` |
| Subtext | `#6B7280` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Border Radius | 16px cards, 9999px chips |
| Shadows | iOS shadow + Android elevation |

---

## 🔧 Notes for Production

1. **Auth**: Replace mock `setTimeout` in `auth.tsx` with Firebase Auth or Supabase
2. **Data**: Replace `mockData.ts` with API calls (Firestore / Supabase tables)
3. **Images**: Replace `picsum.photos` with Cloudinary / Firebase Storage URLs
4. **Push Notifications**: Add `expo-notifications` for real-time alerts
5. **Payments**: Integrate Razorpay SDK for order payments
6. **Verification**: Add college ID upload flow for freelancer verification

---

## 📱 Supported Platforms

- ✅ iOS (Expo Go + standalone build)
- ✅ Android (Expo Go + APK/AAB)
- ⚠️ Web (limited — some RN-only components)

---

Made with 🧡 for Indian students · onlyStudents v1.0.0
