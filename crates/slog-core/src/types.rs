use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskArea {
    Programming,
    Testing,
    BugSolving,
    Meeting,
    Documenting,
    Investigating,
}

impl TaskArea {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "programming" => Some(Self::Programming),
            "testing" => Some(Self::Testing),
            "bug_solving" | "bug solving" | "bug" => Some(Self::BugSolving),
            "meeting" => Some(Self::Meeting),
            "documenting" => Some(Self::Documenting),
            "investigating" => Some(Self::Investigating),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Programming => "programming",
            Self::Testing => "testing",
            Self::BugSolving => "bug_solving",
            Self::Meeting => "meeting",
            Self::Documenting => "documenting",
            Self::Investigating => "investigating",
        }
    }

    pub fn display(&self) -> &'static str {
        match self {
            Self::Programming => "Programming",
            Self::Testing => "Testing",
            Self::BugSolving => "Bug Solving",
            Self::Meeting => "Meeting",
            Self::Documenting => "Documenting",
            Self::Investigating => "Investigating",
        }
    }
}

/// A stored log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    pub id: String,
    pub timestamp: String,     // ISO 8601
    pub date: String,          // YYYY-MM-DD
    pub time: String,          // HH:MM
    pub description: String,
    pub hours: f64,
    pub project: Option<String>,
    pub project_number: Option<String>,
    pub area: Option<TaskArea>,
    pub output: Option<String>,
    pub notes: Option<String>,
}

/// Input for creating a new entry
pub struct NewEntry {
    pub description: String,
    pub hours: f64,
    pub project: Option<String>,
    pub project_number: Option<String>,
    pub area: Option<TaskArea>,
    pub output: Option<String>,
    pub notes: Option<String>,
}

/// A personal task/ticket
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticket {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TicketStatus,
    pub project: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub sort_order: i32,
    pub started_at: Option<String>, // ISO 8601 timestamp when timer was started
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TicketStatus {
    Todo,
    InProgress,
    Done,
}

impl TicketStatus {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "todo" => Some(Self::Todo),
            "in_progress" | "in progress" => Some(Self::InProgress),
            "done" => Some(Self::Done),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Todo => "todo",
            Self::InProgress => "in_progress",
            Self::Done => "done",
        }
    }
}

/// Slug health status — tracks neglect over working days
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlugStatus {
    pub working_days_missed: i32,
    pub last_log_date: Option<String>,
    pub today_hours: f64,
    pub is_weekend: bool,
}

/// Result from stopping a timer — includes slug-budgeted hours
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StopResult {
    pub ticket_id: String,
    pub ticket_title: String,
    pub project: Option<String>,
    pub elapsed_hours: f64,
    pub proposed_hours: f64,
    pub logged_today: f64,
    pub budget_remaining: f64,
}

/// A configured project with defaults
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub project_number: Option<String>,
    pub default_area: Option<TaskArea>,
    pub color: Option<String>,
}

/// Summary of hours for a week, grouped by project and area
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekSummary {
    pub total_hours: f64,
    pub by_project: Vec<ProjectHours>,
    pub by_area: Vec<AreaHours>,
    pub by_day: Vec<DayHours>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectHours {
    pub project: String,
    pub project_number: Option<String>,
    pub hours: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AreaHours {
    pub area: String,
    pub hours: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayHours {
    pub date: String,
    pub hours: f64,
    pub entry_count: usize,
}
