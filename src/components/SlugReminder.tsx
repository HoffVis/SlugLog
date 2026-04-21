import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SlugMood, getSlugMoodFromStreak, getSlugMessage } from "./SlugMood";
import type { SlugMoodType } from "./SlugMood";
import "./SlugReminder.css";

interface SlugStatus {
  working_days_missed: number;
  last_log_date: string | null;
  today_hours: number;
  is_weekend: boolean;
}

interface SlugReminderProps {
  onDismiss: () => void;
  onLogYesterday: () => void;
}

export function SlugReminder({ onDismiss, onLogYesterday }: SlugReminderProps) {
  const [mood, setMood] = useState<SlugMoodType | null>(null);
  const [status, setStatus] = useState<SlugStatus | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        const s: SlugStatus = await invoke("get_slug_status");
        setStatus(s);

        // Don't show on weekends
        if (s.is_weekend) return;

        // Don't show if already logged today or no missed days
        if (s.working_days_missed === 0) return;

        const slugMood = getSlugMoodFromStreak(s.working_days_missed, s.today_hours, s.is_weekend);
        setMood(slugMood);
        setMessage(getSlugMessage(slugMood));
      } catch (err) {
        console.error("Failed to get slug status:", err);
      }
    };

    check();
  }, []);

  if (!mood) return null;

  const daysText = status && status.working_days_missed > 0
    ? `${status.working_days_missed} working day${status.working_days_missed > 1 ? "s" : ""} without logging`
    : "No entries today yet";

  return (
    <div className="slug-reminder-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onDismiss();
    }}>
      <div className={`slug-reminder mood-${mood}`}>
        <button className="slug-reminder-close" onClick={onDismiss}>&times;</button>
        <SlugMood mood={mood} message={message} size="large" />
        <div className="slug-reminder-streak">{daysText}</div>
        {status?.last_log_date && (
          <div className="slug-reminder-last">
            Last log: {status.last_log_date}
          </div>
        )}
        <div className="slug-reminder-actions">
          {status && status.working_days_missed > 0 && (
            <button className="slug-reminder-log" onClick={() => { onLogYesterday(); onDismiss(); }}>
              Feed the slug
            </button>
          )}
          <button className="slug-reminder-dismiss" onClick={onDismiss}>
            {mood === "happy" || mood === "impressed" || mood === "amazed"
              ? "Thanks, slug!"
              : mood === "ghost"
                ? "I'm sorry..."
                : "I'll do it later..."}
          </button>
        </div>
      </div>
    </div>
  );
}
