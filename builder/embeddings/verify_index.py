#!/usr/bin/env python3
"""Fail a release if its event files and generated index artifacts disagree."""
import json
import os
from pathlib import Path

from build_index import index_artifacts_match, load_all_events


def verify_release_data(repo_root: Path) -> int:
    events = load_all_events(repo_root / 'data' / 'events')
    indexes = repo_root / 'data' / 'indexes'
    if not index_artifacts_match(events, indexes):
        raise ValueError('Semantic index does not match the retained event corpus')

    for name in ('by-source.json', 'by-topic.json', 'by-location.json'):
        with (indexes / name).open(encoding='utf-8') as file:
            json.load(file)

    with (repo_root / 'data' / 'stats.json').open(encoding='utf-8') as file:
        stats = json.load(file)
    if stats['statistics']['total_events'] != len(events):
        raise ValueError('data/stats.json event count does not match event files')
    dates = sorted(event['date_published'][:10] for event in events)
    expected_range = {
        'oldest_date': dates[0] if dates else None,
        'newest_date': dates[-1] if dates else None,
    }
    if stats['data_range'] != expected_range:
        raise ValueError('data/stats.json date range does not match event files')
    print(f'Verified {len(events)} event rows and matching release indexes/stats')
    return len(events)


if __name__ == '__main__':
    verify_release_data(Path(os.environ.get('REPO_ROOT', os.getcwd())))
