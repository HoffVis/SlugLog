import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getTodayEntries, createEntry, getWeekSummary } from "../lib/commands";
import { getISOWeek } from "../lib/dates";
import { AREA_LABELS } from "../lib/types";
import type { Entry, TaskArea, WeekSummary as WeekSummaryType } from "../lib/types";
import "./TrayPopup.css";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function TrayPopup() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<WeekSummaryType | null>(null);
  const [what, setWhat] = useState("");
  const [hours, setHours] = useState("");

  // Sync theme from localStorage (set by main window)
  useEffect(() => {
    const theme = localStorage.getItem("slog-theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const totalToday = entries.reduce((sum, e) => sum + e.hours, 0);

  const loadData = useCallback(async () => {
    try {
      const [e, s] = await Promise.all([
        getTodayEntries(),
        getWeekSummary(getISOWeek(today).year, getISOWeek(today).week),
      ]);
      setEntries(e);
      setSummary(s);
    } catch (err) {
      console.error("Failed to load:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    const h = parseFloat(hours);
    if (!what.trim() || isNaN(h) || h <= 0) return;
    await createEntry({ description: what.trim(), hours: h });
    setWhat("");
    setHours("");
    await loadData();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const openMainWindow = async () => {
    await invoke("open_main_window");
  };

  const maxDayHours = summary
    ? Math.max(...summary.by_day.map((d) => d.hours), 8)
    : 8;

  return (
    <div className="tray-popup">
      {/* Header */}
      <div className="tray-header">
        <div className="tray-header-left">
          <svg viewBox="0 0 40 40" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="20" cy="26" rx="14" ry="8" fill="var(--slug-green-dim)" stroke="var(--slug-green)" strokeWidth="1.5"/>
            <ellipse cx="24" cy="22" rx="8" ry="9" fill="var(--bg-surface)" stroke="var(--slug-green)" strokeWidth="1.2"/>
            <line x1="14" y1="22" x2="11" y2="14" stroke="var(--slug-green)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="18" y1="21" x2="16" y2="13" stroke="var(--slug-green)" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="11" cy="13" r="2" fill="var(--slug-green)"/>
            <circle cx="16" cy="12" r="2" fill="var(--slug-green)"/>
            <circle cx="11" cy="12.5" r="0.8" fill="var(--bg-deep)"/>
            <circle cx="16" cy="11.5" r="0.8" fill="var(--bg-deep)"/>
            <path d="M12 25 Q15 27 18 25" stroke="var(--slug-green)" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
          </svg>
          <div>
            <div className="tray-title">SlugLog</div>
            <div className="tray-today">{todayStr}</div>
          </div>
        </div>
        <div className="tray-hours-today">{totalToday.toFixed(1)}h today</div>
      </div>

      {/* Quick input */}
      <div className="tray-input-area">
        <div className="tray-input-row">
          <input
            className="tray-input-what"
            type="text"
            placeholder="What did you do?"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <input
            className="tray-input-hours"
            type="text"
            placeholder="1h"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="tray-log-btn" onClick={handleSubmit}>LOG</button>
        </div>
      </div>

      {/* Week mini bar */}
      {summary && (
        <div className="tray-week-bar">
          {summary.by_day.map((day, i) => {
            const isToday = day.date === new Date().toISOString().split("T")[0] ||
              day.date === (() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              })();
            return (
              <div key={day.date} className="tray-week-day">
                <div
                  className={`tray-week-bar-fill ${isToday ? "today" : day.hours > 0 ? "active" : ""}`}
                  style={{ height: `${Math.max((day.hours / maxDayHours) * 28, 2)}px` }}
                />
                <span className={`tray-week-day-label ${isToday ? "today" : ""}`}>
                  {DAY_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="tray-divider" />

      {/* Today's entries */}
      <div className="tray-entries-header">
        <span className="tray-entries-label">Today</span>
        <span className="tray-entries-label">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
      </div>
      <div className="tray-entries">
        {entries.length === 0 ? (
          <div className="tray-empty">No entries yet. Start slogging!</div>
        ) : (
          entries.map((entry) => {
            const areaClass = entry.area ?? "";
            const areaLabel = entry.area ? AREA_LABELS[entry.area as TaskArea] : null;
            return (
              <div key={entry.id} className="tray-entry">
                <div
                  className="tray-entry-color"
                  style={{
                    background: entry.area
                      ? `var(--color-${areaClass})`
                      : "var(--border-default)",
                  }}
                />
                <div className="tray-entry-info">
                  <div className="tray-entry-desc">{entry.description}</div>
                  <div className="tray-entry-meta">
                    {entry.project && (
                      <span className="tray-entry-project">{entry.project}</span>
                    )}
                    {areaLabel && (
                      <span
                        className={`tray-entry-area area-color-${areaClass} area-bg-${areaClass}`}
                      >
                        {areaLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="tray-entry-hours">
                  {entry.hours.toFixed(1)}<span>h</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="tray-footer">
        <span className="tray-footer-week">
          Week: {summary?.total_hours.toFixed(1) ?? "0.0"}h
        </span>
        <button className="tray-footer-open" onClick={openMainWindow}>
          Open SLOG &rarr;
        </button>
      </div>
    </div>
  );
}
