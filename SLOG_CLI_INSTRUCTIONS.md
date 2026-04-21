# SlugLog CLI — Instructions for Claude Code

Log your work using the `slog` command. Use timers so you don't have to guess hours.

## Timer workflow (preferred)

```bash
slog start "Fixing DMX race condition"                        # Start timer
slog start "Fixing DMX race condition" --project "Connected Lighting"  # With project
slog status                                                    # Check what's running
slog stop                                                      # Stop timer, auto-logs hours
```

- Starting a new task auto-stops and logs the previous one
- Hours are calculated from elapsed time and slug-budgeted to fit an 8h day
- Use `slog start` at the beginning of a task, `slog stop` when done

## Quick log (when you know the hours)

```bash
slog log "What you did" 1.5
slog log "Fixed bug" 2.0 --project "My Project" --pn 6003 --area bug
```

### Areas

`programming`, `testing`, `bug`, `meeting`, `documenting`, `investigating`

## View entries

```bash
slog today    # Today's entries
slog week     # This week's summary
slog status   # What's currently running
```

## Guidelines

- Prefer `slog start` / `slog stop` over guessing hours with `slog log`
- Keep descriptions concise but specific
- Include `--project` if you know it
- Always `slog stop` before ending a session
