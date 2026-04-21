import { useState } from "react";
import "./CliPage.css";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? "\u2713 Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="cli-code-block">
      {label && <div className="cli-code-label">{label}</div>}
      <pre className="cli-code"><code>{code}</code></pre>
      <CopyButton text={code} />
    </div>
  );
}

export function CliPage() {
  return (
    <div className="cli-page">
      <h1 className="cli-title">CLI Reference</h1>
      <p className="cli-intro">
        Use the <code>slug</code> command from any terminal. Claude Code can use it too — run <code>slug-init</code> in a project to add instructions to CLAUDE.md.
      </p>

      {/* Setup */}
      <section className="cli-section">
        <h2>Setup</h2>
        <p className="cli-text">
          The CLI is available globally after adding it to your PATH. If not set up yet:
        </p>
        <CodeBlock
          label="Add to ~/.zshrc"
          code='export PATH="/Users/th2025/Desktop/BBS_APPS/SLOG/target/debug:$PATH"'
        />
        <CodeBlock
          label="Add SlugLog to a project's CLAUDE.md"
          code="slug-init"
        />
      </section>

      {/* Timer */}
      <section className="cli-section">
        <h2>Timer Workflow</h2>
        <p className="cli-text">
          The preferred way to log. Start a timer, do your work, stop it. Hours are calculated automatically and slug-budgeted to fit your day.
        </p>
        <CodeBlock
          label="Start a timer"
          code='slug start "Implementing DMX fade engine"'
        />
        <CodeBlock
          label="Start with project"
          code='slug start "Fixing serial port bug" --project "Connected Lighting"'
        />
        <CodeBlock
          label="Check what's running"
          code="slug status"
        />
        <CodeBlock
          label="Stop and auto-log"
          code="slug stop"
        />
        <div className="cli-note">
          Starting a new timer auto-stops the previous one and logs it.
        </div>
      </section>

      {/* Quick log */}
      <section className="cli-section">
        <h2>Quick Log</h2>
        <p className="cli-text">
          When you know the hours and just want to record something quickly.
        </p>
        <CodeBlock
          label="Simple — just description and hours"
          code='slug log "Fixed DMX race condition" 2.5'
        />
        <CodeBlock
          label="With all details"
          code='slug log "Updated safety docs" 1.0 --project "Reflect Color Studio" --pn 6003 --area documenting'
        />
      </section>

      {/* Areas */}
      <section className="cli-section">
        <h2>Task Areas</h2>
        <div className="cli-areas">
          {[
            { flag: "programming", color: "var(--color-programming)" },
            { flag: "testing", color: "var(--color-testing)" },
            { flag: "bug", color: "var(--color-bug)" },
            { flag: "meeting", color: "var(--color-meeting)" },
            { flag: "documenting", color: "var(--color-documenting)" },
            { flag: "investigating", color: "var(--color-investigating)" },
          ].map((a) => (
            <div key={a.flag} className="cli-area-chip">
              <span className="cli-area-dot" style={{ background: a.color }} />
              <code>--area {a.flag}</code>
            </div>
          ))}
        </div>
      </section>

      {/* View */}
      <section className="cli-section">
        <h2>View Entries</h2>
        <CodeBlock label="Today's entries" code="slug today" />
        <CodeBlock label="This week's summary" code="slug week" />
      </section>

      {/* All commands */}
      <section className="cli-section">
        <h2>All Commands</h2>
        <table className="cli-table">
          <thead>
            <tr>
              <th>Command</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>slug start "desc"</code></td><td>Start timer on a task</td></tr>
            <tr><td><code>slug stop</code></td><td>Stop timer, auto-log hours</td></tr>
            <tr><td><code>slug status</code></td><td>Show running timer</td></tr>
            <tr><td><code>slug log "desc" hours</code></td><td>Quick log with known hours</td></tr>
            <tr><td><code>slug today</code></td><td>Show today's entries</td></tr>
            <tr><td><code>slug week</code></td><td>Show this week's summary</td></tr>
            <tr><td><code>slug-init</code></td><td>Add slug instructions to CLAUDE.md</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
