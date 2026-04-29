# OSINT Collection Orchestrator

Python AI agentic framework using LangGraph to orchestrate world event collection via Sandcastle and Claude Code agents.

## Purpose

The orchestrator reads automation instructions from the root `README.md` and executes them as a deterministic workflow graph. It manages:

- Source loading and filtering (active sources only)
- Sequential source processing via Sandcastle
- Event validation against schema
- Data organization and storage
- Git operations (commit and push)
- Memory management (learning from errors)

## Architecture

### Technology Stack

- **LangGraph**: Workflow orchestration with state management
- **Python 3.11+**: Core runtime
- **Anthropic API**: Claude integration via Sandcastle
- **Subprocess**: Shell command execution for Git, Docker, Node CLIs

### Workflow Graph

```
┌──────────────┐
│Load Sources  │  → Read source/manifest.json, filter active
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Create Work   │  → Create /tmp/osint-collection-TIMESTAMP/
│Directory     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Process       │  → For each source:
│Sources       │    - Invoke Sandcastle with collection prompt
│(Sequential)  │    - Agent uses skills (browser, search, markdown)
└──────┬───────┘    - Outputs events.jsonl and media
       │
       ▼
┌──────────────┐
│Validate      │  → Run data/scripts/validate-events.js
│Events        │    - Check schema compliance
└──────┬───────┘    - Verify E-PRIME in contents
       │
       ▼
┌──────────────┐
│Move Data     │  → Move to data/events/YYYY-MM/YYYY-MM-DD.jsonl
│              │    Move to data/media/YYYY-MM/{images,videos}/
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Update Memory │  → Append learnings to memory.md
│              │    Trim to last 500 lines
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Commit & Push │  → Git add, commit, push
│              │    Includes [skip ci] to avoid loops
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Cleanup       │  → Remove work directory
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Report        │  → Print final statistics
│Results       │    Exit with appropriate code
└──────────────┘
```

### State Management

The `CollectionState` TypedDict tracks:

```python
{
    "repo_root": str,              # Repository root path
    "timestamp": str,              # Run start time (ISO 8601)
    "active_sources": List[dict],  # Sources to process
    "sources_processed": int,      # Count of successful sources
    "events_collected": int,       # Total events gathered
    "media_files_downloaded": int, # Total media files
    "errors": List[str],           # Error messages
    "warnings": List[str],         # Warning messages
    "success": bool,               # Final success state
    "work_dir": str,               # Temporary work directory
    "events_file": str,            # Path to final JSONL file
    # ... additional fields
}
```

State flows through each node, accumulating results and errors.

## Modules

### `main.py`

Entry point. Responsibilities:
- Load environment variables
- Validate prerequisites (Git, Docker, Node, API keys)
- Read automation instructions from README
- Initialize LangGraph workflow
- Execute workflow and report results

**Exit Codes**:
- `0`: Success (even if zero events collected)
- `1`: Critical failure (validation error, git push failure)

### `agent.py`

Defines LangGraph nodes and creates the workflow graph. Each node corresponds to a step in the README automation instructions:

| Node | README Lines | Function |
|------|--------------|----------|
| `load_sources_node` | 92-119 | Load and filter active sources |
| `create_work_dir_node` | 124-137 | Create temporary work directory |
| `process_sources_node` | 142-456 | Process sources via Sandcastle |
| `validate_events_node` | 468-534 | Validate collected events |
| `move_data_node` | 545-627 | Organize data and media |
| `update_memory_node` | 630-654 | Update memory.md |
| `commit_results_node` | 661-717 | Git operations |
| `cleanup_node` | 729-748 | Remove work directory |
| `report_results_node` | - | Print final report |

### `tools.py`

Utilities for node execution:

- `run_shell_command()`: Execute bash commands with output streaming
- `load_json_file()`: Parse JSON files (manifest, config)
- `read_jsonl_file()`: Read JSONL event files
- `git_add_commit_push()`: Git workflow with retry logic
- `append_to_file()`: Append to memory.md

