#!/usr/bin/env python3
"""
OSINT Collection Orchestrator - Main Entry Point

Reads automation instructions from README.md and orchestrates
AI agents via Sandcastle to collect world events.

Usage:
    python orchestrator/main.py

Environment Variables:
    REPO_ROOT: Repository root directory (default: current directory)
    ANTHROPIC_API_KEY: Claude API key (required)
    TWITTER_BEARER_TOKEN: Twitter API token (optional)
    PERPLEXITY_API_KEY: Perplexity API key (optional)
"""

import os
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

from .state import CollectionState
from .agent import create_collection_graph
from .config import load_config, validate_environment, extract_readme_section


def main():
    """Main orchestrator entry point."""

    print("=" * 60)
    print("OSINT Collection Orchestrator")
    print("=" * 60)
    print(f"Start time: {datetime.utcnow().isoformat()}")
    print()

    # Load environment variables
    load_dotenv()

    # Determine repository root
    repo_root = Path(os.getenv('REPO_ROOT', os.getcwd()))

    print(f"Repository root: {repo_root}")
    print()

    # Load configuration
    config = load_config(repo_root)

    # Validate environment
    if not validate_environment(config):
        print("\n❌ Environment validation failed")
        print("Please fix the issues above and try again.")
        sys.exit(1)

    print()

    # Read automation instructions from README
    readme_path = repo_root / 'README.md'

    if not readme_path.exists():
        print(f"❌ README.md not found at {readme_path}")
        sys.exit(1)

    # Extract automation section
    automation_section = extract_readme_section(
        readme_path,
        start_marker='## Automation Instructions',
        end_marker='## Data Structure'
    )

    if not automation_section:
        print("❌ Could not find Automation Instructions section in README.md")
        sys.exit(1)

    print(f"✓ Loaded automation instructions from README.md")
    print()

    # Create LangGraph workflow
    try:
        graph = create_collection_graph(config, automation_section)
    except Exception as e:
        print(f"❌ Failed to create workflow graph: {e}")
        sys.exit(1)

    # Initialize state
    initial_state = CollectionState(
        repo_root=str(repo_root),
        timestamp=datetime.utcnow().isoformat(),
        sources_processed=0,
        events_collected=0,
        media_files_downloaded=0,
        errors=[],
        warnings=[],
        success=True,
        work_dir="",
        active_sources=[],
        current_source=None,
        events_file=None,
        media_dir=None,
        commit_sha=None,
        branch="main"
    )

    # Execute workflow
    print("🚀 Starting OSINT collection workflow...")
    print()

    try:
        result = graph.invoke(initial_state)
    except Exception as e:
        print(f"\n❌ Workflow execution failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Report final results
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)

    success = result.get("success", False)
    events_collected = result.get("events_collected", 0)
    sources_processed = result.get("sources_processed", 0)
    total_sources = len(result.get("active_sources", []))
    errors = result.get("errors", [])

    print(f"Status: {'✅ SUCCESS' if success else '❌ FAILED'}")
    print(f"Events collected: {events_collected}")
    print(f"Sources processed: {sources_processed}/{total_sources}")
    print(f"Media files: {result.get('media_files_downloaded', 0)}")

    if errors:
        print(f"\nErrors encountered: {len(errors)}")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")

    print(f"\nEnd time: {datetime.utcnow().isoformat()}")
    print("=" * 60)

    # Exit with appropriate code
    # Exit 0 if successful OR if no active sources (expected state)
    # Exit 1 only on critical failures
    if success or total_sources == 0:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
