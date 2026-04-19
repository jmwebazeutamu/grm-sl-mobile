# GRM Sierra Leone — Mobile (Expo)

React Native + Expo client for the GRM system. Talks to the Laravel mobile
API at `http://104.225.218.102:8081/api/v1/mobile` (configurable via
`app.json` → `extra.apiBaseUrl`).

## Status — Session 2 MVP

| Feature | Status |
|---|---|
| Landing (public) — two action cards + staff-login link | ✅ |
| Staff login → Sanctum token | ✅ |
| Dashboard — org stats, recent activity | ✅ |
| Grievances list — search, state chips, infinite scroll, pull-to-refresh | ✅ |
| Grievance detail — overview, location, complainer, timeline | ✅ (read-only) |
| Profile — user info + sign out | ✅ |
| Public track — by reference number | ✅ |
| Public submit — multi-step form | ⏳ next session |
| Action composer — post actions / transitions | ⏳ next session |
| File uploads — camera + gallery | ⏳ next session |
| Offline queue | ⏳ next session |
| Push notifications | ⏳ next session |

## Quick start

```bash
npm install
npx expo start
```

Then:
- Press **`i`** to open the iOS simulator (requires Xcode)
- Press **`a`** to open the Android emulator (requires Android Studio AVD)
- Or scan the QR code with **Expo Go** on a physical device

## Test accounts

The API has a fresh import with 22 users. A few to log in with:

| Username | Role | Org |
|---|---|---|
| `mlebbie` | org-admin | NaCSA |
| `bkamara` | org-admin | FCC |
| `mgbetuwa` | acc-reviewer | ACC |

All created with password `ChangeMe@2026` (rotate in prod).

Public track test reference: `2024/7195` (resolved grievance).

## Stack

- **Expo Router** — file-based navigation
- **NativeWind v4** — Tailwind for React Native
- **TanStack Query v5** — server state + caching
- **Zustand** — auth state, persisted via AsyncStorage
- **Axios** — HTTP client with auto-attach token interceptor
- **expo-secure-store** — stores the Sanctum token
- **@expo/vector-icons** — Ionicons

## Folder structure

```
app/                 file-based routes (Expo Router)
  index.tsx          public landing
  (auth)/login.tsx   staff login
  (public)/…         public-facing screens
  (staff)/…          authenticated tab navigator
components/          reusable UI (Button, Card, StateBadge, SlaDot)
constants/           colors + state labels
hooks/               TanStack Query hooks per endpoint
lib/api.ts           Axios instance + token interceptors
stores/authStore.ts  Zustand auth state
```

## Changing the API URL

Edit `app.json` → `expo.extra.apiBaseUrl`, then restart the dev server
(`npx expo start -c`).

## Known rough edges

- `app/(public)/submit.tsx` is a placeholder — uses the web form until
  Session 3 builds the multi-step flow.
- Assets (`assets/images/icon.png`, `splash.png`, `adaptive-icon.png`)
  need to be added before a store build — Expo ships sensible defaults
  if these are missing during dev.
- The Android emulator cannot reach `localhost` on the host; it's
  configured against the public IP, so development works out of the box.
