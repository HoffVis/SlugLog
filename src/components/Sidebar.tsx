import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getTickets } from "../lib/commands";
import { SlugMood, getSlugMoodFromStreak, getSlugMessage } from "./SlugMood";
import type { SlugMoodType } from "./SlugMood";
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
  const [slugMood, setSlugMood] = useState<SlugMoodType>("happy");
  const [slugMessage, setSlugMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const tickets = await getTickets();
        setActiveTimers(tickets.filter((t) => t.started_at !== null));
      } catch {
        // ignore
      }
      try {
        const status: { working_days_missed: number; today_hours: number; is_weekend: boolean } =
          await invoke("get_slug_status");
        const mood = getSlugMoodFromStreak(status.working_days_missed, status.today_hours, status.is_weekend);
        setSlugMood(mood);
        setSlugMessage(getSlugMessage(mood));
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 30000);
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

      {/* Live slug mood */}
      <div className="sidebar-section sidebar-slug">
        <SlugMood mood={slugMood} message={slugMessage} size="small" />
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
