export type TaskArea =
  | "programming"
  | "testing"
  | "bug_solving"
  | "meeting"
  | "documenting"
  | "investigating";

export interface Entry {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  description: string;
  hours: number;
  project: string | null;
  project_number: string | null;
  area: TaskArea | null;
  output: string | null;
  notes: string | null;
  synced: boolean;
}

export interface WeekSummary {
  total_hours: number;
  by_project: ProjectHours[];
  by_area: AreaHours[];
  by_day: DayHours[];
}

export interface ProjectHours {
  project: string;
  project_number: string | null;
  hours: number;
}

export interface AreaHours {
  area: string;
  hours: number;
}

export interface DayHours {
  date: string;
  hours: number;
  entry_count: number;
}

export const AREA_LABELS: Record<TaskArea, string> = {
  programming: "Programming",
  testing: "Testing",
  bug_solving: "Bug Solving",
  meeting: "Meeting",
  documenting: "Documenting",
  investigating: "Investigating",
};

export type TicketStatus = "todo" | "in_progress" | "done";

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  project: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
  started_at: string | null;
}

export interface SlugStatus {
  working_days_missed: number;
  last_log_date: string | null;
  today_hours: number;
  is_weekend: boolean;
}

export interface Creature {
  id: string;
  creature_type: string;
  name: string | null;
  born_at: string;
  died_at: string | null;
  cause_of_death: string | null;
  generation: number;
}

export type CreatureLifecycle = "egg" | "alive" | "dead";

export interface CreatureState {
  lifecycle: CreatureLifecycle;
  creature: Creature | null;
  graveyard_count: number;
  mood: string;
  working_days_missed: number;
  today_hours: number;
  is_weekend: boolean;
}

export interface StopResult {
  ticket_id: string;
  ticket_title: string;
  project: string | null;
  elapsed_hours: number;
  proposed_hours: number;
  logged_today: number;
  budget_remaining: number;
}

export interface Project {
  id: string;
  name: string;
  project_number: string | null;
  default_area: TaskArea | null;
  color: string | null;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const AREAS: TaskArea[] = [
  "programming",
  "testing",
  "bug_solving",
  "meeting",
  "documenting",
  "investigating",
];

export interface DayCommit {
  sha: string;
  repo: string;
  message: string;
  timestamp: string;
  url: string | null;
  pushed: boolean;
}

export interface DayCommitGroup {
  repo: string;
  commits: DayCommit[];
}
