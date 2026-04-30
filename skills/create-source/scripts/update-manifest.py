#!/usr/bin/env python3
"""
Update Source Manifest

Scans all source files in source/sources/ directory and updates the
source/manifest.json file with complete metadata and statistics.

Usage:
    python3 update-manifest.py

The script:
1. Reads all .md files in source/sources/
2. Extracts YAML frontmatter from each file
3. Builds source registry entries
4. Calculates statistics by type, priority, reliability, status
5. Writes updated manifest.json

No arguments needed - automatically discovers and processes all sources.
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path

def extract_frontmatter(content):
    """Extract YAML frontmatter from markdown file"""
    match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None

    frontmatter_text = match.group(1)
    frontmatter = {}

    # Parse YAML manually (simple key: value pairs)
    for line in frontmatter_text.split('\n'):
        line = line.strip()
        if ':' in line and not line.startswith('-'):
            key, value = line.split(':', 1)
            value = value.strip().strip('"')
            if value.startswith('|'):
                continue  # Skip multiline values
            frontmatter[key.strip()] = value

    return frontmatter

def update_manifest():
    """Update source manifest with all current sources"""
    # Get project root (two levels up from scripts directory)
    project_root = Path(__file__).parent.parent.parent.parent
    sources_dir = project_root / 'source' / 'sources'
    manifest_path = project_root / 'source' / 'manifest.json'

    if not sources_dir.exists():
        print(f'Error: Sources directory not found: {sources_dir}')
        return False

    # Read all source files
    source_files = sorted([f for f in os.listdir(sources_dir) if f.endswith('.md')])

    if not source_files:
        print(f'Warning: No source files found in {sources_dir}')
        return False

    sources = []
    skipped = []

    for file in source_files:
        file_path = sources_dir / file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        frontmatter = extract_frontmatter(content)
        if not frontmatter:
            print(f'Warning: No frontmatter in {file}')
            skipped.append(file)
            continue

        sources.append({
            'id': frontmatter.get('id', ''),
            'name': frontmatter.get('name', ''),
            'type': frontmatter.get('type', 'twitter'),
            'status': frontmatter.get('status', 'testing'),
            'reliability': frontmatter.get('reliability', 'medium'),
            'priority': frontmatter.get('priority', 'medium'),
            'file': f'sources/{file}',
            'added_date': frontmatter.get('created_date', datetime.now().strftime('%Y-%m-%d'))
        })

    # Calculate statistics
    stats = {
        'total_sources': len(sources),
        'active_sources': len([s for s in sources if s['status'] == 'active']),
        'testing_sources': len([s for s in sources if s['status'] == 'testing']),
        'inactive_sources': len([s for s in sources if s['status'] == 'inactive']),
        'by_type': {},
        'by_priority': {
            'high': len([s for s in sources if s['priority'] == 'high']),
            'medium': len([s for s in sources if s['priority'] == 'medium']),
            'low': len([s for s in sources if s['priority'] == 'low'])
        },
        'by_reliability': {
            'high': len([s for s in sources if s['reliability'] == 'high']),
            'medium': len([s for s in sources if s['reliability'] == 'medium']),
            'low': len([s for s in sources if s['reliability'] == 'low']),
            'unverified': len([s for s in sources if s['reliability'] == 'unverified'])
        }
    }

    # Count by type
    types = ['twitter', 'webpage', 'api', 'email', 'rss', 'webhook', 'websocket', 'file', 'database', 'other']
    for type_name in types:
        stats['by_type'][type_name] = len([s for s in sources if s['type'] == type_name])

    # Build manifest
    manifest = {
        'version': '1.0.0',
        'last_updated': datetime.now().strftime('%Y-%m-%d'),
        'description': 'Master registry of all OSINT data sources for world event collection',
        'sources': sources,
        'statistics': stats,
        'metadata': {
            'schema_version': '1.0.0',
            'compatible_versions': ['1.0.x'],
            'last_validated': datetime.now().strftime('%Y-%m-%d')
        }
    }

    # Write manifest
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
        f.write('\n')

    # Print summary
    print('✓ Manifest updated successfully')
    print(f'  Location: {manifest_path}')
    print(f'  Total sources: {len(sources)}')
    if skipped:
        print(f'  Skipped (no frontmatter): {len(skipped)}')
    print(f'\nStatistics:')
    print(f'  - Active: {stats["active_sources"]}')
    print(f'  - Testing: {stats["testing_sources"]}')
    print(f'  - Inactive: {stats["inactive_sources"]}')
    print(f'\nBy Type:')
    for type_name, count in stats['by_type'].items():
        if count > 0:
            print(f'  - {type_name}: {count}')
    print(f'\nBy Priority:')
    print(f'  - High: {stats["by_priority"]["high"]}')
    print(f'  - Medium: {stats["by_priority"]["medium"]}')
    print(f'  - Low: {stats["by_priority"]["low"]}')
    print(f'\nBy Reliability:')
    print(f'  - High: {stats["by_reliability"]["high"]}')
    print(f'  - Medium: {stats["by_reliability"]["medium"]}')
    print(f'  - Low: {stats["by_reliability"]["low"]}')
    print(f'  - Unverified: {stats["by_reliability"]["unverified"]}')

    return True

if __name__ == '__main__':
    success = update_manifest()
    exit(0 if success else 1)