### `state.py`

Defines `CollectionState` TypedDict for workflow state management.

### `config.py`

Configuration and validation:

- `load_config()`: Load environment variables and config
- `validate_environment()`: Check prerequisites (Git, Docker, Node, API keys)
- `extract_readme_section()`: Extract automation instructions from README

## Usage

### Local Execution

```bash
# Setup environment
export ANTHROPIC_API_KEY="your-claude-api-key"
export REPO_ROOT=$(pwd)

# Install dependencies
pip install -r requirements.txt

# Run orchestrator
python -m orchestrator.main
```

### GitHub Actions

Automatically runs via `.github/workflows/hourly-collection.yml` every hour.

See `.github/workflows/README.md` for details.

### Manual Testing

Test individual steps:

```bash
# Test environment validation
python -c "from orchestrator.config import load_config, validate_environment; from pathlib import Path; import os; validate_environment(load_config(Path(os.getcwd())))"

# Test source loading
python -c "from orchestrator.tools import load_json_file; from pathlib import Path; import json; print(json.dumps(load_json_file(Path('source/manifest.json')), indent=2))"

# Test JSONL reading
python -c "from orchestrator.tools import read_jsonl_file; from pathlib import Path; import os; from datetime import datetime; file=Path(f'data/events/{datetime.now().strftime(\"%Y-%m\")}/{datetime.now().strftime(\"%Y-%m-%d\")}.jsonl'); print(f'Events: {len(read_jsonl_file(file))}')"
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REPO_ROOT` | Repository root directory | No | Current directory |
| `ANTHROPIC_API_KEY` | Claude API key | Yes | - |
| `TWITTER_BEARER_TOKEN` | Twitter API token | No | - |
| `PERPLEXITY_API_KEY` | Perplexity API key | No | - |
| `MAX_ITERATIONS` | Sandcastle max iterations | No | 3 |
| `TIMEOUT_MINUTES` | Overall timeout | No | 50 |

### Prerequisites Checked

The orchestrator validates:

✅ **Directories exist**:
- `source/`
- `data/`
- `skills/`
- `bin/`

✅ **Files exist**:
- `README.md`
- `source/manifest.json`
- `data/SCHEMA.md`

✅ **CLI tools available**:
- `node` (Node.js runtime)
- `git` (Version control)
- `jq` (JSON processor)
- `docker` (Container runtime)

✅ **Node dependencies installed**:
- `bin/sandcastle/node_modules/`
- `bin/agent-browser/node_modules/`
- `bin/data-to-markdown/node_modules/`

✅ **Git configured**:
- `user.name` set
- `user.email` set

## Error Handling

### Philosophy

**Continue on source failure, abort on data corruption**

