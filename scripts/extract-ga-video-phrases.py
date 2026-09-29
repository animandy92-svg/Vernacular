"""Export the Ga expressions and timings in the source manifest.

Usage: python scripts/extract-ga-video-phrases.py --source-dir <video folder>
       --ffmpeg <ffmpeg executable>
The original videos stay outside the app; only individual audio clips ship.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--ffmpeg', default='ffmpeg')
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'src/data/ga-video-phrases.source.json').read_text(encoding='utf-8'))
    source_paths = {}
    for source in manifest['sources']:
        path = args.source_dir / source['file']
        if digest(path) != source['sha256']:
            raise ValueError(f"Source video mismatch: {source['file']}")
        source_paths[source['key']] = path
    output_dir = ROOT / 'public/audio/ga'
    output_dir.mkdir(parents=True, exist_ok=True)
    released = []
    seen = set()
    for phrase in manifest['phrases']:
        identifier = phrase['id']
        if identifier in seen or not identifier.startswith('ga-video-') or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in identifier):
            raise ValueError(f'Invalid or duplicate clip ID: {identifier}')
        seen.add(identifier)
        duration = phrase['endSeconds'] - phrase['startSeconds']
        if phrase['startSeconds'] < 0 or not .3 <= duration <= 30:
            raise ValueError(f'Invalid clip timing: {identifier}')

    def export(phrase):
        identifier = phrase['id']
        duration = phrase['endSeconds'] - phrase['startSeconds']
        output = output_dir / f'{identifier.removeprefix("ga-video-")}.m4a'
        subprocess.run([
            args.ffmpeg, '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
            '-ss', str(phrase['startSeconds']), '-t', str(duration), '-i', str(source_paths[phrase['source']]),
            '-t', str(duration), '-vn', '-c:a', 'aac', '-b:a', '64k', '-ac', '1',
            '-af', f'afade=t=in:d=0.015,afade=t=out:st={duration - .025}:d=0.025',
            '-threads', '1',
            '-movflags', '+faststart', str(output),
        ], check=True)
        source = next(item for item in manifest['sources'] if item['key'] == phrase['source'])
        return {
            'id': identifier, 'word': phrase['word'], 'translation': phrase['translation'],
            'category': phrase['category'], 'attribution': source['attribution'],
            'audio': f'/audio/ga/{output.name}', 'sourceVideo': source['file'],
            'startSeconds': phrase['startSeconds'], 'endSeconds': phrase['endSeconds'],
            'bytes': output.stat().st_size, 'sha256': digest(output),
        }
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as pool:
        for result in pool.map(export, manifest['phrases']):
            released.append(result)
            if len(released) % 20 == 0:
                print(f'Exported {len(released)}/{len(manifest["phrases"])}', flush=True)
    (ROOT / 'src/data/ga-video-phrases.json').write_text(json.dumps(released, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Exported {len(released)} Ga clips.', flush=True)


if __name__ == '__main__':
    main()
