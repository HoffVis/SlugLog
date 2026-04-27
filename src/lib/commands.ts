import { invoke } from "@tauri-apps/api/core";
import type { Entry, Project, StopResult, Ticket, WeekSummary } from "./types";

export async function getEntriesForWeek(
  year: number,
  week: number
): Promise<Entry[]> {
  return invoke("get_entries_for_week", { year, week });
}

export async function getEntriesForDate(date: string): Promise<Entry[]> {
  return invoke("get_entries_for_date", { date });
}

export async function getTodayEntries(): Promise<Entry[]> {
  return invoke("get_today_entries");
}

export async function getAllEntries(): Promise<Entry[]> {
  return invoke("get_all_entries");
}

export async function createEntry(params: {
  description: string;
  hours: number;
  project?: string;
  projectNumber?: string;
  area?: string;
  output?: string;
  notes?: string;
}): Promise<Entry> {
  return invoke("create_entry", {
    description: params.description,
    hours: params.hours,
    project: params.project ?? null,
    projectNumber: params.projectNumber ?? null,
    area: params.area ?? null,
    output: params.output ?? null,
    notes: params.notes ?? null,
  });
}

export async function updateEntry(params: {
  id: string;
  description?: string;
  hours?: number;
  project?: string;
  projectNumber?: string;
  area?: string;
  output?: string;
  notes?: string;
}): Promise<Entry> {
  return invoke("update_entry", {
    id: params.id,
    description: params.description ?? null,
    hours: params.hours ?? null,
    project: params.project ?? null,
    projectNumber: params.projectNumber ?? null,
    area: params.area ?? null,
    output: params.output ?? null,
    notes: params.notes ?? null,
  });
}

export async function toggleSynced(id: string): Promise<boolean> {
  return invoke("toggle_synced", { id });
}

export async function deleteEntry(id: string): Promise<void> {
  return invoke("delete_entry", { id });
}

export async function createEntryWithDate(params: {
  date: string;
  description: string;
  hours: number;
  project?: string;
  projectNumber?: string;
  area?: string;
  output?: string;
  notes?: string;
}): Promise<Entry> {
  return invoke("create_entry_with_date", {
    date: params.date,
    description: params.description,
    hours: params.hours,
    project: params.project ?? null,
    projectNumber: params.projectNumber ?? null,
    area: params.area ?? null,
    output: params.output ?? null,
    notes: params.notes ?? null,
  });
}

export async function getHoursForDate(date: string): Promise<number> {
  return invoke("get_hours_for_date", { date });
}

export async function getWeekSummary(
  year: number,
  week: number
): Promise<WeekSummary> {
  return invoke("get_week_summary", { year, week });
}

// ===== TICKETS =====

export async function getTickets(): Promise<Ticket[]> {
  return invoke("get_tickets");
}

export async function createTicket(params: {
  title: string;
  description?: string;
  project?: string;
}): Promise<Ticket> {
  return invoke("create_ticket", {
    title: params.title,
    description: params.description ?? null,
    project: params.project ?? null,
  });
}

export async function moveTicket(id: string, status: string): Promise<void> {
  return invoke("move_ticket", { id, status });
}

export async function deleteTicket(id: string): Promise<void> {
  return invoke("delete_ticket", { id });
}

export async function startTimer(id: string): Promise<StopResult | null> {
  return invoke("start_timer", { id });
}

export async function stopTimer(id: string): Promise<StopResult> {
  return invoke("stop_timer", { id });
}

export async function confirmStop(params: {
  ticketId: string;
  title: string;
  hours: number;
  project?: string;
}): Promise<Entry> {
  return invoke("confirm_stop", {
    ticketId: params.ticketId,
    title: params.title,
    hours: params.hours,
    project: params.project ?? null,
  });
}

// ===== PROJECTS =====

export async function getProjects(): Promise<Project[]> {
  return invoke("get_projects");
}

export async function createProject(params: {
  name: string;
  projectNumber?: string;
  defaultArea?: string;
  color?: string;
}): Promise<Project> {
  return invoke("create_project", {
    name: params.name,
    projectNumber: params.projectNumber ?? null,
    defaultArea: params.defaultArea ?? null,
    color: params.color ?? null,
  });
}

export async function updateProject(params: {
  id: string;
  name: string;
  projectNumber?: string;
  defaultArea?: string;
  color?: string;
}): Promise<void> {
  return invoke("update_project", {
    id: params.id,
    name: params.name,
    projectNumber: params.projectNumber ?? null,
    defaultArea: params.defaultArea ?? null,
    color: params.color ?? null,
  });
}

export async function deleteProject(id: string): Promise<void> {
  return invoke("delete_project", { id });
}
