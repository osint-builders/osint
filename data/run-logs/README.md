# Run Logs

Per-run operational telemetry — the firehose that used to clutter `memory.md`.

Files are written by the cloud agent at the end of each run:

```
data/run-logs/YYYY-MM/YYYY-MM-DD.log
```

Contents include:
- `## Processing <source-id>` blocks
- `Created event: …` lines
- `[skip] dup url`, `[snap]`, `[skip] missing required field`
- Per-source parse counts and time-window outcomes

These logs are **never** read by the next run's prompt. For cross-run knowledge that should help the next agent, see `LEARNINGS.md` at the repo root.
