"""
Tools for executing shell commands and file operations.

Provides utilities for the LangGraph workflow nodes.
"""

import subprocess
import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple


def run_shell_command(
    command: str,
    cwd: Optional[Path] = None,
    env: Optional[Dict[str, str]] = None,
    timeout: Optional[int] = None,
    capture_output: bool = True,
    stream_output: bool = False
) -> Tuple[int, str, str]:
    """
    Execute a shell command and return results.

    Args:
        command: Shell command to execute
        cwd: Working directory
        env: Environment variables
        timeout: Timeout in seconds
        capture_output: Whether to capture stdout/stderr
        stream_output: Whether to stream output to console

    Returns:
        Tuple of (exit_code, stdout, stderr)
    """
    try:
        if stream_output:
            # Stream output in real-time
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=cwd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            stdout_lines = []
            stderr_lines = []

            # Stream stdout
            for line in process.stdout:
                print(line, end='')
                stdout_lines.append(line)

            # Get stderr
            stderr = process.stderr.read()
            if stderr:
                print(stderr, end='', file=sys.stderr)
                stderr_lines.append(stderr)

            process.wait(timeout=timeout)

            return (
                process.returncode,
                ''.join(stdout_lines),
                ''.join(stderr_lines)
            )
        else:
            # Capture output
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                env=env,
                capture_output=capture_output,
                text=True,
                timeout=timeout
            )

            return (
                result.returncode,
                result.stdout if result.stdout else "",
                result.stderr if result.stderr else ""
            )

    except subprocess.TimeoutExpired as e:
        return (124, "", f"Command timed out after {timeout} seconds")
    except Exception as e:
        return (1, "", str(e))


def load_json_file(file_path: Path) -> Optional[Dict[str, Any]]:
    """
    Load and parse a JSON file.

    Args:
        file_path: Path to JSON file

    Returns:
        Parsed JSON data or None on error
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading JSON file {file_path}: {e}")
        return None


def save_json_file(file_path: Path, data: Dict[str, Any]) -> bool:
    """
    Save data to a JSON file.

    Args:
        file_path: Path to JSON file
        data: Data to save

    Returns:
        True on success, False on error
    """
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving JSON file {file_path}: {e}")
        return False


def read_jsonl_file(file_path: Path) -> List[Dict[str, Any]]:
    """
    Read JSONL file and return list of objects.

    Args:
        file_path: Path to JSONL file

    Returns:
        List of parsed JSON objects
    """
    objects = []

    if not file_path.exists():
        return objects

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        obj = json.loads(line)
                        objects.append(obj)
                    except json.JSONDecodeError as e:
                        print(f"Error parsing JSONL line: {e}")
                        continue
    except Exception as e:
        print(f"Error reading JSONL file {file_path}: {e}")

    return objects


def append_to_file(file_path: Path, content: str) -> bool:
    """
    Append content to a file.

    Args:
        file_path: Path to file
        content: Content to append

    Returns:
        True on success, False on error
    """
    try:
        with open(file_path, 'a', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error appending to file {file_path}: {e}")
        return False


def git_add_commit_push(
    repo_root: Path,
    files: List[str],
    message: str,
    push: bool = True
) -> Tuple[bool, str]:
    """
    Git add, commit, and optionally push files.

    Args:
        repo_root: Repository root path
        files: List of files to add
        message: Commit message
        push: Whether to push to remote

    Returns:
        Tuple of (success, error_message)
    """
    # Stage files
    for file_path in files:
        exit_code, _, stderr = run_shell_command(
            f"git add {file_path}",
            cwd=repo_root
        )
        if exit_code != 0:
            return False, f"Failed to stage {file_path}: {stderr}"

    # Check if there are changes
    exit_code, stdout, _ = run_shell_command(
        "git diff --cached --quiet",
        cwd=repo_root
    )

    if exit_code == 0:
        # No changes to commit
        return True, "No changes to commit"

    # Commit
    # Escape single quotes in message
    escaped_message = message.replace("'", "'\\''")

    exit_code, _, stderr = run_shell_command(
        f"git commit -m '{escaped_message}'",
        cwd=repo_root
    )

    if exit_code != 0:
        return False, f"Failed to commit: {stderr}"

    if not push:
        return True, ""

    # Push
    exit_code, _, stderr = run_shell_command(
        "git push origin main",
        cwd=repo_root,
        timeout=300
    )

    if exit_code != 0:
        # Try pull and retry
        print("Push failed, attempting pull and retry...")
        exit_code, _, _ = run_shell_command(
            "git pull --rebase origin main",
            cwd=repo_root,
            timeout=300
        )

        if exit_code == 0:
            exit_code, _, stderr = run_shell_command(
                "git push origin main",
                cwd=repo_root,
                timeout=300
            )

        if exit_code != 0:
            return False, f"Failed to push after retry: {stderr}"

    return True, ""
