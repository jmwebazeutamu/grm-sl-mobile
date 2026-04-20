# GRM Sierra Leone — Mobile (Expo)

React Native + Expo client for the GRM system. Talks to the Laravel mobile
API at `https://grm-sl.quasar.ug/api/v1/mobile` (configurable via
`app.json` → `extra.apiBaseUrl`).

## Status

| Feature | Status |
|---|---|
| Landing (public) — two action cards + staff-login link | ✅ |
| Staff login → Sanctum token | ✅ |
| Dashboard — org stats, recent activity | ✅ |
| Grievances list — search, state chips, infinite scroll, pull-to-refresh | ✅ |
| Grievance detail — overview, location, complainer, timeline | ✅ |
| Action composer — post actions + resolve/escalate | ✅ |
| Decision bar — accept/reject, closure review, close, escalate | ✅ |
| Profile — user info + sign out | ✅ |
| Public track — by reference number | ✅ |
| Public submit — multi-step form + success screen | ✅ |
| Assign officer | ⏳ needs officers-list endpoint |
| File uploads — camera + gallery | ⏳ next session |
| Offline queue | ⏳ next session |
| Push notifications | ⏳ next session |

## Daily workflow (after first setup)

Every time you want to work on the app:

```bash
# 1. Emulator — launch from Android Studio → Device Manager → ▶
#    Wait for the home screen to appear.

# 2. Verify the emulator is online
adb devices
# should print: emulator-5554   device

# 3. Pull the latest code
cd ~/grm-sl-mobile
git pull

# 4. Start the Expo dev server
npx expo start

# 5. Press 'a' in the Expo terminal to open on the emulator
```

If `adb` says `device offline`, wait 15s and re-run. If Expo complains about
a missing development build, rebuild once:

```bash
npx expo run:android
```

Then you're back to `expo start` + `a` for subsequent days.

## First-time setup

```bash
git clone git@github.com:jmwebazeutamu/grm-sl-mobile.git
cd grm-sl-mobile
npm install
npx expo prebuild --clean   # regenerates android/ + ios/
npx expo run:android        # or run:ios
```

### Prerequisites
- Node 20+
- On Mac: Xcode + Xcode Command Line Tools + Watchman
- Android Studio with the emulator booted AND **Android SDK 34+** installed
  (Android Studio → Tools → SDK Manager → tick "Show Package Details" →
  tick "Android SDK Platform 34" → Apply)
- `adb` on your PATH:
  ```bash
  echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
  echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator' >> ~/.zshrc
  source ~/.zshrc
  ```

A `.npmrc` with `legacy-peer-deps=true` ships with the repo — required
for SDK 55 until its dependency graph stabilises.

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
