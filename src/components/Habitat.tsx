import { useState, useEffect, useCallback } from "react";
import { PixelHabitat } from "./habitat/PixelHabitat";
import { HatchCeremony } from "./habitat/HatchCeremony";
import { Graveyard } from "./habitat/Graveyard";
import { getCreatureState, getVacationMode, setVacationMode } from "../lib/commands";
import { getSlugMessage } from "./SlugMood";
import type { CreatureState } from "../lib/types";
import type { SlugMoodType } from "./SlugMood";
import "./Habitat.css";

const ALL_MOODS: { mood: SlugMoodType; label: string }[] = [
  { mood: "happy", label: "Happy" },
  { mood: "impressed", label: "Impressed" },
  { mood: "amazed", label: "Amazed" },
  { mood: "worried", label: "Worried" },
  { mood: "judgemental", label: "Judgemental" },
  { mood: "existential", label: "Existential" },
  { mood: "hungry", label: "Hungry" },
  { mood: "dying", label: "Dying" },
  { mood: "ghost", label: "Ghost" },
  { mood: "vacation", label: "Vacation" },
];

export function Habitat() {
  const [state, setState] = useState<CreatureState | null>(null);
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [deathAcknowledged, setDeathAcknowledged] = useState(false);
  const [moodOverride, setMoodOverride] = useState<SlugMoodType | null>(null);
  const [vacationMode, setVacationModeState] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, v] = await Promise.all([getCreatureState(), getVacationMode()]);
      setState(s);
      setVacationModeState(v);
    } catch (err) {
      console.error("Failed to load creature state:", err);
    }
  }, []);

  const toggleVacation = async () => {
    const newVal = !vacationMode;
    await setVacationMode(newVal);
    setVacationModeState(newVal);
    load();
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (!state) return null;

  // Death screen (one-time)
  if (
    state.lifecycle === "dead" ||
    (state.lifecycle === "egg" && state.graveyard_count > 0 && !deathAcknowledged)
  ) {
    const wasDeath = state.lifecycle === "egg" && state.graveyard_count > 0;
    if (wasDeath && !deathAcknowledged) {
      return (
        <div className="habitat-view">
          <div className="habitat-death">
            <div className="habitat-death-title">Your slug has perished.</div>
            <div className="habitat-death-subtitle">
              {state.graveyard_count} slug{state.graveyard_count !== 1 ? "s" : ""} in the graveyard.
            </div>
            <div className="habitat-death-message">
              10 working days without a single log entry. You did this.
            </div>
            <div className="habitat-death-actions">
              <button
                className="habitat-btn habitat-btn-primary"
                onClick={() => setDeathAcknowledged(true)}
              >
                Hatch a new egg
              </button>
              <button
                className="habitat-btn habitat-btn-secondary"
                onClick={() => setShowGraveyard(true)}
              >
                Visit the graveyard
              </button>
            </div>
          </div>
          {showGraveyard && (
            <>
              <hr className="habitat-divider" />
              <Graveyard />
            </>
          )}
        </div>
      );
    }
  }

  // Egg hatching
  if (state.lifecycle === "egg" && (state.graveyard_count === 0 || deathAcknowledged)) {
    return (
      <div className="habitat-view">
        <HatchCeremony state={state} onHatched={load} size="large" />
      </div>
    );
  }

  // Alive — main habitat view
  const activeMood = moodOverride ?? state.mood as SlugMoodType;
  const displayState: CreatureState = moodOverride
    ? { ...state, mood: moodOverride, lifecycle: moodOverride === "ghost" ? "dead" : state.lifecycle }
    : state;
  const message = getSlugMessage(activeMood);
  const creatureName = state.creature?.name;

  return (
    <div className="habitat-view">
      <div className="habitat-main">
        <PixelHabitat state={displayState} size="large" />

        <div className="habitat-status">
          <div className="habitat-status-message">
            {creatureName ? `${creatureName}: ` : ""}{message}
          </div>
          <div className="habitat-status-details">
            <span className="habitat-stat">
              {state.today_hours > 0
                ? `${state.today_hours.toFixed(1)}h logged today`
                : "Nothing logged today"}
            </span>
            {state.working_days_missed > 0 && (
              <span className="habitat-stat habitat-stat-warn">
                {state.working_days_missed} day{state.working_days_missed !== 1 ? "s" : ""} missed
              </span>
            )}
            {state.creature && (
              <span className="habitat-stat">
                Generation {state.creature.generation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vacation toggle */}
      <button
        className={`habitat-vacation-btn ${vacationMode ? "active" : ""}`}
        onClick={toggleVacation}
      >
        {vacationMode ? "End Vacation" : "Vacation Mode"}
      </button>

      {/* Mood preview selector */}
      <div className="habitat-mood-selector">
        <button
          className={`habitat-mood-btn ${!moodOverride ? "active" : ""}`}
          onClick={() => setMoodOverride(null)}
        >
          Live
        </button>
        {ALL_MOODS.map((m) => (
          <button
            key={m.mood}
            className={`habitat-mood-btn ${moodOverride === m.mood ? "active" : ""}`}
            onClick={() => setMoodOverride(m.mood)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {state.graveyard_count > 0 && (
        <div className="habitat-graveyard-toggle">
          <button
            className="habitat-btn habitat-btn-secondary"
            onClick={() => setShowGraveyard(!showGraveyard)}
          >
            {showGraveyard ? "Hide graveyard" : `Graveyard (${state.graveyard_count})`}
          </button>
        </div>
      )}

      {showGraveyard && <Graveyard />}
    </div>
  );
}
