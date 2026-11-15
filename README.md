# Mensa KA for iOS

An iOS and iPadOS app for browsing Karlsruhe university canteen menus, built with **Expo SDK 58**, **Expo Router**, **SwiftUI (`@expo/ui`)**, and **iOS Liquid Glass**.

> **API Credit:** This app is powered by the GraphQL backend from **[kronos-et-al/MensaApp](https://github.com/kronos-et-al/MensaApp)** (`https://api.mensa-ka.de/`). Huge thanks to the MensaApp maintainers for building and operating such a clean, rich, and reliable API!

<p align="center">
  <img src="assets/screenshot-iphone.png" alt="Mensa KA running on iPhone" width="360" />
</p>

---

## Features

- **Native iOS & iPadOS UI**: Uses `NativeTabs` (`sidebarAdaptable` on iPadOS), native navigation headers and toolbars (`Stack.Toolbar`), Liquid Glass surfaces and interactive controls (`@expo/ui/swift-ui` `GlassEffectContainer` + `glassEffect` and `expo-glass-effect`, with automatic Reduce Transparency fallback), SF Symbols (`expo-symbols`), and haptic feedback (`expo-haptics`).
- **Adaptive iPad & Multitasking Layout**: Scales automatically between single-column layouts on iPhone / Slide Over and centered two-column meal grids on iPad and wide Split View windows (`portrait` and `landscape`), with centered section headers and centered meal detail photo galleries.
- **Daily Menus & Quick Date Navigation**:
  - Browse meals grouped by serving line (automatically stripping redundant `"11-14 Uhr"` suffixes).
  - Swipe left/right across the menu or tap the 5-day week strip (`WeekStrip`) to switch weekdays, plus a one-tap shortcut to jump back to today.
  - Open the graphical SwiftUI calendar modal to pick any date, advance by a week, or return to today (with optional weekend skipping).
- **Dietary Filters & Price Tiers**: Filter by **Vegan**, **Vegetarian**, and **Favorites**, and switch prices between **Student**, **Employee**, **Pupil**, and **Guest**.
- **Scoped Meal Search**: Search dishes and serving lines within the currently selected canteen via the dedicated **Search** tab on iPhone or the integrated top-right search bar (`Stack.SearchBar`) on iPad.
- **Favorites with Offline Snapshots**: Save favorite dishes locally; meals not served on the selected date remain visible under *Saved for Other Days* with their last seen date.
- **Customizable Meal Detail Page**:
  - Multi-photo gallery and full-screen pinch-to-zoom, swipe-to-dismiss photo viewer (`lightbox`) displaying the serving line, full meal name, thumbnail strip, and native iOS share sheet.
  - Detailed cards for **Prices**, **Nutrition Facts**, **Included / Available Sides**, **Allergens & Additives**, **Environmental Impact** (CO₂ emissions & water usage), and **Meal Statistics** (*Last Served*, *Next Served*, *Times Served in the Last 3 Months*, and *New* badge).
  - Reorder and toggle individual detail sections via **Settings → Meal Detail Page → Sections & Order** using native drag-and-drop editing.
- **English & German Localization**: Follows the iOS system language by default (`System`) and can be switched between **Deutsch** and **English** in **Settings → Appearance**.
- **Themes, Custom API Endpoint & Offline Cache**: Supports `System`, `Light`, and `Dark` themes, runtime GraphQL endpoint overrides (configurable under **Settings → API & Cache** in German or **Settings → Data & Offline Cache** in English, with one-tap reset to `api.mensa-ka.de`), persistent menu caching (`@tanstack/react-query-persist-client` + `AsyncStorage`), disk image caching (`expo-image`), and one-tap cache clearing.

---

## Installation

Mensa KA requires **iOS or iPadOS 16.4+** and is distributed as an unsigned `.ipa` without paid Apple Developer entitlements (`ITSAppUsesNonExemptEncryption: false`).

1. Obtain `MensaKA-unsigned.ipa`:
   - Download it from the repository's **Releases** (if published) or from the latest **Actions → Build Unsigned iOS IPA** workflow run artifact (`MensaKA-unsigned-Release-ipa`).
   - Or trigger **Build Unsigned iOS IPA** manually from the **Actions** tab (choose `Release` for standalone offline use, or `Debug` to connect to a local Metro dev server).
2. Install `MensaKA-unsigned.ipa` on your iPhone or iPad using one of the following methods:
   - **Free Apple ID**: Sideload with **AltStore**, **SideStore**, or **LiveContainer** (no paid Apple Developer account required).
   - **Paid / Bought Apple ID Certificates**: Sign and install with your own paid Apple Developer certificate or a signing app/service (e.g., **Feather**, **ESign**, **GBox**, or **Sideloadly**).
   - **TrollStore**: Permanently install directly on supported iOS/iPadOS versions via **TrollStore** with no 7-day re-signing limit.
   - **AppSync Unified**: Install directly on jailbroken devices equipped with **AppSync Unified** (e.g., via **Filza** or **Sideloadly**).

---

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (`~58.0.0`), [React Native](https://reactnative.dev/) (`0.88.1`), [React](https://react.dev/) (`19.3.0`), [TypeScript](https://www.typescriptlang.org/)
- **Navigation & Native UI**: `expo-router`, `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-haptics`
- **Gestures, Animations & Media**: `react-native-gesture-handler`, `react-native-reanimated`, `expo-image`, `expo-web-browser`
- **Data & Persistence**: `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@react-native-async-storage/async-storage`, `expo-secure-store`

---

## Project Structure

```text
mensa-ka-ios/
├── app/
│   ├── _layout.tsx                 # Root stack, theme & query persistence providers
│   ├── +not-found.tsx              # Localized 404 fallback screen
│   ├── calendar-modal.tsx          # SwiftUI graphical DatePicker form sheet
│   ├── lightbox.tsx                # Fullscreen zoomable & swipeable photo viewer
│   ├── meal/[id].tsx               # Meal detail screen (customizable sections)
│   └── (tabs)/
│       ├── _layout.tsx             # Adaptive NativeTabs layout (Search tab on iPhone)
│       ├── (menu)/                 # Daily menu tab (+ integrated iPad search bar)
│       ├── favorites/              # Favorites tab
│       ├── search/                 # Canteen-scoped meal search tab (iPhone)
│       └── settings/               # SwiftUI Settings + Detail Sections reorder editor
├── components/                     # Shared UI (MealCard, WeekStrip, FilterBar, GlassSurface, ResponsiveGridRow, ...)
├── constants/                      # Theme palette, localization (EN/DE), detail section metadata
├── lib/
│   ├── api/                        # GraphQL client & queries
│   ├── query/                      # TanStack Query client & AsyncStorage persister
│   ├── storage/                    # Preferences, favorites & client ID storage
│   └── utils/                      # Date, formatting, responsive layout, and meal helpers
├── scripts/
│   └── frame-screenshot.mjs        # Embeds a real iOS Simulator screenshot into an iPhone bezel
├── store/
│   └── MensaContext.tsx            # App state, preferences, localization, favorites & queries
├── types/
│   └── mensa.ts                    # TypeScript models
└── .github/workflows/
    └── build-ios-ipa.yml           # CI workflow: unsigned .ipa build and v* tag GitHub Releases
```

---

## Getting Started

### Prerequisites

- **Node.js** `22` (matching CI) and `npm`
- **macOS with Xcode & CocoaPods** if building the native iOS project locally (not required for TypeScript checks or GitHub Actions CI builds)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Optional: configure a custom GraphQL endpoint (defaults to `https://api.mensa-ka.de/`):
   ```bash
   cp .env.example .env
   ```
   ```env
   EXPO_PUBLIC_API_URL=https://api.mensa-ka.de/
   ```

3. Run the TypeScript typecheck:
   ```bash
   npx tsc --noEmit
   ```

4. Start the Metro dev server (for use with a sideloaded `Debug` / `expo-dev-client` build):
   ```bash
   npx expo start --dev-client
   ```

---

## Building & Releases (CI)

The repository includes [`.github/workflows/build-ios-ipa.yml`](.github/workflows/build-ios-ipa.yml) (`Build Unsigned iOS IPA`), running on GitHub Actions (`xcode-27` on Apple Silicon):

1. Triggers automatically on pushes to `main` and version tags (`v*`), or manually via **Actions → Build Unsigned iOS IPA → Run workflow**.
2. Choose the Xcode build configuration:
   - **`Release`** *(default)*: Standalone app with an embedded offline JavaScript bundle.
   - **`Debug`**: Development client build with `expo-dev-client` for connecting to a local Metro server over Wi-Fi.
3. Builds `MensaKA-unsigned.ipa` and uploads the `MensaKA-unsigned-<configuration>-ipa` artifact (see [Installation](#installation) above for sideloading options).
4. **GitHub Releases (`v*` tags)**: When a version tag like `v1.0.0` is pushed, the workflow automatically creates or updates a GitHub Release with `MensaKA-unsigned.ipa` attached.

To frame a raw simulator screenshot manually:

```bash
node scripts/frame-screenshot.mjs path/to/raw-simulator.png assets/screenshot-iphone.png
```

---

## Credits & Acknowledgments

- **Mensa KA API**: All canteen schedules, meal details, images, nutritional values, allergens, environmental metrics, and meal statistics are served by the GraphQL API from **[https://github.com/kronos-et-al/MensaApp](https://github.com/kronos-et-al/MensaApp)**. Thank you for creating and maintaining this awesome API!

---

## License

Licensed under the [MIT License](LICENSE).
