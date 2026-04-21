import { useState, useEffect } from "react";
import { getTickets } from "../lib/commands";
import type { Ticket, WeekSummary } from "../lib/types";
import "./Sidebar.css";

interface SidebarProps {
  summary: WeekSummary | null;
}

const AREA_COLORS: Record<string, string> = {
  Programming: "var(--color-programming)",
  Testing: "var(--color-testing)",
  "Bug Solving": "var(--color-bug)",
  Meeting: "var(--color-meeting)",
  Documenting: "var(--color-documenting)",
  Investigating: "var(--color-investigating)",
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function Sidebar({ summary }: SidebarProps) {
  const [activeTimers, setActiveTimers] = useState<Ticket[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const tickets = await getTickets();
        setActiveTimers(tickets.filter((t) => t.started_at !== null));
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!summary) return null;

  return (
    <aside className="sidebar">
      {/* Active timers */}
      {activeTimers.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-title">Active Timers</div>
          <div className="active-timers">
            {activeTimers.map((t) => (
              <ActiveTimerCard key={t.id} ticket={t} />
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="sidebar-section">
        <div className="sidebar-title">This Week</div>
        <div className="heatmap">
          {summary.by_day.map((day, i) => {
            const level =
              day.hours === 0
                ? 0
                : day.hours < 3
                  ? 1
                  : day.hours < 5
                    ? 2
                    : day.hours < 7
                      ? 3
                      : 4;
            const today = day.date === (() => {
              const d = new Date();
              return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            })();
            return (
              <div
                key={day.date}
                className={`heatmap-cell level-${level} ${today ? "today" : ""}`}
                title={`${DAY_LABELS[i]}: ${day.hours > 0 ? `${day.hours.toFixed(1)}h` : "—"}`}
              />
            );
          })}
        </div>
        <div className="heatmap-labels">
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="heatmap-label">{l}</span>
          ))}
        </div>
      </div>

      {/* By Project */}
      <div className="sidebar-section">
        <div className="sidebar-title">By Project</div>
        <div className="project-summary">
          {summary.by_project.map((p) => (
            <div key={p.project} className="project-row">
              <div className="project-row-info">
                <div className="project-row-name">{p.project}</div>
                {p.project_number && (
                  <div className="project-row-pn">#{p.project_number}</div>
                )}
                <div className="project-bar">
                  <div
                    className="project-bar-fill"
                    style={{
                      width: `${(p.hours / summary.total_hours) * 100}%`,
                      background: "var(--slug-green)",
                    }}
                  />
                </div>
              </div>
              <div className="project-row-hours">
                {p.hours.toFixed(1)}<span>h</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total bar */}
        {summary.total_hours > 0 && (
          <div className="week-total-bar">
            <div
              className="week-total-segment"
              style={{
                flex: summary.total_hours,
                background: "var(--slug-green)",
              }}
            />
            {summary.total_hours < 40 && (
              <div
                className="week-total-segment"
                style={{
                  flex: 40 - summary.total_hours,
                  background: "var(--border-subtle)",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* By Area */}
      <div className="sidebar-section">
        <div className="sidebar-title">By Area</div>
        <div className="area-breakdown">
          {summary.by_area.map((a) => (
            <div key={a.area} className="area-row">
              <div
                className="area-dot"
                style={{ background: AREA_COLORS[a.area] ?? "var(--text-dim)" }}
              />
              <span className="area-name">{a.area}</span>
              <span className="area-hours">{a.hours.toFixed(1)}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slug footer */}
      <div className="sidebar-section sidebar-footer">
        <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.2 }}>
          <ellipse cx="20" cy="26" rx="14" ry="8" fill="var(--slug-green-dim)" stroke="var(--slug-green)" strokeWidth="1.5"/>
          <ellipse cx="24" cy="22" rx="8" ry="9" fill="var(--bg-surface)" stroke="var(--slug-green)" strokeWidth="1.2"/>
          <line x1="14" y1="22" x2="11" y2="14" stroke="var(--slug-green)" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="18" y1="21" x2="16" y2="13" stroke="var(--slug-green)" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="11" cy="13" r="2" fill="var(--slug-green)"/>
          <circle cx="16" cy="12" r="2" fill="var(--slug-green)"/>
        </svg>
        <div className="sidebar-tagline">keep slogging &middot; v0.1.0</div>
      </div>
    </aside>
  );
}

function ActiveTimerCard({ ticket }: { ticket: Ticket }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!ticket.started_at) return;
    const update = () => {
      const started = new Date(ticket.started_at!).getTime();
      const now = Date.now();
      const mins = Math.floor((now - started) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [ticket.started_at]);

  return (
    <div className="active-timer-card">
      <div className="active-timer-indicator" />
      <div className="active-timer-info">
        <div className="active-timer-title">{ticket.title}</div>
        {ticket.project && (
          <div className="active-timer-project">{ticket.project}</div>
        )}
      </div>
      <div className="active-timer-elapsed">{elapsed}</div>
    </div>
  );
}
