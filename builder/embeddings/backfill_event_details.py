#!/usr/bin/env python3
"""
Backfill per-event detail files and patch links into metadata.json.

Reads all JSONL files from data/events/**/*.jsonl without requiring OpenAI:
1. Writes docs/search-index/events/{id}.json for each event (for detail modal)
2. Patches docs/search-index/metadata.json to add 'links' field to each entry

Usage:
    python backfill_event_details.py [repo_root]
    Defaults repo_root to current working directory.
"""
import json
import sys
from pathlib import Path


def load_all_events(data_dir: Path) -> dict:
    """Load all events keyed by id."""
    events = {}
    jsonl_files = sorted(data_dir.glob('**/*.jsonl'))
    print(f"Scanning {len(jsonl_files)} JSONL files…")
    for f in jsonl_files:
        with open(f, encoding='utf-8') as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    ev = json.loads(line)
                    events[ev['id']] = ev
                except (json.JSONDecodeError, KeyError):
                    pass
    print(f"Loaded {len(events)} unique events.")
    return events


def write_detail_files(events: dict, events_dir: Path) -> int:
    """Write one compact JSON per event."""
    events_dir.mkdir(parents=True, exist_ok=True)
    written = 0
    for event_id, ev in events.items():
        dest = events_dir / f'{event_id}.json'
        with open(dest, 'w', encoding='utf-8') as f:
            json.dump(ev, f, ensure_ascii=False, separators=(',', ':'))
        written += 1
    return written


def patch_metadata(events: dict, metadata_path: Path) -> int:
    """Add 'links' field to each entry in metadata.json."""
    if not metadata_path.exists():
        print(f"metadata.json not found at {metadata_path}; skipping patch.")
        return 0

    with open(metadata_path, encoding='utf-8') as f:
        metadata = json.load(f)

    patched = 0
    for item in metadata:
        ev = events.get(item['id'])
        if ev is not None and 'links' not in item:
            item['links'] = ev.get('links', [])
            patched += 1

    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    return patched


def main():
    repo_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    data_dir = repo_root / 'data' / 'events'
    output_dir = repo_root / 'docs' / 'search-index'
    events_dir = output_dir / 'events'
    metadata_path = output_dir / 'metadata.json'

    if not data_dir.exists():
        print(f"Data directory not found: {data_dir}")
        sys.exit(1)

    events = load_all_events(data_dir)
    if not events:
        print("No events found. Nothing to do.")
        sys.exit(0)

    written = write_detail_files(events, events_dir)
    print(f"Written {written} event detail files → {events_dir}")

    patched = patch_metadata(events, metadata_path)
    print(f"Patched {patched} entries with 'links' field → {metadata_path}")

    print("\nDone.")


if __name__ == '__main__':
    main()
