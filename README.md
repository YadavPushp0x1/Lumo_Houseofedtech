# Lumo — Mini LMS (Expo + TypeScript)

Mini LMS mobile app built with **React Native Expo**, **Expo Router**, **NativeWind**, **SecureStore**, **AsyncStorage**, and **WebView** using the `https://api.freeapi.app/` public API.

## Features (Assignment Coverage)

- Auth: login/register, SecureStore token storage, auto-restore session, basic refresh-token attempt, logout
- Profile: user details, local avatar update, basic stats (enrolled, bookmarked, average progress)
- Catalog: course list (random products) + instructors (random users), search, pull-to-refresh, bookmark persistence
- Course details: enroll CTA, bookmark toggle, content viewer entry
- WebView: local HTML template, native→web “header” injection, web→native message (Enroll)
- Native: local notifications for bookmark milestone, 24h reminder scheduling on background, offline banner
- Performance: `LegendList` rendering + memoized list items

## Tech Stack

- Expo SDK `~54` + Expo Router
- TypeScript (strict)
- Styling: NativeWind (Tailwind)
- Persistence:
  - `expo-secure-store` for tokens
  - `@react-native-async-storage/async-storage` for app state (bookmarks, enrollments, last opened)
- WebView: `react-native-webview`
- Forms + validation: `react-hook-form` + `zod`

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Testing

Jest + React Native Testing Library:

```bash
npm test
npm run test:coverage
```

Detox (iOS simulator):

```bash
npm run e2e:build:ios
npm run e2e:test:ios
```

## Build (APK / Development Build)

This project is compatible with EAS Build.

```bash
npx expo prebuild
```

Then configure EAS as needed:

```bash
npx eas build -p android --profile development
```

## Environment Variables

None required. API base is hardcoded in `lib/config.ts`.

## Architectural Notes

- Auth tokens are stored in SecureStore (device-only access). User/profile cache is stored in AsyncStorage.
- API requests use a fetch wrapper (`lib/api/http.ts`) with timeout + retry for transient failures.
- Notifications:
  - milestone push (5+ bookmarks) throttled to once per 7 days
  - “open app in 24h” reminder scheduled when app goes background and cancelled when app becomes active

## Known Limitations

- Refresh-token endpoint availability can vary; if refresh fails, the app signs out and prompts re-login.
- Course “progress” is a simple persisted percentage incremented when opening the WebView.

## Screenshots / Demo Video

Add screenshots and a short walkthrough video (3–5 minutes) here.
