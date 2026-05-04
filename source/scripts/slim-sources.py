#!/usr/bin/env python3
"""
slim-sources.py
Converts verbose 300-800 line source files to <=50 line concise agent directives.

New format:
  ---
  id: <id>
  type: <type>
  status: <status>
  ---
  # <name> (<handle_or_url>)
  <description: 2-4 sentences from existing frontmatter>
  Keywords: <alert_keywords>
  [Auth: <one line if requires_auth and not free>]
  [Notes: <reliability, priority if non-default>]

Usage:
  python3 source/scripts/slim-sources.py [--dry-run] [--file <specific.md>]
"""
import re
import sys
import os
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
SOURCES_DIR = REPO_ROOT / 'source' / 'sources'


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse YAML-like frontmatter, return (fields dict, body text)."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != '---':
        return {}, text

    fm_lines = []
    body_start = 1
    for i, line in enumerate(lines[1:], 1):
        if line.strip() == '---':
            body_start = i + 1
            break
        fm_lines.append(line)

    body = '\n'.join(lines[body_start:])

    # Parse simple key: value and key: | (multiline) from frontmatter
    fields = {}
    i = 0
    while i < len(fm_lines):
        line = fm_lines[i]
        m = re.match(r'^(\w[\w_-]*):\s*(.*)', line)
        if not m:
            i += 1
            continue
        key, val = m.group(1), m.group(2).strip()
        if val == '|':
            # multiline block scalar
            block = []
            i += 1
            indent = None
            while i < len(fm_lines):
                bl = fm_lines[i]
                if bl == '' or bl.startswith(' ') or bl.startswith('\t'):
                    stripped = bl.lstrip()
                    if indent is None and stripped:
                        indent = len(bl) - len(stripped)
                    block.append(stripped)
                    i += 1
                else:
                    break
            fields[key] = ' '.join(b for b in block if b).strip()
        elif val.startswith('['):
            # inline list
            items = re.findall(r'["\']?([^",\[\]\']+)["\']?', val)
            fields[key] = [x.strip() for x in items if x.strip()]
        elif val.startswith('-') or (i + 1 < len(fm_lines) and fm_lines[i + 1].startswith('  -')):
            # block list
            items = []
            if val.startswith('-'):
                items.append(val[1:].strip().strip('"\''))
            i += 1
            while i < len(fm_lines) and re.match(r'\s+-\s+', fm_lines[i]):
                items.append(fm_lines[i].strip()[2:].strip().strip('"\''))
                i += 1
            fields[key] = items
            continue
        else:
            fields[key] = val.strip('"\'')
        i += 1

    return fields, body


def extract_handle_or_url(fields: dict, filename: str, body: str) -> str:
    """Try to extract the Twitter handle or URL from various sources."""
    src_type = str(fields.get('type', '')).lower()
    name = str(fields.get('name', ''))

    if src_type == 'twitter':
        # Try filename: twitter-abc.md → @ABC
        stem = Path(filename).stem
        if stem.startswith('twitter-'):
            handle_guess = stem[len('twitter-'):].replace('-', '').upper()
        else:
            handle_guess = stem

        # Try body for "Handle: @xxx"
        m = re.search(r'(?i)(?:handle|account)[\s:*]+@?(\w+)', body)
        if m:
            return f'@{m.group(1)}'
        # Try name field for "@" sign
        m = re.search(r'@(\w+)', name)
        if m:
            return f'@{m.group(1)}'
        return f'@{handle_guess}'

    # Webpage / API / RSS: look for URL in body
    m = re.search(r'https?://\S+', body)
    if m:
        url = m.group(0).rstrip('.,)')
        return url

    return name


def build_slim(fields: dict, body: str, filename: str) -> str:
    """Build the slim source file content."""
    src_id = str(fields.get('id', Path(filename).stem))
    src_type = str(fields.get('type', 'twitter')).lower()
    status = str(fields.get('status', 'active')).lower()
    name = str(fields.get('name', src_id))
    description = str(fields.get('description', '')).strip()
    requires_auth = str(fields.get('requires_auth', 'false')).lower()
    cost = str(fields.get('cost', 'free')).lower()
    reliability = str(fields.get('reliability', 'medium')).lower()
    priority = str(fields.get('priority', 'medium')).lower()

    # Keywords: from alert_keywords list
    keywords_raw = fields.get('alert_keywords', [])
    if isinstance(keywords_raw, list):
        keywords = ', '.join(keywords_raw)
    else:
        keywords = str(keywords_raw)

    handle_or_url = extract_handle_or_url(fields, filename, body)

    # Clean up description: max 4 sentences, strip markdown
    desc = re.sub(r'[\*_`#]', '', description)
    desc = re.sub(r'\s+', ' ', desc).strip()
    # Trim to 4 sentences max
    sentences = re.split(r'(?<=[.!?])\s+', desc)
    desc = ' '.join(sentences[:4]).strip()
    if not desc:
        desc = f'Monitor {name} for world events relevant to OSINT collection.'

    lines = [
        '---',
        f'id: {src_id}',
        f'type: {src_type}',
        f'status: {status}',
        '---',
        f'# {name} ({handle_or_url})',
        desc,
    ]

    if keywords:
        lines.append(f'Keywords: {keywords}')

    # Auth note only when non-free or auth required
    if requires_auth in ('true', 'yes', '1') and cost not in ('free', ''):
        lines.append(f'Auth: required — set via environment secret')

    # Notes only when non-default priority/reliability
    notes = []
    if priority == 'high':
        notes.append('priority:high')
    if reliability in ('low', 'medium-low'):
        notes.append(f'reliability:{reliability}')
    if notes:
        lines.append(f'Notes: {", ".join(notes)}')

    return '\n'.join(lines) + '\n'


def process_file(path: Path, dry_run: bool = False) -> tuple[int, int]:
    """Slim one source file. Returns (before_lines, after_lines)."""
    text = path.read_text(encoding='utf-8')
    fields, body = parse_frontmatter(text)

    if not fields.get('id'):
        return 0, 0  # skip files without frontmatter

    slim = build_slim(fields, body, path.name)
    before = len(text.splitlines())
    after = len(slim.splitlines())

    if not dry_run:
        path.write_text(slim, encoding='utf-8')

    return before, after


def main():
    dry_run = '--dry-run' in sys.argv
    specific = None
    if '--file' in sys.argv:
        idx = sys.argv.index('--file')
        specific = sys.argv[idx + 1]

    files = sorted(SOURCES_DIR.glob('*.md'))
    if specific:
        files = [SOURCES_DIR / specific]

    total_before = 0
    total_after = 0
    processed = 0

    for path in files:
        before, after = process_file(path, dry_run=dry_run)
        if before == 0:
            continue
        total_before += before
        total_after += after
        processed += 1
        action = 'would slim' if dry_run else 'slimmed'
        pct = int((1 - after / before) * 100) if before else 0
        print(f'  {action}: {path.name:45s}  {before:4d} → {after:3d} lines  ({pct}% reduction)')

    print(f'\n{"Would process" if dry_run else "Processed"} {processed} files.')
    print(f'Total lines: {total_before:,} → {total_after:,} ({int((1 - total_after/total_before)*100)}% reduction)')
    pct_tok = int((1 - total_after / total_before) * 100) if total_before else 0
    print(f'Estimated token reduction: ~{pct_tok}% (from ~{total_before*10:,} to ~{total_after*10:,} tokens across all sources)')


if __name__ == '__main__':
    main()
