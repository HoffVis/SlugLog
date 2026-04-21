import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { Header } from "./components/Header";
import { QuickAdd } from "./components/QuickAdd";
import { Timeline } from "./components/Timeline";
import { Sidebar } from "./components/Sidebar";
import { DayDetail } from "./components/DayDetail";
import { Board } from "./components/Board";
import { Projects } from "./components/Projects";
import { SlugReminder } from "./components/SlugReminder";
import { TrayPopup } from "./components/TrayPopup";
import { getISOWeek } from "./lib/dates";
import { getEntriesForWeek, getWeekSummary, createEntry, createEntryWithDate } from "./lib/commands";
import type { Entry, WeekSummary } from "./lib/types";
import "./styles/app.css";

export default function App() {
  // If loaded at /tray, render the tray popup instead
  if (window.location.pathname === "/tray") {
    return <TrayPopup />;
  }
  const now = new Date();
  const currentWeek = getISOWeek(now);

  const [year, setYear] = useState(currentWeek.year);
  const [week, setWeek] = useState(currentWeek.week);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"log" | "board" | "projects">("log");
  const [showReminder, setShowReminder] = useState(() => {
    // Show reminder once per day
    const lastDismissed = localStorage.getItem("slog-reminder-dismissed");
    const today = new Date().toISOString().split("T")[0];
    return lastDismissed !== today;
  });

  const dismissReminder = () => {
    setShowReminder(false);
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("slog-reminder-dismissed", today);
  };

  // Listen for Rust-side reminder trigger (9:00 AM popup)
  useEffect(() => {
    const unlisten = listen("show-slug-reminder", () => {
      setShowReminder(true);
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  const handleLogYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
    setView("log");
  };
  const THEMES = ["light", "dark", "midnight"] as const;
  type Theme = (typeof THEMES)[number];

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("slog-theme") as Theme) || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("slog-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const i = THEMES.indexOf(theme);
    setTheme(THEMES[(i + 1) % THEMES.length]);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([
        getEntriesForWeek(year, week),
        getWeekSummary(year, week),
      ]);
      setEntries(e);
      setSummary(s);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
    setLoading(false);
  }, [year, week]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Light polling — only re-fetch if entry count changed (no unnecessary re-renders)
  useEffect(() => {
    if (view !== "log") return;
    let lastCount = entries.length;
    const interval = setInterval(async () => {
      try {
        const fresh = await getEntriesForWeek(year, week);
        if (fresh.length !== lastCount) {
          lastCount = fresh.length;
          loadData();
        }
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [view, year, week, entries.length]);

  const handlePrevWeek = () => {
    if (week === 1) {
      setYear(year - 1);
      setWeek(52);
    } else {
      setWeek(week - 1);
    }
  };

  const handleNextWeek = () => {
    if (week >= 52) {
      setYear(year + 1);
      setWeek(1);
    } else {
      setWeek(week + 1);
    }
  };

  const handleToday = () => {
    const w = getISOWeek(new Date());
    setYear(w.year);
    setWeek(w.week);
  };

  const handleAddEntry = async (params: {
    description: string;
    hours: number;
    date?: string;
    project?: string;
    projectNumber?: string;
    area?: string;
    output?: string;
    notes?: string;
  }) => {
    if (params.date) {
      await createEntryWithDate(params as { date: string; description: string; hours: number });
    } else {
      await createEntry(params);
    }
    await loadData();
  };

  return (
    <div className="app">
      <Header
        year={year}
        week={week}
        totalHours={summary?.total_hours ?? 0}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        theme={theme}
        onToggleTheme={toggleTheme}
        view={view}
        onViewChange={(v) => {
          setView(v);
          if (v === "log") loadData();
        }}
      />
      {view === "log" ? (
        <>
          <QuickAdd onSubmit={handleAddEntry} />
          <div className="main">
            <Timeline
              year={year}
              week={week}
              entries={entries}
              onDayClick={setSelectedDate}
              loading={loading}
            />
            <Sidebar summary={summary} />
          </div>
          {selectedDate && (
            <DayDetail
              date={selectedDate}
              entries={entries.filter((e) => e.date === selectedDate)}
              onClose={() => setSelectedDate(null)}
              onUpdate={loadData}
            />
          )}
        </>
      ) : view === "board" ? (
        <Board />
      ) : (
        <Projects />
      )}
      {showReminder && (
        <SlugReminder
          onDismiss={dismissReminder}
          onLogYesterday={handleLogYesterday}
        />
      )}
    </div>
  );
}
