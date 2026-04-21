import { getWeekDates, formatDate, formatWeekday, formatShortDate, isToday, isWeekend } from "../lib/dates";
import { AREA_LABELS } from "../lib/types";
import type { Entry, TaskArea } from "../lib/types";
import "./Timeline.css";

interface TimelineProps {
  year: number;
  week: number;
  entries: Entry[];
  onDayClick: (date: string) => void;
  loading: boolean;
}

export function Timeline({ year, week, entries, onDayClick, loading }: TimelineProps) {
  const dates = getWeekDates(year, week);

  if (loading) {
    return (
      <div className="timeline">
        <div className="timeline-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {dates.map((date, i) => {
        const dateStr = formatDate(date);
        const dayEntries = entries.filter((e) => e.date === dateStr);
        const dayHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
        const today = isToday(date);
        const weekend = isWeekend(date);

        return (
          <div
            key={dateStr}
            className={`day-row ${today ? "is-today" : ""} ${weekend ? "is-weekend" : ""}`}
            onClick={() => !weekend && onDayClick(dateStr)}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="day-date">
              <div className="day-date-label">{formatWeekday(date)}</div>
              <div className="day-date-sub">{formatShortDate(date)}</div>
              {dayHours > 0 && (
                <div className="day-hours-label">{dayHours.toFixed(1)}h</div>
              )}
            </div>
            <div className="day-node-col">
              <div className={`day-node ${dayEntries.length > 0 ? "has-entries" : ""}`} />
            </div>
            {dayEntries.length > 0 ? (
              <div className="day-entries">
                {dayEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <div className="day-empty">
                <span className="day-empty-msg">
                  {weekend ? "weekend" : "no entries"}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  const areaClass = entry.area ?? "";
  const areaLabel = entry.area ? AREA_LABELS[entry.area as TaskArea] : null;

  return (
    <div className={`entry-card area-left-${areaClass}`}>
      <div className="entry-main">
        <div className="entry-info">
          <div className="entry-top-line">
            {entry.project && (
              <span className="entry-project">{entry.project}</span>
            )}
            {entry.project_number && (
              <span className="entry-pn">#{entry.project_number}</span>
            )}
            {areaLabel && (
              <span className={`entry-area-tag area-color-${areaClass} area-bg-${areaClass}`}>
                {areaLabel}
              </span>
            )}
          </div>
          <div className="entry-desc">{entry.description}</div>
        </div>
        <div className="entry-meta">
          <div className="entry-hours">
            {entry.hours.toFixed(1)}<span>h</span>
          </div>
          <div className="entry-time">{entry.time}</div>
        </div>
      </div>
    </div>
  );
}
