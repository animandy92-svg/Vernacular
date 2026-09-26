"""Create one game audio clip per numbered LearnAkan phrase.

The checked phrase/timing data lives in ``src/data/twi-video-phrases.source.json``.
Run this script after reviewing that source file against the supplied videos.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE_MANIFEST = ROOT / 'src/data/twi-video-phrases.source.json'
OUTPUT_MANIFEST = ROOT / 'src/data/twi-video-phrases.json'


def digest(path: Path) -> str:
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--ffmpeg', default='ffmpeg')
    args = parser.parse_args()
    phrases = json.loads(SOURCE_MANIFEST.read_text(encoding='utf-8'))
    if [item['number'] for item in phrases] != list(range(1, 301)):
        raise ValueError('The reviewed source must contain phrases 1 through 300 in order.')

    output_dir = ROOT / 'public/audio/twi'
    output_dir.mkdir(parents=True, exist_ok=True)
    released = []
    for phrase in phrases:
        source = ROOT / 'public/media/twi' / phrase['sourceVideo']
        output = output_dir / f"learnakan-{phrase['number']:03}.m4a"
        duration = phrase['endSeconds'] - phrase['startSeconds']
        if duration < 1 or duration > 20:
            raise ValueError(f"Invalid clip duration for phrase {phrase['number']}: {duration}")
        subprocess.run([
            args.ffmpeg, '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
            '-ss', str(phrase['startSeconds']), '-i', str(source), '-t', str(duration),
            '-vn', '-c:a', 'aac', '-b:a', '48k', '-ac', '1', '-movflags', '+faststart',
            str(output),
        ], check=True)
        released.append({
            'number': phrase['number'], 'word': phrase['word'],
            'translation': phrase['translation'],
            'audio': f"/audio/twi/{output.name}",
            'sourceVideo': phrase['sourceVideo'],
            'startSeconds': phrase['startSeconds'], 'endSeconds': phrase['endSeconds'],
            'bytes': output.stat().st_size, 'sha256': digest(output),
        })
        if phrase['number'] % 25 == 0:
            print(f"Exported {phrase['number']}/300", flush=True)
    OUTPUT_MANIFEST.write_text(json.dumps(released, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
