import { useState, useEffect, useCallback } from "react";
import { getProjects, createProject, updateProject, deleteProject } from "../lib/commands";
import { AREAS, AREA_LABELS } from "../lib/types";
import type { Project, TaskArea } from "../lib/types";
import "./Projects.css";

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");
  const [newPn, setNewPn] = useState("");
  const [newArea, setNewArea] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPn, setEditPn] = useState("");
  const [editArea, setEditArea] = useState("");

  const load = useCallback(async () => {
    setProjects(await getProjects());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createProject({
      name: newName.trim(),
      projectNumber: newPn.trim() || undefined,
      defaultArea: newArea || undefined,
    });
    setNewName("");
    setNewPn("");
    setNewArea("");
    await load();
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPn(p.project_number ?? "");
    setEditArea(p.default_area ?? "");
  };

  const handleSave = async () => {
    if (!editingId || !editName.trim()) return;
    await updateProject({
      id: editingId,
      name: editName.trim(),
      projectNumber: editPn.trim() || undefined,
      defaultArea: editArea || undefined,
    });
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    await load();
  };

  return (
    <div className="projects">
      <div className="projects-header">
        <h2 className="projects-title">Projects</h2>
        <p className="projects-subtitle">
          Configure your projects here. When a ticket is linked to a project,
          the project number and default area carry over to the slog entry automatically.
        </p>
      </div>

      {/* Add project */}
      <div className="projects-add">
        <input
          className="projects-input name"
          type="text"
          placeholder="Project name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
        />
        <input
          className="projects-input pn"
          type="text"
          placeholder="PN"
          value={newPn}
          onChange={(e) => setNewPn(e.target.value)}
        />
        <select
          className="projects-input area"
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
        >
          <option value="">Default area...</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{AREA_LABELS[a]}</option>
          ))}
        </select>
        <button className="projects-add-btn" onClick={handleAdd}>+ Add</button>
      </div>

      {/* Project list */}
      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="projects-empty">
            No projects configured yet. Add your first one above.
          </div>
        ) : (
          projects.map((p) => (
            editingId === p.id ? (
              <div key={p.id} className="project-row editing">
                <input
                  className="projects-input name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <input
                  className="projects-input pn"
                  value={editPn}
                  onChange={(e) => setEditPn(e.target.value)}
                  placeholder="PN"
                />
                <select
                  className="projects-input area"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                >
                  <option value="">No default</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{AREA_LABELS[a]}</option>
                  ))}
                </select>
                <button className="project-save-btn" onClick={handleSave}>Save</button>
                <button className="project-cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div key={p.id} className="project-row" onClick={() => startEdit(p)}>
                <div className="project-info">
                  <span className="project-name">{p.name}</span>
                  {p.project_number && (
                    <span className="project-pn">#{p.project_number}</span>
                  )}
                  {p.default_area && (
                    <span className={`project-area area-color-${p.default_area} area-bg-${p.default_area}`}>
                      {AREA_LABELS[p.default_area as TaskArea]}
                    </span>
                  )}
                </div>
                <button
                  className="project-delete-btn"
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                >
                  &times;
                </button>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
