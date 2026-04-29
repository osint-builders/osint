"""
State management for OSINT collection workflow.

Defines the state structure passed between LangGraph nodes.
"""

from typing import TypedDict, List, Optional, Dict, Any


class CollectionState(TypedDict, total=False):
    """State for the OSINT collection workflow."""

    # Configuration
    repo_root: str
    timestamp: str

    # Source processing
    active_sources: List[Dict[str, Any]]
    sources_processed: int
    current_source: Optional[Dict[str, Any]]

    # Data collection
    work_dir: str
    events_collected: int
    media_files_downloaded: int

    # Results
    success: bool
    errors: List[str]
    warnings: List[str]

    # Paths
    events_file: Optional[str]
    media_dir: Optional[str]

    # Git
    commit_sha: Optional[str]
    branch: str
