import { useEffect } from "react";
import { EditableEntryCard } from "./EditableEntryCard";
import type { Entry } from "../lib/types";
import "./DayDetail.css";

interface DayDetailProps {
  date: string;
  entries: Entry[];
  onClose: () => void;
  onUpdate: () => void;
}

export function DayDetail({ date, entries, onClose, onUpdate }: DayDetailProps) {
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  const d = new Date(date + "T00:00:00");
  const title = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="day-detail-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="day-detail">
        <div className="day-detail-header">
          <div>
            <div className="day-detail-title">{title}</div>
            <div className="day-detail-hours">
              {totalHours.toFixed(1)} hours logged
            </div>
          </div>
          <button className="day-detail-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="day-detail-entries">
          {entries.length === 0 ? (
            <div className="day-detail-empty">No entries for this day.</div>
          ) : (
            entries.map((entry) => (
              <EditableEntryCard
                key={entry.id}
                entry={entry}
                onUpdate={onUpdate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
