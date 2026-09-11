# Vernacular

Vernacular is an Android-first language-learning game for practicing Ghanaian languages through short word puzzles. It includes Twi, Fante and Kasem learning packs, eight playable modes, daily challenges, offline progress, XP, streaks, achievements, language switching, and a read-only community leaderboard.

Live app: <https://vernacular-bace0.web.app>

## Mobile app

The Android package is `com.vernacular.app`. The installable, debug-signed APK is committed at:

```text
artifacts/Vernacular-1.0.0-debug.apk
```

This APK is suitable for direct device testing on Android 7.0 (API 24) or newer. A Play Store release should use a private production signing key and a release build.

## What is included

- Guided onboarding with language, level, and daily-goal selection
- Twi, Fante and Kasem packs with 81 structured vocabulary entries
- Word Search, Crossword, Unscramble, Picture Quiz, Listening Challenge, Word Match, Proverb Challenge and Phrase Builder
- Daily challenge, XP, levels, streaks, badges, and learned-word tracking
- Pronunciation controls using the device speech service
- Offline-first progress and cached app shell
- Responsive tablet/desktop companion experience
- Firebase Hosting, Firestore content, rules, indexes, and Android configuration
- Custom Android launcher icon and splash screen
- Automated tests for puzzle generation and progression logic

## Architecture

- React + TypeScript + Vite for the mobile-first interface
- Capacitor for the native Android project and APK
- Firebase Hosting for the production web companion
- Cloud Firestore for read-only language content and leaderboard data
- Local storage for private guest progress and offline continuity

Guest progress intentionally stays on the device in this MVP. Firestore rules allow public reads only for approved collections and deny all client writes. This avoids exposing unauthenticated write access while an account and moderation model is still being designed.

## Content governance

The included vocabulary is marked `needs-review`. It demonstrates the product structure and game loops, but it must be reviewed by qualified Twi, Fante and Kasem speakers before an educational or public-store release. The data model records language, spelling, translation, category, difficulty, pronunciation guidance, example usage, review status, and visibility.

Kasem vocabulary and orthography were checked against the [Kasɩm–French–English dictionary by Urs Niggli/SIL](https://www.kassena.org/sites/www.kassena.org/files/uploads/Dictionnaire%20Kassem%20francais%20anglais%20A%20-%20K.pdf), its [L–Z volume and English index](https://www.kassena.org/sites/www.kassena.org/files/uploads/Dictionnaire%20Kassem%20francais%20anglais%20L%20-%20Z.pdf), the [Ghana Ministry of Education Kasem resources](https://curriculumresources.edu.gh/trs_year1_ghanaian-language_kasem/), and the [Kasena language and culture resource site](https://www.kassena.org/en). Phrase examples also reference the [Kasem phrasebook](https://en.wikivoyage.org/wiki/Kasem_phrasebook). Akan proverb interpretations are supported by published Ghanaian educational and university sources. These references improve provenance; they do not replace native-speaker and dialect review.

## Development

Requirements:

- Node.js 22 or newer
- Android Studio / Android SDK 36
- JDK 21
- Firebase CLI for deployment and content seeding

```bash
npm install
npm run dev
npm test
npm run build
```

To sync and build Android on Windows:

```powershell
npm run android:sync
cd android
.\gradlew.bat assembleDebug
```

The raw Gradle output is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Firebase

Firebase project: `vernacular-bace0` (display name: Vernacular)

```bash
npm run seed
firebase deploy --only hosting,firestore --project vernacular-bace0
```

The seed command uses the account from an existing local `firebase login` session. Firestore is provisioned in the `eur3` multi-region with deletion protection enabled.

## Project layout

```text
src/components/       Screens and interactive puzzle UI
src/data/             Offline language packs
src/lib/              Firebase, game, and progress logic
android/              Native Android wrapper
scripts/              Firestore seed and Android asset tools
artifacts/            Installable APK output
public/               PWA manifest, service worker, and web icon
```
