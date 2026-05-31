import { useRef } from "react";
import { getWeekMonday, formatDate, formatShortDate } from "../lib/dates";
const slugLogo = "/sprites/slug/slug-base.png";
import "./Header.css";

interface HeaderProps {
  year: number;
  week: number;
  totalHours: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onJumpToDate: (date: string) => void;
  theme: "light" | "dark" | "midnight";
  onToggleTheme: () => void;
  view: "log" | "board" | "projects" | "all" | "habitat" | "cli" | "about";
  onViewChange: (view: "log" | "board" | "projects" | "all" | "habitat" | "cli" | "about") => void;
}

export function Header({
  year,
  week,
  totalHours,
  onPrevWeek,
  onNextWeek,
  onToday,
  onJumpToDate,
  theme,
  onToggleTheme,
  view,
  onViewChange,
}: HeaderProps) {
  const monday = getWeekMonday(year, week);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const jumpInputRef = useRef<HTMLInputElement>(null);

  const openJumpPicker = () => {
    const el = jumpInputRef.current;
    if (!el) return;
    // Native picker on supporting browsers; fall back to focus.
    const anyEl = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof anyEl.showPicker === "function") {
      anyEl.showPicker();
    } else {
      el.focus();
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-mark">
          <img src={slugLogo} alt="SlugLog" className="logo-img" />
        </div>
        <div className="logo-text">
          <div className="logo-title">SlugLog</div>
          <div className="logo-subtitle">dev journal</div>
        </div>
      </div>

      <div className="header-center">
        <div className="view-tabs">
          <button
            className={`view-tab ${view === "log" ? "active" : ""}`}
            onClick={() => onViewChange("log")}
          >
            sLog
          </button>
          <button
            className={`view-tab ${view === "all" ? "active" : ""}`}
            onClick={() => onViewChange("all")}
          >
            All Entries
          </button>
          <button
            className={`view-tab ${view === "board" ? "active" : ""}`}
            onClick={() => onViewChange("board")}
          >
            sBoard
          </button>
          <button
            className={`view-tab ${view === "projects" ? "active" : ""}`}
            onClick={() => onViewChange("projects")}
          >
            sProjects
          </button>
          <button
            className={`view-tab ${view === "habitat" ? "active" : ""}`}
            onClick={() => onViewChange("habitat")}
          >
            sHabitat
          </button>
          <span className="view-tab-divider" />
          <button
            className={`view-tab ${view === "cli" ? "active" : ""}`}
            onClick={() => onViewChange("cli")}
          >
            CLI
          </button>
          <button
            className={`view-tab ${view === "about" ? "active" : ""}`}
            onClick={() => onViewChange("about")}
          >
            ?
          </button>
        </div>
        <div className="week-nav">
          <button className="week-nav-btn" onClick={onPrevWeek} title="Previous week (←)">&larr;</button>
          <button
            className="week-label week-label-btn"
            onClick={openJumpPicker}
            title="Jump to date"
          >
            Week {week} <span>&middot; {formatShortDate(monday)} – {formatShortDate(friday)}</span>
            <input
              ref={jumpInputRef}
              type="date"
              className="week-jump-input"
              value={formatDate(monday)}
              onChange={(e) => {
                if (e.target.value) onJumpToDate(e.target.value);
              }}
              tabIndex={-1}
              aria-label="Jump to date"
            />
          </button>
          <button className="week-nav-btn" onClick={onNextWeek} title="Next week (→)">&rarr;</button>
        </div>
      </div>

      <div className="header-right">
        <div className="week-hours-badge" title="Week total">{totalHours.toFixed(1)}h <span className="week-hours-label">week</span></div>
        <button className="today-btn" onClick={onToday}>Today</button>
        <button className="theme-toggle" onClick={onToggleTheme} title={`Theme: ${theme}`}>
          {theme === "light" ? "\u263E" : theme === "dark" ? "\u2726" : "\u2600"}
        </button>
      </div>
    </header>
  );
}
