import { useState, useEffect, useCallback } from "react";
import {
  getTickets,
  createTicket,
  moveTicket,
  deleteTicket,
  startTimer,
  stopTimer,
  confirmStop,
} from "../lib/commands";
import type { Ticket, TicketStatus, StopResult } from "../lib/types";
import { STATUS_LABELS } from "../lib/types";
import "./Board.css";

const COLUMNS: TicketStatus[] = ["todo", "in_progress", "done"];

export function Board() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [stopResult, setStopResult] = useState<StopResult | null>(null);
  const [confirmHours, setConfirmHours] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      setTickets(await getTickets());
    } catch (err) {
      console.error("Failed to load tickets:", err);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Refresh running timers every 30s
  useEffect(() => {
    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await createTicket({ title: newTitle.trim() });
      setNewTitle("");
      await loadTickets();
    } finally {
      setAdding(false);
    }
  };

  const handleMove = async (id: string, status: TicketStatus) => {
    await moveTicket(id, status);
    await loadTickets();
  };

  const handleDelete = async (id: string) => {
    await deleteTicket(id);
    await loadTickets();
  };

  const handleStart = async (id: string) => {
    const autoStopped = await startTimer(id);
    // If another ticket was auto-stopped, show confirmation for it
    if (autoStopped) {
      setStopResult(autoStopped);
      setConfirmHours(autoStopped.proposed_hours.toFixed(1));
    }
    await loadTickets();
  };

  const handleStop = async (id: string) => {
    const result = await stopTimer(id);
    setStopResult(result);
    setConfirmHours(result.proposed_hours.toFixed(1));
    await loadTickets();
  };

  const handleConfirmLog = async () => {
    if (!stopResult) return;
    const hours = parseFloat(confirmHours);
    if (isNaN(hours) || hours <= 0) return;
    await confirmStop({
      ticketId: stopResult.ticket_id,
      title: stopResult.ticket_title,
      hours,
      project: stopResult.project ?? undefined,
    });
    setStopResult(null);
    setConfirmHours("");
    await loadTickets();
  };

  const handleDismiss = () => {
    setStopResult(null);
    setConfirmHours("");
  };

  const getColumnTickets = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className="board">
      {/* Add ticket bar */}
      <div className="board-add">
        <input
          className="board-add-input"
          type="text"
          placeholder="New ticket..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button className="board-add-btn" onClick={handleAdd} disabled={adding}>
          + Add
        </button>
      </div>

      {/* Columns */}
      <div className="board-columns">
        {COLUMNS.map((status) => {
          const columnTickets = getColumnTickets(status);
          return (
            <div key={status} className={`board-column column-${status}`}>
              <div className="board-column-header">
                <span className="board-column-title">
                  {STATUS_LABELS[status]}
                </span>
                <span className="board-column-count">
                  {columnTickets.length}
                </span>
              </div>
              <div className="board-column-cards">
                {columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onMove={handleMove}
                    onDelete={handleDelete}
                    onStart={handleStart}
                    onStop={handleStop}
                  />
                ))}
                {columnTickets.length === 0 && (
                  <div className="board-empty">
                    {status === "todo"
                      ? "Nothing planned"
                      : status === "in_progress"
                        ? "Nothing in progress"
                        : "Nothing done yet"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stop confirmation dialog */}
      {stopResult && (
        <div className="stop-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}>
          <div className="stop-dialog">
            <div className="stop-header">
              <div className="stop-title">Log time</div>
              <button className="stop-close" onClick={handleDismiss}>&times;</button>
            </div>
            <div className="stop-body">
              <div className="stop-ticket-name">{stopResult.ticket_title}</div>
              <div className="stop-stats">
                <div className="stop-stat">
                  <span className="stop-stat-label">Timer</span>
                  <span className="stop-stat-value">{stopResult.elapsed_hours.toFixed(1)}h</span>
                </div>
                <div className="stop-stat">
                  <span className="stop-stat-label">Logged today</span>
                  <span className="stop-stat-value">{stopResult.logged_today.toFixed(1)}h</span>
                </div>
                <div className="stop-stat">
                  <span className="stop-stat-label">Budget left</span>
                  <span className="stop-stat-value">{stopResult.budget_remaining.toFixed(1)}h</span>
                </div>
              </div>
              <div className="stop-proposed">
                <label className="stop-proposed-label">Log as:</label>
                <input
                  className="stop-proposed-input"
                  type="number"
                  step="0.5"
                  value={confirmHours}
                  onChange={(e) => setConfirmHours(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmLog();
                  }}
                  autoFocus
                />
                <span className="stop-proposed-unit">hours</span>
              </div>
              {stopResult.elapsed_hours > stopResult.proposed_hours && (
                <div className="stop-slug-note">
                  The slug slowed {(stopResult.elapsed_hours - stopResult.proposed_hours).toFixed(1)}h to fit your day budget
                </div>
              )}
            </div>
            <div className="stop-actions">
              <button className="stop-dismiss" onClick={handleDismiss}>Skip</button>
              <button className="stop-confirm" onClick={handleConfirmLog}>Log it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  onMove,
  onDelete,
  onStart,
  onStop,
}: {
  ticket: Ticket;
  onMove: (id: string, status: TicketStatus) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
}) {
  const isRunning = ticket.started_at !== null;
  const [elapsed, setElapsed] = useState("");

  // Live elapsed time display
  useEffect(() => {
    if (!isRunning || !ticket.started_at) return;
    const update = () => {
      const started = new Date(ticket.started_at!).getTime();
      const now = Date.now();
      const mins = Math.floor((now - started) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [isRunning, ticket.started_at]);

  const moveOptions: { label: string; status: TicketStatus }[] = [];
  if (ticket.status !== "todo")
    moveOptions.push({ label: "\u2190 To Do", status: "todo" });
  if (ticket.status !== "in_progress")
    moveOptions.push({
      label: ticket.status === "todo" ? "Start \u2192" : "\u2190 In Progress",
      status: "in_progress",
    });
  if (ticket.status !== "done")
    moveOptions.push({ label: "Done \u2713", status: "done" });

  return (
    <div className={`ticket-card ${isRunning ? "is-running" : ""}`}>
      <div className="ticket-top">
        <div className="ticket-title">{ticket.title}</div>
        {isRunning && <div className="ticket-timer">{elapsed}</div>}
      </div>
      {ticket.description && (
        <div className="ticket-desc">{ticket.description}</div>
      )}
      {ticket.project && (
        <div className="ticket-project">{ticket.project}</div>
      )}
      <div className="ticket-actions">
        {/* Timer button */}
        {ticket.status !== "done" && (
          isRunning ? (
            <button className="ticket-timer-btn stop" onClick={() => onStop(ticket.id)}>
              &#9632; Stop
            </button>
          ) : (
            <button className="ticket-timer-btn start" onClick={() => onStart(ticket.id)}>
              &#9654; Start
            </button>
          )
        )}
        {/* Move buttons */}
        {moveOptions.map((opt) => (
          <button
            key={opt.status}
            className={`ticket-move-btn ${opt.status === "done" ? "move-done" : ""}`}
            onClick={() => onMove(ticket.id, opt.status)}
          >
            {opt.label}
          </button>
        ))}
        <button
          className="ticket-delete-btn"
          onClick={() => onDelete(ticket.id)}
          title="Delete"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
