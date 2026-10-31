"""
Metadata management for the embedding pipeline
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any


def extract_metadata(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract searchable metadata from events.
    Includes links for inline display in the search UI.
    """
    metadata = []

    for event in events:
        image_urls = event.get('image_urls') or []
        preview_image = (event.get('link_preview') or {}).get('image')
        item = {
            'id': event['id'],
            'title': event['title'],
            'summary': event['summary'],
            'date_event': event.get('date_event'),
            'date_published': event['date_published'],
            'geo': event.get('geo'),
            'topics': event.get('topics', []),
            'confidence': event.get('confidence'),
            'source_name': event['source']['name'],
            'links': event.get('links', []),
            'link_preview_image': (image_urls[0] if image_urls else preview_image),
            'image_origin': event.get('image_origin'),
        }
        metadata.append(item)

    return metadata


def save_metadata(metadata: List[Dict[str, Any]], metadata_path: Path):
    """Save metadata as JSON array"""
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Saved metadata for {len(metadata)} events to {metadata_path}")


def save_schema(
    schema_path: Path,
    event_count: int,
    embedding_dims: int,
    embedding_file: str = 'embeddings.bin',
):
    """Save index schema metadata"""
    schema = {
        'version': '2.0.0',
        'embedding_model': 'all-MiniLM-L6-v2',
        'embedding_dims': embedding_dims,
        'embedding_file': embedding_file,
        'event_count': event_count,
        'last_updated': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }

    schema_path.parent.mkdir(parents=True, exist_ok=True)
    with open(schema_path, 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2)
    print(f"Saved schema to {schema_path}")
