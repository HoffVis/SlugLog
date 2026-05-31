import { useState, useEffect, useCallback } from "react";
import { getAllEntries } from "../lib/commands";
import { EditableEntryCard } from "./EditableEntryCard";
import type { Entry } from "../lib/types";
import "./AllEntries.css";

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AllEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await getAllEntries());
    } catch (err) {
      console.error("Failed to load entries:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group entries by date
  const filtered = filter
    ? entries.filter(
        (e) =>
          e.description.toLowerCase().includes(filter.toLowerCase()) ||
          (e.project ?? "").toLowerCase().includes(filter.toLowerCase()) ||
          (e.area ?? "").toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  const grouped: { date: string; entries: Entry[]; hours: number }[] = [];
  let currentDate = "";
  for (const entry of filtered) {
    if (entry.date !== currentDate) {
      currentDate = entry.date;
      grouped.push({ date: entry.date, entries: [], hours: 0 });
    }
    const group = grouped[grouped.length - 1];
    group.entries.push(entry);
    group.hours += entry.hours;
  }

  const totalHours = filtered.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="all-entries">
      <div className="all-entries-header">
        <div className="all-entries-title-row">
          <h2 className="all-entries-title">All Entries</h2>
          <span className="all-entries-stats">
            {filtered.length} entries &middot; {totalHours.toFixed(1)}h total
          </span>
        </div>
        <input
          className="all-entries-search"
          type="text"
          placeholder="Filter by description, project, or area..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="all-entries-loading">Loading...</div>
      ) : grouped.length === 0 ? (
        <div className="all-entries-empty">
          {filter ? "No entries match your filter." : "No entries yet. The slug awaits."}
        </div>
      ) : (
        <div className="all-entries-list">
          {grouped.map((group) => (
            <div key={group.date} className="all-entries-day">
              <div className="all-entries-day-header">
                <span className="all-entries-day-label">
                  {formatDateHeading(group.date)}
                </span>
                <span className="all-entries-day-hours">
                  {group.hours.toFixed(1)}h
                </span>
              </div>
              {group.entries.map((entry) => (
                <EditableEntryCard key={entry.id} entry={entry} onUpdate={load} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
