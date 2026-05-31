import { useEffect, useState } from "react";
import { EditableEntryCard } from "./EditableEntryCard";
import { DayCommits } from "./DayCommits";
import { AREAS, AREA_LABELS } from "../lib/types";
import { getProjects } from "../lib/commands";
import type { Entry, Project } from "../lib/types";
import "./DayDetail.css";

interface DayDetailProps {
  date: string;
  entries: Entry[];
  onClose: () => void;
  onUpdate: () => void;
  onCreate: (params: {
    description: string;
    hours: number;
    date: string;
    project?: string;
    projectNumber?: string;
    area?: string;
    output?: string;
    notes?: string;
  }) => Promise<void>;
}

export function DayDetail({ date, entries, onClose, onUpdate, onCreate }: DayDetailProps) {
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
          <AddEntryInline date={date} onCreate={onCreate} onUpdate={onUpdate} />
          <DayCommits date={date} />
          {entries.length === 0 ? (
            <div className="day-detail-empty">No entries for this day yet.</div>
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

function AddEntryInline({
  date,
  onCreate,
  onUpdate,
}: {
  date: string;
  onCreate: DayDetailProps["onCreate"];
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState("");
  const [project, setProject] = useState("");
  const [pn, setPn] = useState("");
  const [area, setArea] = useState("");
  const [output, setOutput] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (open && projects.length === 0) {
      getProjects().then(setProjects).catch(() => {});
    }
  }, [open, projects.length]);

  const reset = () => {
    setDesc("");
    setHours("");
    setProject("");
    setPn("");
    setArea("");
    setOutput("");
    setNotes("");
  };

  const handleProjectSelect = (value: string) => {
    setProject(value);
    const match = projects.find((p) => p.name === value);
    if (match) {
      if (match.project_number) setPn(match.project_number);
      if (match.default_area) setArea(match.default_area);
    }
  };

  const handleSubmit = async () => {
    const h = parseFloat(hours);
    if (!desc.trim() || isNaN(h) || h <= 0) return;
    setSubmitting(true);
    try {
      await onCreate({
        description: desc.trim(),
        hours: h,
        date,
        project: project.trim() || undefined,
        projectNumber: pn.trim() || undefined,
        area: area || undefined,
        output: output.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onUpdate();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button className="day-detail-add-btn" onClick={() => setOpen(true)}>
        + Add entry
      </button>
    );
  }

  return (
    <div className="detail-entry-card editing">
      <div className="edit-grid">
        <div className="edit-field full">
          <label className="edit-label">Description</label>
          <input
            className="edit-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder='What did you do? e.g. "Fixed DMX race condition"'
            autoFocus
          />
        </div>
        <div className="edit-field">
          <label className="edit-label">Hours</label>
          <input
            className="edit-input"
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="2.5"
          />
        </div>
        <div className="edit-field">
          <label className="edit-label">Project</label>
          <input
            className="edit-input"
            list="add-project-list"
            value={project}
            onChange={(e) => handleProjectSelect(e.target.value)}
            placeholder="Project name"
          />
          <datalist id="add-project-list">
            {projects.map((p) => (
              <option key={p.id} value={p.name}>{p.project_number ? `#${p.project_number}` : ""}</option>
            ))}
          </datalist>
        </div>
        <div className="edit-field">
          <label className="edit-label">PN</label>
          <input className="edit-input" value={pn} onChange={(e) => setPn(e.target.value)} placeholder="6003" />
        </div>
        <div className="edit-field">
          <label className="edit-label">Area</label>
          <select className="edit-input" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">—</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{AREA_LABELS[a]}</option>
            ))}
          </select>
        </div>
        <div className="edit-field full">
          <label className="edit-label">Output</label>
          <input className="edit-input" value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Result / deliverable" />
        </div>
        <div className="edit-field full">
          <label className="edit-label">Notes</label>
          <input className="edit-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lessons, thoughts..." />
        </div>
      </div>
      <div className="edit-actions">
        <button
          className="edit-cancel"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Cancel
        </button>
        <button className="edit-save" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Adding…" : "Add entry"}
        </button>
      </div>
    </div>
  );
}
