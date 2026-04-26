import { useEffect, useState } from "react";
import { AREA_LABELS, AREAS } from "../lib/types";
import { deleteEntry, updateEntry, getProjects } from "../lib/commands";
import type { Entry, Project, TaskArea } from "../lib/types";
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

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    onUpdate();
  };

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
                onDelete={() => handleDelete(entry.id)}
                onUpdate={onUpdate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EditableEntryCard({
  entry,
  onDelete,
  onUpdate,
}: {
  entry: Entry;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(entry.description);
  const [hours, setHours] = useState(entry.hours.toString());
  const [project, setProject] = useState(entry.project ?? "");
  const [pn, setPn] = useState(entry.project_number ?? "");
  const [area, setArea] = useState<string>(entry.area ?? "");
  const [output, setOutput] = useState(entry.output ?? "");
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [saving, setSaving] = useState(false);
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

  const areaClass = entry.area ?? "";
  const areaLabel = entry.area ? AREA_LABELS[entry.area as TaskArea] : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEntry({
        id: entry.id,
        description: desc,
        hours: parseFloat(hours) || entry.hours,
        project: project || undefined,
        projectNumber: pn || undefined,
        area: area || undefined,
        output: output || undefined,
        notes: notes || undefined,
      });
      setEditing(false);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="detail-entry-card editing">
        <div className="edit-grid">
          <div className="edit-field full">
            <label className="edit-label">Description</label>
            <input className="edit-input" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="edit-field">
            <label className="edit-label">Hours</label>
            <input className="edit-input" type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="edit-field">
            <label className="edit-label">Project</label>
            <input className="edit-input" list="edit-project-list" value={project} onChange={(e) => handleProjectSelect(e.target.value)} placeholder="Project name" />
            <datalist id="edit-project-list">
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
          <button className="edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
          <button className="edit-save" onClick={handleSave} disabled={saving}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`detail-entry-card area-left-${areaClass}`} onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
      <div className="detail-entry-top">
        <span className="detail-entry-project">
          {entry.project ?? "(no project)"}
          {entry.project_number && (
            <span className="entry-pn"> #{entry.project_number}</span>
          )}
        </span>
        <div className="detail-entry-actions">
          <span className="detail-entry-hours">{entry.hours.toFixed(1)}h</span>
          <button className="detail-entry-delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete entry">
            &times;
          </button>
        </div>
      </div>
      <div className="detail-entry-tags">
        {areaLabel && (
          <span className={`entry-area-tag area-color-${areaClass} area-bg-${areaClass}`}>
            {areaLabel}
          </span>
        )}
        <span className="entry-time">{entry.time}</span>
      </div>
      <div className="detail-entry-desc">{entry.description}</div>
      {entry.output && (
        <div className="detail-entry-output">
          <strong>Output:</strong> {entry.output}
        </div>
      )}
      {entry.notes && (
        <div className="detail-entry-notes">
          <strong>Notes:</strong> {entry.notes}
        </div>
      )}
      <div className="detail-edit-hint">click to edit</div>
    </div>
  );
}
