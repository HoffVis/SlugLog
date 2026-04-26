import { useState, useEffect } from "react";
import { AREAS, AREA_LABELS } from "../lib/types";
import type { Project } from "../lib/types";
import { getProjects } from "../lib/commands";
import { formatDate } from "../lib/dates";
import "./QuickAdd.css";

interface QuickAddProps {
  onSubmit: (params: {
    description: string;
    hours: number;
    date?: string;
    project?: string;
    projectNumber?: string;
    area?: string;
    output?: string;
    notes?: string;
  }) => Promise<void>;
}

export function QuickAdd({ onSubmit }: QuickAddProps) {
  const [what, setWhat] = useState("");
  const [hours, setHours] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState(formatDate(new Date()));
  const [project, setProject] = useState("");
  const [pn, setPn] = useState("");
  const [area, setArea] = useState("");
  const [output, setOutput] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {});
  }, []);

  const handleProjectSelect = (value: string) => {
    setProject(value);
    const match = projects.find((p) => p.name === value);
    if (match) {
      if (match.project_number) setPn(match.project_number);
      if (match.default_area) setArea(match.default_area);
    }
  };

  const isToday = date === formatDate(new Date());

  const handleSubmit = async () => {
    const h = parseFloat(hours);
    if (!what.trim() || isNaN(h) || h <= 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        description: what.trim(),
        hours: h,
        date: isToday ? undefined : date,
        project: project.trim() || undefined,
        projectNumber: pn.trim() || undefined,
        area: area || undefined,
        output: output.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setWhat("");
      setHours("");
      setProject("");
      setPn("");
      setArea("");
      setOutput("");
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="quick-add">
      <div className="quick-add-simple">
        <input
          className="quick-add-what"
          type="text"
          placeholder='What did you do? e.g. "Fixed DMX race condition"'
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="quick-add-hours"
          type="text"
          placeholder="2.5h"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="quick-add-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          + LOG
        </button>
        <button
          className={`quick-add-expand ${expanded ? "is-expanded" : ""}`}
          onClick={() => setExpanded(!expanded)}
          title="More fields"
        >
          {expanded ? "\u25B2" : "\u25BC"}
        </button>
      </div>
      {expanded && (
        <div className="quick-add-detailed">
          <div className="quick-add-field date">
            <label className="quick-add-label">Date</label>
            <input
              className={`quick-add-input ${!isToday ? "past-date" : ""}`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="quick-add-field project">
            <label className="quick-add-label">Project</label>
            <input
              className="quick-add-input"
              type="text"
              list="project-list"
              placeholder="Reflect Color Studio"
              value={project}
              onChange={(e) => handleProjectSelect(e.target.value)}
            />
            <datalist id="project-list">
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.project_number ? `#${p.project_number}` : ""}
                </option>
              ))}
            </datalist>
          </div>
          <div className="quick-add-field pn">
            <label className="quick-add-label">PN</label>
            <input
              className="quick-add-input"
              type="text"
              placeholder="6003"
              value={pn}
              onChange={(e) => setPn(e.target.value)}
            />
          </div>
          <div className="quick-add-field area">
            <label className="quick-add-label">Area</label>
            <select
              className="quick-add-select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">—</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {AREA_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <div className="quick-add-field output">
            <label className="quick-add-label">Output</label>
            <input
              className="quick-add-input"
              type="text"
              placeholder="Result / deliverable"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
            />
          </div>
          <div className="quick-add-field notes">
            <label className="quick-add-label">Notes</label>
            <input
              className="quick-add-input"
              type="text"
              placeholder="Lessons, thoughts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}
      {!isToday && expanded && (
        <div className="quick-add-past-notice">
          Logging to {date} (not today)
        </div>
      )}
    </div>
  );
}
