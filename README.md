# Mensa KA for iOS

A native Swift and SwiftUI app for iOS and iPadOS to browse Karlsruhe university canteen menus, built as a dependency-free Swift Package Manager project with **xtool** and **iOS Liquid Glass**.

> **API Credit:** This app is powered by the GraphQL backend from **[kronos-et-al/MensaApp](https://github.com/kronos-et-al/MensaApp)** (`https://api.mensa-ka.de/`). Huge thanks to the MensaApp maintainers for building and operating such a clean, rich, and reliable API!

<p align="center">
  <img src="assets/screenshot-iphone.png" alt="Mensa KA running on iPhone" width="360" />
</p>

---

## Features

- **Native SwiftUI & Liquid Glass UI**: Built directly with Apple's SwiftUI frameworks: adaptive `TabView` (`.sidebarAdaptable` on iPadOS, dedicated `Tab(role: .search)` on iPhone, `.tabBarMinimizeBehavior(.onScrollDown)` on iOS 26+), native navigation toolbars, interactive `GlassEffectContainer` & `.glassEffect(...)` controls on iOS 26+ (with automatic Reduce Transparency and iOS 17/18 fallbacks), SF Symbols, and tactile haptics.
- **Adaptive iPad & Multitasking Layout**: Scales cleanly between single-column layouts on iPhone / Slide Over and centered two-column `LazyVGrid` grids on iPad and wide Split View windows (`portrait` and `landscape`), with centered section headers and adaptive photo galleries.
- **Daily Menus & Quick Date Navigation**:
  - Browse meals grouped by serving line (automatically stripping redundant `"11-14 Uhr"` suffixes).
  - Swipe left/right across the menu or tap the 5-day week strip (`WeekStripView`) to switch weekdays, plus a one-tap shortcut to jump back to today.
  - Open the graphical SwiftUI calendar modal (`DatePicker`) to pick any date, advance by a week, or return to today (with optional weekend skipping).
- **Dietary Filters & Price Tiers**: Filter by **Vegan**, **Vegetarian**, and **Favorites**, and switch prices between **Student**, **Employee**, **Pupil**, and **Guest**.
- **Scoped Meal Search**: Search dishes and serving lines within the currently selected canteen via the dedicated **Search** tab on iPhone or the integrated `.searchable` toolbar field on iPad.
- **Favorites with Offline Snapshots**: Save favorite dishes locally; meals not served on the selected date remain visible under *Saved for Other Days* with their last seen date.
- **Customizable Meal Detail Page**:
  - Multi-photo gallery and full-screen pinch-to-zoom, swipe-to-dismiss photo viewer (`LightboxView`) displaying the serving line, full dish name, thumbnail strip, and native iOS `ShareLink`.
  - Detailed cards for **Prices**, **Nutrition Facts**, **Included / Available Sides**, **Allergens & Additives**, **Environmental Impact** (CO₂ emissions & water usage), and **Meal Statistics** (*Last Served*, *Next Served*, *Times Served in the Last 3 Months*, and *New* badge).
  - Reorder and toggle individual detail sections via **Settings → Meal Detail Page → Sections & Order** using native drag-and-drop editing.
- **English & German Localization**: Follows the iOS system language by default (`System`) and can be switched between **Deutsch** and **English** in **Settings → Appearance**.
- **Themes, Custom API Endpoint & Offline Cache**: Supports `System`, `Light`, and `Dark` themes, runtime GraphQL endpoint overrides in Settings (with one-tap reset to `api.mensa-ka.de`), persistent disk offline caching (`Caches/MensaKA/`), disk + memory image caching, Keychain client ID storage, and one-tap cache clearing.

---

## Installation

Mensa KA requires **iOS or iPadOS 17.0+** (with Liquid Glass features active on **iOS/iPadOS 26.0+**) and is distributed as an unsigned `.ipa` without paid Apple Developer entitlements (`ITSAppUsesNonExemptEncryption: false`).

1. Obtain `MensaKA-unsigned.ipa`:
   - Download it from the repository's **Releases** or from a **Actions → Build Unsigned iOS IPA** workflow run artifact (`MensaKA-unsigned-release-ipa`).
   - Or build and install locally from Windows (WSL2), Linux, or macOS with **xtool**.
2. Install `MensaKA-unsigned.ipa` on your iPhone or iPad using one of the following methods:
   - **xtool / Free Apple ID**: Deploy directly over USB with `xtool dev`, or sideload with **AltStore**, **SideStore**, or **LiveContainer** (no paid Apple Developer account required).
   - **Paid / Bought Apple ID Certificates**: Sign and install with your own paid Apple Developer certificate or a signing app/service (e.g., **Feather**, **ESign**, **GBox**, or **Sideloadly**).
   - **TrollStore**: Permanently install directly on supported iOS/iPadOS versions via **TrollStore** with no 7-day re-signing limit.
   - **AppSync Unified**: Install directly on jailbroken devices equipped with **AppSync Unified** (e.g., via **Filza** or **Sideloadly**).

---

## Tech Stack

- **Language & UI**: Pure **Swift 6** & **SwiftUI** (zero third-party SwiftPM dependencies)
- **Build & Packaging**: [xtool](https://xtool.sh/) + Swift Package Manager (`Package.swift` + `xtool.yml`)
- **System Frameworks**: `SwiftUI`, `Observation`, `Foundation` (`URLSession`), `Security` (Keychain), `CryptoKit` (`SHA256` disk cache keys), `UIKit` (adaptive colors & haptics)

---

## Project Structure

```text
mensa-ka-ios/
├── Package.swift                       # SwiftPM manifest targeting iOS 17+
├── xtool.yml                           # xtool app packaging config (bundle ID, icon, Info.plist)
├── Info.plist                          # App metadata, orientations & status bar configuration
├── Resources/
│   └── AppIcon.png                     # 1024x1024 app icon
├── Sources/MensaKA/
│   ├── MensaKAApp.swift                # @main SwiftUI App, adaptive TabView, calendar & lightbox
│   ├── Models/
│   │   └── MensaModels.swift           # Codable + Sendable domain models and preferences
│   ├── Localization/
│   │   └── Strings.swift               # EN/DE dictionaries, allergen and additive labels
│   ├── Theme/
│   │   └── Theme.swift                 # Adaptive color palette & iOS 26+ Liquid Glass modifiers
│   ├── Utils/
│   │   ├── DateUtils.swift             # Weekday, ISO date & calendar formatting helpers
│   │   └── Utils.swift                 # Euro/rating formatting, meal filtering, line cleanup & haptics
│   ├── Services/
│   │   ├── GraphQLClient.swift         # URLSession GraphQL client & queries
│   │   ├── PersistenceService.swift    # UserDefaults, Keychain & JSON disk meal plan cache
│   │   └── ImageCache.swift            # Actor-backed NSCache + CryptoKit SHA256 disk image cache
│   ├── Store/
│   │   └── MensaStore.swift            # @Observable @MainActor state container
│   └── Views/
│       ├── Components/                 # CachedMealImage, MealTypeBadge, MealCardView, WeekStripView, ...
│       └── Screens/                    # MenuView, FavoritesView, SearchView, SettingsView, ...
├── scripts/
│   ├── frame-screenshot.mjs            # Composites a screenshot into the iPhone 18 Pro Max bezel
│   └── iphone-18-pro-max-frame.png     # Transparent iPhone 18 Pro Max bezel overlay template
└── .github/workflows/
    └── build-ios-ipa.yml               # CI workflow: xtool unsigned .ipa build & v* tag releases
```

---

## Building Locally with xtool

### Prerequisites

- **macOS**, **Linux**, or **Windows (via WSL2)**
- [xtool](https://xtool.sh/) installed and configured (`xtool setup` with an extracted Xcode SDK on Linux/WSL2)

### Build & Deploy

1. Build and deploy directly to a connected USB iOS device:
   ```bash
   xtool dev
   ```

2. Build without installing (produces the unsigned `.app` bundle under `xtool/`):
   ```bash
   xtool dev build -c release
   ```

3. On macOS, launch in the iOS Simulator:
   ```bash
   xtool dev --simulator
   ```

---

## Building & Releases (CI)

The repository includes [`.github/workflows/build-ios-ipa.yml`](.github/workflows/build-ios-ipa.yml) (`Build Unsigned iOS IPA`), running on GitHub Actions (`xcode-27` on Apple Silicon):

1. Triggers automatically on version tags (`v*`), or manually via **Actions → Build Unsigned iOS IPA → Run workflow**.
2. Installs `xtool` via Homebrew (`brew install xtool-org/tap/xtool`) and runs `xtool dev build -c <configuration>` (`release` or `debug`).
3. Packages the generated `.app` bundle into `MensaKA-unsigned.ipa` and uploads `MensaKA-unsigned-<configuration>-ipa`.
4. **GitHub Releases (`v*` tags)**: When a version tag like `v2.0.0` is pushed, the workflow automatically creates or updates a GitHub Release with `MensaKA-unsigned.ipa` attached.

To frame a raw iPhone screenshot manually:

```bash
node scripts/frame-screenshot.mjs path/to/raw-simulator.png assets/screenshot-iphone.png
```

---

## Credits & Acknowledgments

- **Mensa KA API**: All canteen schedules, meal details, images, nutritional values, allergens, environmental metrics, and meal statistics are served by the GraphQL API from **[https://github.com/kronos-et-al/MensaApp](https://github.com/kronos-et-al/MensaApp)**. Thank you for creating and maintaining this awesome API!

---

## License

Licensed under the [MIT License](LICENSE).
