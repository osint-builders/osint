"""
LangGraph agent for OSINT collection workflow.

Defines the graph structure and node functions that execute
the automation instructions from README.md.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from langgraph.graph import StateGraph, END

from .state import CollectionState
from .tools import (
    run_shell_command,
    load_json_file,
    read_jsonl_file,
    git_add_commit_push,
    append_to_file
)


def load_sources_node(state: CollectionState) -> CollectionState:
    """
    Load active sources from manifest.

    Implements README lines 92-119: Load Active Sources from Manifest
    """
    print("\n" + "=" * 60)
    print("Step 1: Loading Active Sources")
    print("=" * 60)

    repo_root = Path(state["repo_root"])
    manifest_path = repo_root / "source" / "manifest.json"

    # Load manifest
    manifest = load_json_file(manifest_path)

    if not manifest:
        state["errors"].append("Failed to load source manifest")
        state["success"] = False
        state["active_sources"] = []
        return state

    # Filter active sources
    all_sources = manifest.get("sources", [])
    active_sources = [s for s in all_sources if s.get("status") == "active"]

    print(f"Found {len(active_sources)} active source(s)")

    if len(active_sources) == 0:
        print("No active sources to process. Exiting successfully.")

    state["active_sources"] = active_sources
    state["sources_processed"] = 0

    return state


def create_work_dir_node(state: CollectionState) -> CollectionState:
    """
    Create temporary work directory.

    Implements README lines 124-137: Create Temporary Work Directory
    """
    print("\n" + "=" * 60)
    print("Step 2: Creating Work Directory")
    print("=" * 60)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    work_dir = f"/tmp/osint-collection-{timestamp}"

    # Create work directory structure
    exit_code, _, stderr = run_shell_command(f"""
        mkdir -p {work_dir}/raw
        mkdir -p {work_dir}/media/images
        mkdir -p {work_dir}/media/videos
    """)

    if exit_code != 0:
        state["errors"].append(f"Failed to create work directory: {stderr}")
        state["success"] = False
        return state

    print(f"Work directory: {work_dir}")

    state["work_dir"] = work_dir

    return state


def process_sources_node(state: CollectionState) -> CollectionState:
    """
    Process each source sequentially via Sandcastle.

    Implements README lines 142-456: Process Each Source Sequentially
    """
    if len(state["active_sources"]) == 0:
        return state

    print("\n" + "=" * 60)
    print("Step 3: Processing Sources")
    print("=" * 60)

    repo_root = Path(state["repo_root"])
    work_dir = state["work_dir"]

    # Ensure memory file exists
    memory_file = repo_root / "memory.md"
    if not memory_file.exists():
        memory_file.touch()

    for source in state["active_sources"]:
        source_id = source.get("id")
        source_name = source.get("name")
        source_file = source.get("file")

        print("\n" + "=" * 40)
        print(f"Processing: {source_name}")
        print(f"ID: {source_id}")
        print("=" * 40)

        # Create source work directory
        source_work_dir = f"{work_dir}/{source_id}"
        run_shell_command(f"mkdir -p {source_work_dir}")

        # Source path
        source_path = repo_root / "source" / source_file

        if not source_path.exists():
            error_msg = f"Source file not found: {source_path}"
            print(f"ERROR: {error_msg}")

            # Log to memory
            memory_entry = f"\n## Source {source_id} Failed - {datetime.utcnow().isoformat()}\n"
            memory_entry += f"{error_msg}\n---\n"
            append_to_file(memory_file, memory_entry)

            state["errors"].append(error_msg)
            continue

        # Read README automation section for collection prompt
        readme_path = repo_root / "README.md"
        with open(readme_path, 'r') as f:
            readme_content = f.read()

        # Extract collection prompt template (lines 188-423)
        prompt_start = readme_content.find("# World Event Collection Task")
        prompt_end = readme_content.find("PROMPT_EOF", prompt_start)

        if prompt_start == -1 or prompt_end == -1:
            state["errors"].append("Could not find collection prompt in README")
            continue

        collection_prompt = readme_content[prompt_start:prompt_end].strip()

        # Replace placeholders
        collection_prompt = collection_prompt.replace(
            "Read detailed collection instructions from source file",
            f"Read from {source_path}"
        )
        collection_prompt = collection_prompt.replace(
            "Save all output to work directory",
            f"Save to {source_work_dir}"
        )
        collection_prompt = collection_prompt.replace(
            "work-dir/",
            f"{source_work_dir}/"
        )

        # Save prompt to file
        prompt_file = f"{source_work_dir}/collection-prompt.md"
        with open(prompt_file, 'w') as f:
            f.write(collection_prompt)

        # Execute Sandcastle agent
        print(f"Starting Sandcastle agent for {source_name}...")

        sandcastle_cli = repo_root / "bin" / "sandcastle" / "cli.js"

        exit_code, stdout, stderr = run_shell_command(f"""
            node {sandcastle_cli} run \
                --agent "claude-sonnet-4-5" \
                --sandbox docker \
                --branch-strategy head \
                --prompt-file {prompt_file} \
                --max-iterations 3 \
                --idle-timeout 600 \
                --cwd {repo_root}
        """, cwd=repo_root, stream_output=True, timeout=900)

        if exit_code != 0:
            error_msg = f"Source {source_id} collection failed with exit code {exit_code}"
            print(f"ERROR: {error_msg}")

            # Log failure to memory
            memory_entry = f"\n## Source {source_id} Failed - {datetime.utcnow().isoformat()}\n"
            memory_entry += f"Sandcastle agent failed with exit code {exit_code}\n"
            memory_entry += "Review Sandcastle logs for details.\n---\n"
            append_to_file(memory_file, memory_entry)

            state["errors"].append(error_msg)
            continue

        print(f"✓ Completed processing {source_name}")
        state["sources_processed"] += 1

    return state


def validate_events_node(state: CollectionState) -> CollectionState:
    """
    Validate collected events against schema.

    Implements README lines 468-534: Validate Collected Events
    """
    print("\n" + "=" * 60)
    print("Step 4: Validating Collected Events")
    print("=" * 60)

    repo_root = Path(state["repo_root"])
    work_dir = state["work_dir"]

    # Find all JSONL files in work directory
    exit_code, stdout, _ = run_shell_command(
        f'find {work_dir} -name "events.jsonl" -type f'
    )

    if exit_code != 0 or not stdout.strip():
        print("No events collected (no JSONL files found)")
        print("This is OK if sources had no new data")
        return state

    jsonl_files = stdout.strip().split('\n')

    # Validate each file
    total_events = 0

    for file_path in jsonl_files:
        print(f"Validating: {file_path}")

        # Use validation script
        validate_script = repo_root / "data" / "scripts" / "validate-events.js"

        exit_code, stdout, stderr = run_shell_command(
            f"node {validate_script} {file_path}"
        )

        if exit_code != 0:
            error_msg = f"Validation failed for {file_path}: {stderr}"
            print(f"ERROR: {error_msg}")
            state["errors"].append(error_msg)
            state["success"] = False
            return state

        # Count events
        events = read_jsonl_file(Path(file_path))
        event_count = len(events)
        total_events += event_count

        print(f"✓ Validated {event_count} events in {file_path}")

    print(f"✓ Validation complete: {total_events} total events")
    state["events_collected"] = total_events

    return state


def move_data_node(state: CollectionState) -> CollectionState:
    """
    Move events and media to data folder.

    Implements README lines 545-627: Move Events to Data Folder + Handle Media
    """
    print("\n" + "=" * 60)
    print("Step 5: Moving Data to Storage")
    print("=" * 60)

    repo_root = Path(state["repo_root"])
    work_dir = state["work_dir"]

    # Calculate date paths
    year_month = datetime.now().strftime("%Y-%m")
    date = datetime.now().strftime("%Y-%m-%d")

    # Create directory structure
    events_dir = repo_root / "data" / "events" / year_month
    events_dir.mkdir(parents=True, exist_ok=True)

    target_file = events_dir / f"{date}.jsonl"
    target_file.touch(exist_ok=True)

    # Consolidate JSONL files
    temp_combined = f"{work_dir}/combined.jsonl"

    exit_code, _, _ = run_shell_command(
        f'find {work_dir} -name "events.jsonl" -type f -exec cat {{}} \\; > {temp_combined}'
    )

    if exit_code == 0 and Path(temp_combined).exists() and Path(temp_combined).stat().st_size > 0:
        # Append to target
        run_shell_command(f"cat {temp_combined} >> {target_file}")

        # Deduplicate by ID
        temp_sorted = f"{work_dir}/sorted.jsonl"
        run_shell_command(
            f'sort -t\'"\' -k4,4 -u {target_file} > {temp_sorted} && mv {temp_sorted} {target_file}'
        )

        final_count = len(read_jsonl_file(target_file))
        print(f"✓ Saved {final_count} total events to {target_file}")

        state["events_file"] = str(target_file)
    else:
        print("No new events to save")

    # Handle media files
    print("\n" + "=" * 40)
    print("Organizing Media Files")
    print("=" * 40)

    media_images_dir = repo_root / "data" / "media" / year_month / "images" / date
    media_videos_dir = repo_root / "data" / "media" / year_month / "videos" / date

    media_images_dir.mkdir(parents=True, exist_ok=True)
    media_videos_dir.mkdir(parents=True, exist_ok=True)

    # Move images
    run_shell_command(f"""
        find {work_dir}/media -type f \\( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.gif" \\) \
        -exec mv {{}} {media_images_dir}/ \\; 2>/dev/null || true
    """)

    # Move videos
    run_shell_command(f"""
        find {work_dir}/media -type f \\( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" \\) \
        -exec mv {{}} {media_videos_dir}/ \\; 2>/dev/null || true
    """)

    # Count media files
    img_count = len(list(media_images_dir.glob("*"))) if media_images_dir.exists() else 0
    vid_count = len(list(media_videos_dir.glob("*"))) if media_videos_dir.exists() else 0

    print(f"✓ Moved {img_count} images and {vid_count} videos")

    state["media_files_downloaded"] = img_count + vid_count

    return state


def update_memory_node(state: CollectionState) -> CollectionState:
    """
    Update memory file with learnings.

    Implements README lines 630-654: Update Memory File
    """
    print("\n" + "=" * 60)
    print("Step 6: Updating Memory")
    print("=" * 60)

    repo_root = Path(state["repo_root"])
    work_dir = state["work_dir"]
    memory_file = repo_root / "memory.md"

    # Consolidate new memory entries
    exit_code, stdout, _ = run_shell_command(
        f'find {work_dir} -name "new-memory.md" -type f'
    )

    if exit_code == 0 and stdout.strip():
        memory_files = stdout.strip().split('\n')

        for mem_file in memory_files:
            if Path(mem_file).stat().st_size > 0:
                with open(mem_file, 'r') as f:
                    content = f.read()

                append_to_file(memory_file, "\n" + content)
                print(f"✓ Appended learnings from {mem_file}")

    # Trim memory file if too large (keep last 500 lines)
    if memory_file.exists():
        with open(memory_file, 'r') as f:
            lines = f.readlines()

        if len(lines) > 500:
            with open(memory_file, 'w') as f:
                f.writelines(lines[-500:])
            print("✓ Trimmed memory file to 500 lines")

    return state


def commit_results_node(state: CollectionState) -> CollectionState:
    """
    Commit and push results.

    Implements README lines 661-717: Commit Results
    """
    print("\n" + "=" * 60)
    print("Step 7: Committing Results")
    print("=" * 60)

    repo_root = Path(state["repo_root"])

    # Calculate date paths
    year_month = datetime.now().strftime("%Y-%m")
    date = datetime.now().strftime("%Y-%m-%d")

    # Files to commit
    files_to_commit = [
        f"data/events/{year_month}/{date}.jsonl",
        f"data/media/{year_month}/",
        "memory.md"
    ]

    # Create commit message
    events_count = state.get("events_collected", 0)
    source_ids = ",".join([s.get("id", "") for s in state.get("active_sources", [])])

    commit_message = f"""Collect {events_count} world events on {date}

Automated OSINT collection run at {datetime.utcnow().isoformat()}

Sources processed: {source_ids}

Data format: JSONL (JSON Lines)
Storage: data/events/{year_month}/{date}.jsonl
Media: data/media/{year_month}/{{images,videos}}/{date}/

[skip ci]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"""

    success, error_msg = git_add_commit_push(
        repo_root,
        files_to_commit,
        commit_message,
        push=True
    )

    if not success:
        if "No changes to commit" in error_msg:
            print("No changes to commit (no new events collected)")
        else:
            print(f"ERROR: {error_msg}")
            state["errors"].append(error_msg)
            state["success"] = False
            return state

    print(f"✓ Created commit with {events_count} events")
    print("✓ Pushed to remote repository")

    return state


def cleanup_node(state: CollectionState) -> CollectionState:
    """
    Cleanup temporary work directory.

    Implements README lines 729-748: Cleanup
    """
    print("\n" + "=" * 60)
    print("Step 8: Cleanup")
    print("=" * 60)

    work_dir = state.get("work_dir")

    if work_dir and Path(work_dir).exists():
        run_shell_command(f"rm -rf {work_dir}")
        print(f"✓ Removed work directory: {work_dir}")

    return state


def report_results_node(state: CollectionState) -> CollectionState:
    """
    Report final results.
    """
    print("\n" + "=" * 60)
    print("Collection Complete")
    print("=" * 60)

    print(f"Events collected: {state.get('events_collected', 0)}")
    print(f"Sources processed: {state.get('sources_processed', 0)}/{len(state.get('active_sources', []))}")
    print(f"Media files: {state.get('media_files_downloaded', 0)}")

    if state.get("events_file"):
        print(f"Storage: {state['events_file']}")

    if state.get("errors"):
        print(f"\n⚠️  Errors: {len(state['errors'])}")
        for error in state["errors"]:
            print(f"  - {error}")

    # Set final success state
    if not state.get("success"):
        state["success"] = len(state.get("errors", [])) == 0

    return state


def create_collection_graph(config: Dict[str, Any], automation_section: str) -> StateGraph:
    """
    Create the LangGraph workflow for OSINT collection.

    Args:
        config: Configuration dictionary
        automation_section: Automation instructions from README

    Returns:
        Configured StateGraph
    """
    # Create graph
    workflow = StateGraph(CollectionState)

    # Add nodes
    workflow.add_node("load_sources", load_sources_node)
    workflow.add_node("create_work_dir", create_work_dir_node)
    workflow.add_node("process_sources", process_sources_node)
    workflow.add_node("validate_events", validate_events_node)
    workflow.add_node("move_data", move_data_node)
    workflow.add_node("update_memory", update_memory_node)
    workflow.add_node("commit_results", commit_results_node)
    workflow.add_node("cleanup", cleanup_node)
    workflow.add_node("report_results", report_results_node)

    # Define edges
    workflow.set_entry_point("load_sources")

    workflow.add_edge("load_sources", "create_work_dir")
    workflow.add_edge("create_work_dir", "process_sources")
    workflow.add_edge("process_sources", "validate_events")
    workflow.add_edge("validate_events", "move_data")
    workflow.add_edge("move_data", "update_memory")
    workflow.add_edge("update_memory", "commit_results")
    workflow.add_edge("commit_results", "cleanup")
    workflow.add_edge("cleanup", "report_results")
    workflow.add_edge("report_results", END)

    return workflow.compile()
