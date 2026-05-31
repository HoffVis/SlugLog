import { useState } from "react";
import { getCommitsForDate } from "../lib/commands";
import type { DayCommitGroup } from "../lib/types";
import "./DayCommits.css";

interface Props {
  date: string;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

export function DayCommits({ date }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [groups, setGroups] = useState<DayCommitGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoading(true);
      setError(null);
      try {
        const data = await getCommitsForDate(date);
        setGroups(data);
        setLoaded(true);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const totalCommits = groups.reduce((sum, g) => sum + g.commits.length, 0);
  const summary = loaded
    ? totalCommits === 0
      ? "no commits"
      : `${totalCommits} commit${totalCommits === 1 ? "" : "s"} · ${groups.length} repo${groups.length === 1 ? "" : "s"}`
    : "commits";

  return (
    <div className={`day-commits ${open ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
      <button className="day-commits-toggle" onClick={toggle}>
        <span className="day-commits-caret">{open ? "▾" : "▸"}</span>
        <span className="day-commits-label">{summary}</span>
        {loading && <span className="day-commits-loading">loading…</span>}
      </button>
      {open && loaded && (
        <div className="day-commits-body">
          {error && <div className="day-commits-error">{error}</div>}
          {!error && groups.length === 0 && (
            <div className="day-commits-empty">No commits on this day.</div>
          )}
          {groups.map((g) => (
            <div key={g.repo} className="day-commits-group">
              <div className="day-commits-repo">
                <span className="day-commits-repo-name">{g.repo}</span>
                <span className="day-commits-repo-count">{g.commits.length}</span>
              </div>
              <ul className="day-commits-list">
                {g.commits.map((c) => (
                  <li key={c.sha} className="day-commits-item">
                    <span className="day-commits-time">{formatTime(c.timestamp)}</span>
                    <span className="day-commits-msg" title={c.message}>{c.message}</span>
                    {!c.pushed && <span className="day-commits-badge">local</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
