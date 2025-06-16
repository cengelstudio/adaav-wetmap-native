# AdaAv: Sulak Haritası (Native)

AdaAv is a secure, user-friendly, and modern land marking and tracking application developed for the Cyprus Hunting Federation and authorized institutions in the Turkish Republic of Northern Cyprus (TRNC).
The app allows users to mark, filter, and manage key locations such as wetlands and hunting depots on an interactive map.

## Features

- Interactive map with location markers (wetlands, depots, etc.)
- Add, edit, and delete locations
- User authentication (JWT-based)
- CSV export of locations
- Directions to locations via device map apps
- Role-based access (Federation Officer, State Officer, Authorized Person)
- Modern, mobile-first UI

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example config file and fill in your real API settings:

```bash
cp constants/Config.example.ts constants/Config.ts
```

Edit `constants/Config.ts` and set your API URL and other sensitive settings:

```ts
// constants/Config.ts
export const API_BASE_URL = "http://your-api-url/api";
```

> **Note:** The real `Config.ts` is ignored by git for security. Never commit your real API keys or URLs.

### 3. Start the app

```bash
npx expo start
```

You can also use:
- `npm run android` — Run on Android device/emulator
- `npm run ios` — Run on iOS simulator
- `npm run web` — Run in browser

## Project Structure

- `app/` — Main application screens and navigation
- `components/` — Reusable UI components
- `constants/` — Color palette and configuration (Config.ts)
- `services/` — API service layer (axios)
- `types/` — TypeScript types and interfaces
- `assets/` — App icons, splash, and static assets
- `context/` — React context providers (e.g., Auth)
- `hooks/` — Custom React hooks

## Configuration Example

`constants/Config.example.ts`:
```ts
// This file is for example purposes. Copy as Config.ts and fill in your real settings.
export const API_BASE_URL = "";
```
