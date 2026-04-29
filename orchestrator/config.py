"""
Configuration management for OSINT orchestrator.

Loads configuration from environment variables and validates prerequisites.
"""

import os
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional


def load_config(repo_root: Path) -> Dict[str, Any]:
    """
    Load configuration from environment and repository.

    Args:
        repo_root: Path to repository root

    Returns:
        Configuration dictionary
    """
    config = {
        "repo_root": repo_root,
        "anthropic_api_key": os.getenv("ANTHROPIC_API_KEY"),
        "twitter_bearer_token": os.getenv("TWITTER_BEARER_TOKEN"),
        "perplexity_api_key": os.getenv("PERPLEXITY_API_KEY"),
        "github_run_id": os.getenv("GITHUB_RUN_ID"),
        "github_run_number": os.getenv("GITHUB_RUN_NUMBER"),
        "max_iterations": int(os.getenv("MAX_ITERATIONS", "3")),
        "timeout_minutes": int(os.getenv("TIMEOUT_MINUTES", "50")),
    }

    return config


def validate_environment(config: Dict[str, Any]) -> bool:
    """
    Validate that all prerequisites are met.

    Args:
        config: Configuration dictionary

    Returns:
        True if environment is valid, False otherwise
    """
    errors = []

    # Check required environment variables
    if not config.get("anthropic_api_key"):
        errors.append("ANTHROPIC_API_KEY environment variable not set")

    # Check repository structure
    repo_root = Path(config["repo_root"])

    required_dirs = [
        repo_root / "source",
        repo_root / "data",
        repo_root / "skills",
        repo_root / "bin",
    ]

    for directory in required_dirs:
        if not directory.exists():
            errors.append(f"Required directory not found: {directory}")

    required_files = [
        repo_root / "README.md",
        repo_root / "source" / "manifest.json",
        repo_root / "data" / "SCHEMA.md",
    ]

    for file_path in required_files:
        if not file_path.exists():
            errors.append(f"Required file not found: {file_path}")

    # Check CLI tools available
    cli_tools = ["node", "git", "jq", "docker"]

    for tool in cli_tools:
        try:
            subprocess.run(
                ["which", tool],
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError:
            errors.append(f"Required CLI tool not found: {tool}")

    # Check git configuration
    try:
        subprocess.run(
            ["git", "config", "user.name"],
            check=True,
            capture_output=True,
            cwd=repo_root
        )
        subprocess.run(
            ["git", "config", "user.email"],
            check=True,
            capture_output=True,
            cwd=repo_root
        )
    except subprocess.CalledProcessError:
        errors.append("Git user.name and user.email not configured")

    # Check Node dependencies installed (only for packages that have dependencies)
    # Check sandcastle which has actual dependencies
    sandcastle_deps = repo_root / "bin" / "sandcastle" / "node_modules"
    if not sandcastle_deps.exists():
        errors.append(f"Node dependencies not installed: {sandcastle_deps.parent}")

    # Note: agent-browser and data-to-markdown have no dependencies in package.json,
    # so they won't have node_modules directories after npm ci

    # Print validation results
    if errors:
        print("❌ Environment validation failed:")
        for error in errors:
            print(f"  - {error}")
        return False

    print("✅ Environment validation passed")
    return True


def extract_readme_section(
    readme_path: Path,
    start_marker: str,
    end_marker: Optional[str] = None
) -> str:
    """
    Extract a section from README.md between markers.

    Args:
        readme_path: Path to README.md
        start_marker: Section start marker (heading)
        end_marker: Section end marker (optional)

    Returns:
        Extracted section content
    """
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()

    start_idx = content.find(start_marker)
    if start_idx == -1:
        return ""

    if end_marker:
        end_idx = content.find(end_marker, start_idx)
        if end_idx == -1:
            return content[start_idx:]
        return content[start_idx:end_idx]

    return content[start_idx:]
