import { getWeekMonday, formatShortDate } from "../lib/dates";
import slugLogo from "../assets/slug-logo.png";
import "./Header.css";

interface HeaderProps {
  year: number;
  week: number;
  totalHours: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  theme: "light" | "dark" | "midnight";
  onToggleTheme: () => void;
  view: "log" | "board" | "projects" | "all" | "cli" | "about";
  onViewChange: (view: "log" | "board" | "projects" | "all" | "cli" | "about") => void;
}

export function Header({
  year,
  week,
  totalHours,
  onPrevWeek,
  onNextWeek,
  onToday,
  theme,
  onToggleTheme,
  view,
  onViewChange,
}: HeaderProps) {
  const monday = getWeekMonday(year, week);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

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
          <button className="week-nav-btn" onClick={onPrevWeek}>&larr;</button>
          <div className="week-label">
            Week {week} <span>&middot; {formatShortDate(monday)} – {formatShortDate(friday)}</span>
          </div>
          <button className="week-nav-btn" onClick={onNextWeek}>&rarr;</button>
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
