"""Bundle the supplied LearnAkan videos, retaining video text and spoken translations.

Requires ffmpeg. Video is copied losslessly; only audio is compressed to mono AAC.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    ("1-100", "General Twi phrases", "Essential Twi Phrases 1-100_ General Twi Phrases _ LEARNAKAN.COM(360P).mp4"),
    ("101-200", "More everyday expressions", "Essential Twi Phrases 101-200_ General Twi Phrases _ LEARNAKAN.COM(360P).mp4"),
    ("201-300", "Daily routines", "Essential Twi Phrases 201-300_ Daily Routine Phrases in Twi _ LEARNAKAN.COM(360P).mp4"),
]

def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()
    destination = ROOT / "public/media/twi"
    destination.mkdir(parents=True, exist_ok=True)
    lessons = []
    for phrase_range, title, filename in SOURCES:
        source = args.directory / filename
        source_hash = digest(source)
        info = subprocess.run([args.ffmpeg, "-hide_banner", "-i", str(source)], capture_output=True, text=True)
        match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", info.stderr)
        if not match or "Audio: aac" not in info.stderr or "Video: h264" not in info.stderr:
            raise ValueError(f"Unexpected source streams: {filename}")
        duration = int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])
        stem = f"phrases-{phrase_range}-{source_hash[:10]}-aac64"
        output = destination / f"{stem}.mp4"
        subprocess.run([args.ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                        "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "64k", "-ac", "1",
                        "-movflags", "+faststart", str(output)], check=True)
        poster = destination / f"{stem}.jpg"
        subprocess.run([args.ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-ss", "90", "-i", str(source),
                        "-map", "0:v:0", "-frames:v", "1", "-q:v", "3", str(poster)], check=True)
        lessons.append({
            "id": f"twi-learnakan-{phrase_range}", "language": "twi", "title": title,
            "phraseRange": phrase_range, "phraseCount": 100, "durationSeconds": duration,
            "video": f"/media/twi/{output.name}", "poster": f"/media/twi/{poster.name}",
            "bytes": output.stat().st_size, "sha256": digest(output),
            "source": filename, "sourceSha256": source_hash,
            "creator": "LearnAkan", "creatorUrl": "https://learnakan.com",
            "translations": "English meanings and Twi spellings appear in the original video.",
        })
        print(f"Bundled {phrase_range}: {output.stat().st_size / 1_000_000:.1f} MB", flush=True)
    (ROOT / "src/data/twi-lessons.json").write_text(json.dumps(lessons, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
