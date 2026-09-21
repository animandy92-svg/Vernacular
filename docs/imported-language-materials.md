# Imported language materials

## Kasem dictionary

The supplied `Indigen_World_Kasem_Dictionary.xlsx` contains 339 records. All are retained in `src/data/kasem-dictionary.json`, with the worksheet row, original source ID, workbook SHA-256, original columns, and ISO dates.

The app adds these records to the 33 existing Kasem entries, for 372 entries. IDs use source entry IDs so reordering the workbook does not reset progress. Dialects, distinct senses, tone markers, alternative forms, example translations, cultural notes and attribution are retained. Existing course IDs remain unchanged. Search includes dialects and alternate terms.

Blank categories use “General vocabulary”. “Audio not available yet” is not presented as a pronunciation. Imported source approval dates do not imply completion of the app's language review. Missing pronunciation and examples stay blank. Source audio URLs remain metadata and are not treated as approved recordings.

Reimport with Python and openpyxl:
```text
python scripts/import-kasem-workbook.py /path/to/Indigen_World_Kasem_Dictionary.xlsx
```

Publish only the additional entries and language count:
```text
npm run seed -- --language=kasem --import-only --content-only --dry-run
npm run seed -- --language=kasem --import-only --content-only
```

## Twi listening lessons

The three supplied LearnAkan videos cover phrases 1–100, 101–200 and daily routine phrases 201–300. Each complete recording is available from Twi's Learn and Languages screens. Twi spellings and English meanings are part of the video picture and remain in sync with the audio.

The import copies H.264 video without re-encoding and converts audio to mono AAC at 64 kbps. Credits, source and output hashes, original filenames, sizes, durations and posters are recorded in `src/data/twi-lessons.json`. Filenames contain a source hash and encoding version.

```text
python scripts/import-twi-lessons.py /path/to/source-directory --ffmpeg /path/to/ffmpeg
```

Playback supports 0.75×, 1× and 1.25× speed, ten-second replay, start over, native fullscreen controls, and a saved position per lesson. It pauses when hidden or another lesson opens. Watching does not award course completion, recall credit or XP. Full recordings are not represented as individually reviewed word clips in the native-audio manifest.

Android bundles all three videos offline. The web app streams them and offers per-lesson offline saving. A separate video cache allows the app shell to install without downloading all lessons. The service worker handles byte-range requests from saved media for offline seeking and removes obsolete media when a new version activates.

Run `npm test` and `npm run build` to validate source coverage, media hashes, saved positions, offline ranges and build integrity.