- **Source collection fails**: Log error to memory.md, continue to next source
- **Validation fails**: Abort workflow, exit code 1 (don't commit bad data)
- **Git push fails**: Retry once with pull/rebase, then abort if still fails

### Error Logging

Errors logged to:
1. **Console**: Printed during execution
2. **State**: Accumulated in `state["errors"]`
3. **Memory**: Persistent in `memory.md` for non-obvious issues

### Exit Codes

- `0`: Success (OR no active sources, expected state)
- `1`: Critical failure requiring attention

## Integration with Existing Systems

### Sandcastle

Orchestrator invokes Sandcastle via Node CLI:

```bash
node bin/sandcastle/cli.js run \
  --agent "claude-sonnet-4-5" \
  --sandbox docker \
  --prompt-file <path-to-prompt> \
  --max-iterations 3
```

Sandcastle provides:
- Docker isolation
- Claude Code agent execution
- Iteration management
- Git branch operations

### Skills

Skills invoked by Sandcastle agents, not directly by orchestrator:

- `agent-browser` - Web scraping and Twitter data collection
- `perplexity-search` - AI-powered web research
- `data-to-markdown` - E-PRIME transformation
- `world-event-entities` - Schema validation
- `remember-as-you-go` - Memory logging

### Data Scripts

Orchestrator calls existing validation scripts:

```bash
node data/scripts/validate-events.js <path-to-jsonl>
```

No changes needed to existing scripts.

## Debugging

### Enable Verbose Output

Orchestrator already streams output from Sandcastle in real-time.

For additional debugging:

```python
# Add to main.py before graph.invoke()
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Inspect State

State after each node is available in the returned result:

```python
result = graph.invoke(initial_state)

print(f"Final state: {result}")
print(f"Errors: {result['errors']}")
print(f"Events collected: {result['events_collected']}")
```

### Check Memory

Review `memory.md` for persistent error patterns:

```bash
# Recent errors
tail -50 memory.md

# Errors by source
grep "Source.*Failed" memory.md

# Recurring issues
grep "ERROR:" memory.md | sort | uniq -c | sort -rn
```

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not set"

**Solution**: Export environment variable

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Issue: "Git user.name not configured"

**Solution**: Configure Git

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

### Issue: "Docker not found"

**Solution**: Ensure Docker running

```bash
# Check Docker status
docker ps

# Start Docker Desktop (macOS)
open -a Docker

# Start Docker daemon (Linux)
sudo systemctl start docker
```

### Issue: "Node dependencies not installed"

**Solution**: Install dependencies

```bash
cd bin/sandcastle && npm install && cd ../..
cd bin/agent-browser && npm install && cd ../..
cd bin/data-to-markdown && npm install && cd ../..
```

### Issue: Workflow hangs

**Causes**:
- Sandcastle agent stuck
- Docker container not responding
- Network timeout

**Solution**: Set timeouts in shell commands

```python
# In tools.py, increase timeout parameter
run_shell_command(command, timeout=1800)  # 30 minutes
```

## Development

### Adding New Nodes

1. Define node function in `agent.py`:

```python
def new_node(state: CollectionState) -> CollectionState:
    """Description of what this node does."""
    # Implement logic
    return state
```

2. Add node to graph:

```python
workflow.add_node("new_node", new_node)
```

3. Connect with edges:

```python
workflow.add_edge("previous_node", "new_node")
workflow.add_edge("new_node", "next_node")
```

### Testing Changes

Run orchestrator locally with test source:

```bash
# Create test source with status: "active"
# Run orchestrator
python -m orchestrator.main

# Verify output
ls -lh data/events/$(date +%Y-%m)/
```

### Updating Prompts

Collection prompt template lives in README.md (lines 188-423).

Orchestrator extracts and injects it into Sandcastle. To modify:

1. Edit README.md prompt template
2. Test locally
3. Commit changes
4. Workflow uses new prompt automatically

## Performance

**Current benchmarks** (per run):

- **Setup**: ~30 seconds (Node deps cached)
- **Per source**: ~5-10 minutes (varies by source complexity)
- **Validation**: ~10 seconds
- **Git operations**: ~5 seconds

**Total for 3 sources**: ~20-35 minutes

**Optimization opportunities**:
- Cache Docker images for Sandcastle
- Reduce Sandcastle iterations (currently 3)
- Process only sources with recent activity

## Future Enhancements

- **Parallel source processing**: Currently sequential for rate limit safety
- **Checkpointing**: Resume from last successful step on failure
- **Metrics collection**: Track success rates, processing times
- **Auto-tuning**: Adjust iteration counts based on source complexity
- **LangSmith integration**: Observability for LangGraph workflow

---

## Related Documentation

- **GitHub Actions Workflows**: `.github/workflows/README.md`
- **Automation Instructions**: Root `README.md` (lines 49-786)
- **Data Schema**: `data/SCHEMA.md`
- **Skills**: `skills/README.md`

---

**Last Updated**: 2026-04-29
