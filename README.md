# Vernacular

Vernacular is an Android-first language-learning adventure for Twi, Fante, Kasem and Ga. Each language has a 20-lesson beginner course, teaching cards, contextual practice, scheduled memory reviews and optional record-and-replay speaking practice. Animated companions, eight puzzle modes, daily goals, offline progress, XP, streaks and cultural settings support regular practice.

Ga includes 24 starter vocabulary entries and four phrases sourced from Rev. Peter Addo’s [Ga Words and Phrases](https://www.osofo.net/words.htm) and [greetings page](https://www.osofo.net/wordsp2.htm). Source spellings are retained; the content and course await qualified speaker review. Ga native recordings and proverbs are not yet available.

Live app: <https://vernacular-bace0.web.app>

## Mobile app

The Android package is `com.vernacular.app`. The latest installable, debug-signed APK is available at:

```text
artifacts/Vernacular-1.5.0-debug.apk
```

This APK is suitable for direct device testing on Android 7.0 (API 24) or newer. A Play Store release should use a private production signing key and a release build.

## Version 1.5.0 — dictionary and listening lessons

- Imported all 339 entries from the supplied Indigen World Kasem Dictionary, expanding the Kasem vocabulary pack to 372 entries
- Preserved dialects, spelling, source IDs, examples, English example translations, usage notes and attribution
- Added three LearnAkan Twi recordings covering phrases 1–300, with their original on-screen Twi spellings and English meanings
- Added slower playback, ten-second replay, separate saved listening positions, and source credits
- Bundled all three recordings in the Android APK; web learners can save each lesson offline
- Added offline video seeking without making large video downloads a prerequisite for app installation

See [imported materials](docs/imported-language-materials.md) for source tracking, reimport commands and offline behavior. Existing course and learner progress IDs remain unchanged. The recordings are full listening lessons; individual word pronunciation buttons still use the separate reviewed-recording manifest.

## Version 1.4.0 — course preview

- 60 guided lessons across Twi, Fante and Kasem, with four chapters and four checkpoints per language
- Two-step onboarding leads directly into a greeting lesson; companion customisation remains in profile settings
- Teaching cards come before questions, with a contextual check at the end of each lesson
- Separate course completion and review queues per language; shared lifetime XP and streaks are preserved
- Introduced, practising and remembered states replace claims that one completed puzzle proves learning
- New expressions return tomorrow; successful scheduled typed reviews use 3-, 7-, 14- and 30-day intervals
- Three successful scheduled reviews on separate days are needed for the remembered state; misses reset the sequence and return tomorrow
- Same-day replays and early practice cannot inflate recall or postpone a due review
- Optional 15-second recordings stay in memory, stop when the app is backgrounded, and are discarded when the learner leaves the card; no upload or pronunciation grading
- Approved native-audio manifest supports normal and slow recordings, transcript matching and offline bundling
- Existing vocabulary history, XP, stars, activity, companions and profiles migrate without resetting; old learned-word records become introduced words awaiting a recall check

The courses currently use 52 distinct Twi, 28 Fante and 37 Kasem words and phrases from the existing packs. Fante and Kasem deliberately revisit more material because their packs are smaller. All guided course content remains a draft awaiting qualified speaker review. The supplied LearnAkan recordings are available as separate Twi listening lessons; individual guided cards still await matched recordings. The interface labels this preview status and never substitutes an unrelated device voice for native course audio.

Regenerate the speaker review packet with `npm run content:review`. See [the content-review packet](docs/course-content-review.md) for the complete lesson sequence, source entries and recording manifest instructions, and [the pilot plan](docs/pilot-plan.md) for a four-week learning evaluation. Production publication and participant recruitment are separate steps. Microphone capture still needs validation on physical target Android devices.

## Version 1.3.1

- Imported all 3,000 pairs from `English_Twi_3000_Everyday_Vocabulary.xlsx`, adding 2,986 entries after matching 14 existing pairs
- Twi now has 3,010 words and expressions, with original spelling, categories and distinct meanings preserved
- Workbook records are bundled for offline use and remain `needs-review`; pronunciation guides and examples are left blank when the source does not supply them
- Vocabulary search covers the full pack while displaying 50 results at a time
- Quizzes avoid duplicate spellings/meanings within a round; letter puzzles use suitable single words

Source rows, notes and the workbook SHA-256 are retained in `src/data/twi-everyday.json`. Imported IDs use the source number; `sourceRow` refers to the worksheet row including the header. Existing word IDs stay unchanged. Imported entries use the existing beginner default because the workbook describes basic everyday vocabulary without proficiency levels.

Recreate the import with Python and `openpyxl`:

```text
python scripts/import-twi-workbook.py /path/to/English_Twi_3000_Everyday_Vocabulary.xlsx
```

Preview or publish only the additional Twi entries and updated language count:

```bash
npm run seed -- --language=twi --import-only --content-only --dry-run
npm run seed -- --language=twi --import-only --content-only
```

## Version 1.3.0

- Four original articulated cartoon companions with independent facial expressions, hands and feet
- Blinking, glancing, breathing, walking, waving, talking, dancing and jumping celebrations
- Tap your companion on Home, in customization, on your profile or at results to wave, dance and celebrate; drag sideways to move, then release to spring home
- Keyboard interaction: Enter or Space to play, arrow keys to walk
- Encouraging reactions after mistakes, happy expressions for correct answers, and speaking animation that follows lesson-tip audio
- Reduced-motion support, animation pausing outside the viewport and in background tabs, and fully bundled offline artwork

Existing companion names, chosen looks and learning progress are preserved.

## Version 1.2.0

- Compact phone home screen, two-column quick play, improved touch targets, and safe-area spacing
- Daily puzzle goals, a seven-day activity view, local-calendar streaks, and preserved streak badges
- Searchable vocabulary with all/learned filters, pronunciation guides, and expandable examples
- Difficulty-aware word selection and repeatable daily challenges
- Tap-to-remove letters and phrase tokens, first-try scoring, and protected puzzle exits
- Android Back navigates setup and app screens, asks before leaving a puzzle, and backgrounds the app from Home
- Cancelable profile edits, stable lesson content during cloud updates, and duplicate reward protection
- Lazy-loaded game screens and a versioned offline web cache including game code and artwork
- Device-voice availability feedback and visible storage-save failures

Existing saved progress is preserved. Daily activity history begins with puzzles completed in this version; past daily counts cannot be reconstructed from lifetime totals. Web offline use requires one successful initial cache installation. Android includes the app assets in the APK.

## What is included

- Guided onboarding for preferred and local names, language, companion customization, level, and daily goal
- An interactive learning companion with animated lesson prompts, reactions, carried objects and celebrations
- Four original cartoon companion looks with articulated vector artwork and local-only name customization
- Twi, Fante and Kasem packs with 3,406 structured vocabulary entries
- Word Search, Crossword, Unscramble, Picture Quiz, Listening Challenge, Word Match, Proverb Challenge and Phrase Builder
- Daily challenge, XP, stars, levels, streaks, badges, learned-word tracking and activity unlocks
- Four illustrated adventure environments: Welcome Courtyard, Market Day, Story Grove and Moonlit Library
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

The included vocabulary and beginner lesson text are marked `needs-review`. They demonstrate the product structure and game loops, but Ga material must be reviewed by qualified Ga speakers before an educational or public-store release, alongside the existing Twi, Fante and Kasem review. Native recordings are supported through `src/data/native-audio.json`; each recording needs a matching transcript, named speaker and dialect, reviewer, review date, and bundled audio file before the app will offer it as verified native audio. The data model records language, spelling, translation, category, difficulty, pronunciation guidance, example usage, review status, and visibility.

Kasem vocabulary and orthography were checked against the [Kasɩm–French–English dictionary by Urs Niggli/SIL](https://www.kassena.org/sites/www.kassena.org/files/uploads/Dictionnaire%20Kassem%20francais%20anglais%20A%20-%20K.pdf), its [L–Z volume and English index](https://www.kassena.org/sites/www.kassena.org/files/uploads/Dictionnaire%20Kassem%20francais%20anglais%20L%20-%20Z.pdf), the [Ghana Ministry of Education Kasem resources](https://curriculumresources.edu.gh/trs_year1_ghanaian-language_kasem/), and the [Kasena language and culture resource site](https://www.kassena.org/en). Phrase examples also reference the [Kasem phrasebook](https://en.wikivoyage.org/wiki/Kasem_phrasebook). Akan proverb interpretations are supported by published Ghanaian educational and university sources. These references improve provenance; they do not replace native-speaker and dialect review.

## Development

Requirements:

- Node.js 22.18 or newer
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
