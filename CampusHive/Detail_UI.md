# CampusHive — Detailed UI Snapshot & Restoration Blueprint

This document contains the exact specification, design system, layout structure, and configuration of the **CampusHive Mobile App UI**. Refer to this file whenever you need to restore or verify the UI state.

---

## 1. Design System & Theme Tokens (`constants/theme.ts`)

### Color Palette (`Colors`)
| Token | Hex Code / Value | Usage |
|---|---|---|
| `primary` | `#2563EB` | Primary brand blue, buttons, active highlights |
| `primaryLight` | `#DBEAFE` | Soft blue backgrounds, badge fills |
| `primaryDark` | `#1E40AF` | Deep brand blue accents |
| `background` | `#FFFFFF` | Main screen background |
| `surface` | `#F9FAFB` | Card surfaces, container fills |
| `border` | `#E5E7EB` | Subtle card & row dividers |
| `text` | `#1F2937` | Main headings & primary body text |
| `textSecondary` | `#6B7280` | Muted captions, subtext |
| `textTertiary` | `#9CA3AF` | Placeholder text |
| `subtext` | `#9CA3AF` | Secondary metadata |
| `success` | `#10B981` | Positive statuses, registered badges |
| `successLight` | `#D1FAE5` | Green badge backgrounds |
| `warning` | `#F59E0B` | Warning alerts |
| `warningLight` | `#FEF3C7` | Warning badge backgrounds |
| `error` | `#EF4444` | Error states, delete buttons, heart icons |
| `errorLight` | `#FEE2E2` | Error badge backgrounds |
| `info` | `#3B82F6` | Informational badges |
| `infoLight` | `#DBEAFE` | Info badge backgrounds |
| `white` | `#FFFFFF` | White text & cards |
| `black` | `#000000` | Pure black text/icons |
| `disabled` | `#D1D5DB` | Disabled button states |

### Spacing Scale (`Spacing`)
- `xs`: `4`
- `sm`: `8`
- `md`: `12`
- `base`: `16`
- `lg`: `20`
- `xl`: `24`
- `xxl`: `32`
- `xxxl`: `48`

### Border Radii (`BorderRadius`)
- `sm`: `8`
- `md`: `12`
- `lg`: `16`
- `xl`: `20`
- `xxl`: `24`
- `full`: `9999` (Pill / Circular)

### Typography Hierarchy (`Typography`)
- `hero`: `{ fontSize: 32, fontWeight: '800', letterSpacing: -0.5 }`
- `h1`: `{ fontSize: 28, fontWeight: '700' }`
- `h2`: `{ fontSize: 22, fontWeight: '700' }`
- `h3`: `{ fontSize: 18, fontWeight: '600' }`
- `h4`: `{ fontSize: 16, fontWeight: '600' }`
- `body`: `{ fontSize: 15, fontWeight: '400' }`
- `bodySmall`: `{ fontSize: 13, fontWeight: '400' }`
- `caption`: `{ fontSize: 11, fontWeight: '500' }`
- `label`: `{ fontSize: 12, fontWeight: '600' }`

### Drop Shadows (`Shadows`)
- `sm`: `shadowColor: '#000'`, `shadowOffset: { width: 0, height: 1 }`, `shadowOpacity: 0.05`, `shadowRadius: 2`, `elevation: 1`
- `md`: `shadowColor: '#000'`, `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.08`, `shadowRadius: 4`, `elevation: 2`
- `lg`: `shadowColor: '#000'`, `shadowOffset: { width: 0, height: 4 }`, `shadowOpacity: 0.10`, `shadowRadius: 8`, `elevation: 3`

---

## 2. Bottom Navigation Bar (`app/(tabs)/_layout.tsx`)

The bottom navigation bar uses React Navigation / Expo Router `<Tabs>` with 4 visible items and 2 hidden sub-screens:

### Visible Navigation Tabs
1. **Home (`index.tsx`)**: Icon `home` / `home-outline`, Label: `"Home"`
2. **Explore (`marketplace.tsx`)**: Icon `compass` / `compass-outline`, Label: `"Explore"`
3. **Chats (`chats.tsx`)**: Icon `chat-processing` / `chat-processing-outline`, Label: `"Chats"`
4. **Profile (`profile.tsx`)**: Icon `account` / `account-outline`, Label: `"Profile"`

