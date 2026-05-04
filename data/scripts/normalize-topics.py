#!/usr/bin/env python3
"""
normalize-topics.py
One-time + ongoing topic normalization for OSINT event JSONL files.

Rules (applied in order):
1. Strip leading/trailing whitespace.
2. Lowercase.
3. Replace spaces and underscores with hyphens.
4. Remove any character that is not a-z, 0-9, or hyphen.
5. Collapse multiple consecutive hyphens into one.
6. Strip leading/trailing hyphens.
7. Singularize using inflect (keeps term if no singular form found).
8. Drop topics shorter than 2 characters or that are pure numbers.
9. Deduplicate while preserving order.

Usage (one-time batch over all JSONL):
    python3 data/scripts/normalize-topics.py

Usage (pipe single event for testing):
    echo '{"topics": ["Drones", "Military Operations", "Iran war"]}' | \
        python3 data/scripts/normalize-topics.py --test
"""
import json
import sys
import re
import glob
from pathlib import Path

try:
    import inflect
    _engine = inflect.engine()
except ImportError:
    _engine = None
    print("Warning: inflect not installed. Singularization disabled.", file=sys.stderr)


def normalize_topic(raw: str) -> str | None:
    """Normalize a single topic tag. Returns None if the result should be dropped."""
    t = raw.strip().lower()
    # spaces and underscores → hyphens
    t = re.sub(r'[ _]+', '-', t)
    # keep only a-z, 0-9, hyphen
    t = re.sub(r'[^a-z0-9-]', '', t)
    # collapse multiple hyphens
    t = re.sub(r'-{2,}', '-', t)
    # strip leading/trailing hyphens
    t = t.strip('-')

    if len(t) < 2:
        return None
    if re.fullmatch(r'\d+', t):
        return None

    # singularize each hyphen-separated word
    if _engine:
        parts = t.split('-')
        singular_parts = []
        for part in parts:
            singular = _engine.singular_noun(part)
            singular_parts.append(singular if singular else part)
        t = '-'.join(singular_parts)

    return t or None


def normalize_topics(topics: list) -> list:
    """Normalize a list of topics, returning deduplicated normalized list."""
    seen = set()
    result = []
    for raw in topics:
        norm = normalize_topic(str(raw))
        if norm and norm not in seen:
            seen.add(norm)
            result.append(norm)
    return result


def process_jsonl_file(path: Path, dry_run: bool = False) -> tuple[int, int]:
    """Process one JSONL file in-place. Returns (events_processed, topics_changed)."""
    lines = path.read_text(encoding='utf-8').splitlines()
    out_lines = []
    changed = 0

    for line in lines:
        line = line.strip()
        if not line:
            out_lines.append(line)
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            out_lines.append(line)
            continue

        raw_topics = ev.get('topics', [])
        norm_topics = normalize_topics(raw_topics)
        if norm_topics != raw_topics:
            changed += 1
            ev['topics'] = norm_topics

        out_lines.append(json.dumps(ev, ensure_ascii=False, separators=(',', ':')))

    if changed > 0 and not dry_run:
        path.write_text('\n'.join(out_lines) + '\n', encoding='utf-8')

    return len(lines), changed


def main():
    test_mode = '--test' in sys.argv
    dry_run = '--dry-run' in sys.argv

    if test_mode:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            ev = json.loads(line)
            raw = ev.get('topics', [])
            norm = normalize_topics(raw)
            print(f'Before: {raw}')
            print(f'After:  {norm}')
        return

    repo_root = Path(__file__).parent.parent.parent
    events_dir = repo_root / 'data' / 'events'

    jsonl_files = sorted(events_dir.glob('**/*.jsonl'))
    if not jsonl_files:
        print('No JSONL files found.')
        return

    total_events = 0
    total_changed = 0

    for path in jsonl_files:
        n_events, n_changed = process_jsonl_file(path, dry_run=dry_run)
        total_events += n_events
        total_changed += n_changed
        if n_changed:
            status = '[DRY RUN] would update' if dry_run else 'Updated'
            print(f'  {status}: {path.relative_to(repo_root)} ({n_changed}/{n_events} events changed)')

    action = 'Would update' if dry_run else 'Updated'
    print(f'\n{action} {total_changed} events across {len(jsonl_files)} files ({total_events} total events).')
    if not dry_run and total_changed > 0:
        print('\nNext: run  node data/scripts/rebuild-indexes.js  to refresh indexes.')


if __name__ == '__main__':
    main()
