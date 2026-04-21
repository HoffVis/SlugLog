# SlugLog CLI — Instructions for Claude Code

Log your work using the `slug` command. Use timers so you don't have to guess hours.

## Timer workflow (preferred)

```bash
slug start "Task description"                          # Start timer
slug start "Task description" --project "Project Name" # With project
slug stop                                              # Stop timer, auto-logs hours
slug status                                            # Check what's running
```

- Starting a new task auto-stops and logs the previous one
- Hours are calculated from elapsed time and slug-budgeted to fit an 8h day
- Always `slug stop` before ending a session

## Quick log (when you know the hours)

```bash
slug log "What you did" 1.5
slug log "Fixed bug" 2.0 --project "Project Name" --pn 6003 --area bug
```

### Areas

`programming`, `testing`, `bug`, `meeting`, `documenting`, `investigating`

## View entries

```bash
slug today    # Today's entries
slug week     # This week's summary
```

## Guidelines

- Prefer `slug start` / `slug stop` over guessing hours with `slug log`
- Keep descriptions concise but specific
- Include `--project` if you know it
- Always `slug stop` before ending a session