### Hidden Navigation Tabs (`href: null`)
- **`communities.tsx`**: `{ href: null }`
- **`events.tsx`**: `{ href: null }`

### Tab Bar Styling
- `backgroundColor`: `Colors.white` (`#FFFFFF`)
- `borderTopWidth`: `1`, `borderTopColor`: `Colors.border` (`#E5E7EB`)
- `height`: `70 + insets.bottom`
- Active Icon Pill: `backgroundColor: Colors.primary + '12'`, `borderRadius: BorderRadius.md`

---

## 3. Home Screen Structure (`app/(tabs)/index.tsx`)

The Home Screen is organized into the following sequential sections:

### Section 1: Hero Header
- **Greeting Row**: Dynamic greeting ("Good morning" / "Hello" / "Good evening") with icon (`white-balance-sunny` / `hand-wave-outline` / `moon-waning-crescent`).
- **User Block**: First name in bold `h1`, University & Year in `bodySmall`.
- **Right Block**: `<NotificationBell />` icon + `<Avatar uri={userAvatar} size={46} />`.
- **Metrics Row**: 3 cards (*Completed orders*, *Total earnings*, *Average rating*).
- **Primary CTA Buttons**:
  - `[Post Service]` button: `Colors.primaryDark`, `briefcase-plus-outline` icon.
  - `[Create Event]` button: `Colors.primary`, `calendar-plus` icon.

### Section 2: Quick Access Grid
Header: `"Quick Access"`
- Card 1: **Explore services** (`compass-outline`, Blue fill) → `/ (tabs)/marketplace`
- Card 2: **Campus events** (`calendar-blank-outline`, Orange fill) → `/ (tabs)/events`
- Card 3: **Communities** (`account-group-outline`, Green fill) → `/ (tabs)/communities`
- Card 4 (Admin only): **Admin panel** (`shield-crown-outline`, Purple fill) → `/admin`

### Section 3: Trending Events Carousel
Header: `"Trending Events"` → Action: `"See all"`
- Horizontal `<ScrollView>` of event cards.
- Displays event emoji container, registration fee badge (`Free` / `Paid`), title, date/time, venue location, community tag, and registration indicator (`Registered`).

### Section 4: Active Student Services
Header: **`"Active Student Services"`** → Action: `"See all"`
- Horizontal `<ScrollView>` of active student services.
- Data Source: Loads `/gigs` from backend (`liveGigs`).
- Card layout: Seller avatar + verified check badge, Seller Name/Username, Service Title, Category Badge (`variant="info"`), and Price in Rupees (`Rs. {gig.price}`).

### Section 5: Community Pulse
Header: `"Community Pulse"` → Action: `"See all"`
- Discussion cards list featuring community icon, community name, post title, relative time, and heart likes count.

---

## 4. Chat Room Screen (`app/chats/[id].tsx`)

### Key Features & Speed Optimizations
1. **Optimistic Message Sending**: Messages append to state instantly (`setMessages((prev) => [...prev, optimisticMsg])`), input clears immediately (`setDraft('')`), and `FlatList` scrolls smoothly to end.
2. **Direct Payload Updating**: Network call `POST /messages` returns `{ chatMessage }`, which directly replaces the temporary message ID without making an extra `GET /messages/:id` network request.
3. **Preserved Local State Polling**: 3-second background polling merges server history with unsent local messages to prevent UI flickering.
4. **Chat Locking Check**: If `isLocked` is true, displays lock banner requiring ₹6 booking fee.

---

## 5. UI Component Specifications

### Badge Component (`components/ui/Badge.tsx`)
| Variant | Background (`bg`) | Text Color (`text`) |
|---|---|---|
| `pending` | `#FEF3C7` | `#92400E` |
| `in-progress` | `#DBEAFE` | `#1E40AF` |
| `completed` | `#D1FAE5` | `#065F46` |
| `verified` | `#EDE9FE` | `#5B21B6` |
| `free` | `#D1FAE5` | `#065F46` |
| `paid` | `#FEE2E2` | `#991B1B` |
| `info` | `#DBEAFE` | `#1E40AF` |
| `warning` | `#FEF3C7` | `#92400E` |

---

## 6. How to Request UI Restoration

If any future changes alter the UI layout or design, ask:
> *"Please restore the UI using the blueprint in Detail_UI.md"*

All theme variables, section titles, tab layouts, and component structures documented above will be instantly restored.
