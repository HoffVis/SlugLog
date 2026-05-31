use crate::git_commits::{collect_for_date, DayCommitGroup};
use sluglog_core::{Creature, CreatureState, Database, Entry, NewEntry, Project, SlugStatus, StopResult, TaskArea, Ticket, TicketStatus, WeekSummary};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

type DbState = Mutex<Database>;

#[tauri::command]
pub fn open_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    // Hide tray popup
    if let Some(popup) = app.get_webview_window("tray-popup") {
        popup.hide().ok();
    }
    Ok(())
}

#[tauri::command]
pub fn get_entries_for_week(
    db: State<DbState>,
    year: i32,
    week: u32,
) -> Result<Vec<Entry>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_entries_for_week(year, week).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_entries_for_date(
    db: State<DbState>,
    date: String,
) -> Result<Vec<Entry>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_entries_for_date(&date).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_today_entries(db: State<DbState>) -> Result<Vec<Entry>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    db.get_entries_for_date(&today).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_entry(
    db: State<DbState>,
    description: String,
    hours: f64,
    project: Option<String>,
    project_number: Option<String>,
    area: Option<String>,
    output: Option<String>,
    notes: Option<String>,
) -> Result<Entry, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let area = area.and_then(|a| TaskArea::from_str(&a));
    let entry = NewEntry {
        description,
        hours,
        project,
        project_number,
        area,
        output,
        notes,
    };
    db.create_entry(entry).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_entry(
    db: State<DbState>,
    id: String,
    description: Option<String>,
    hours: Option<f64>,
    project: Option<String>,
    project_number: Option<String>,
    area: Option<String>,
    output: Option<String>,
    notes: Option<String>,
) -> Result<Entry, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let area = area.and_then(|a| TaskArea::from_str(&a));
    db.update_entry(&id, description, hours, project, project_number, area, output, notes)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_synced(db: State<DbState>, id: String) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.toggle_synced(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_entry(db: State<DbState>, id: String) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_entry(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_week_summary(
    db: State<DbState>,
    year: i32,
    week: u32,
) -> Result<WeekSummary, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_week_summary(year, week).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_entries(db: State<DbState>) -> Result<Vec<Entry>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_entries().map_err(|e| e.to_string())
}

// ===== TICKETS =====

#[tauri::command]
pub fn get_tickets(db: State<DbState>) -> Result<Vec<Ticket>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_tickets().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_ticket(
    db: State<DbState>,
    title: String,
    description: Option<String>,
    project: Option<String>,
) -> Result<Ticket, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_ticket(title, description, project).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn move_ticket(
    db: State<DbState>,
    id: String,
    status: String,
) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let status = TicketStatus::from_str(&status).ok_or("Invalid status")?;
    db.update_ticket_status(&id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_ticket(db: State<DbState>, id: String) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_ticket(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_timer(
    db: State<DbState>,
    id: String,
) -> Result<Option<StopResult>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.start_timer(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stop_timer(
    db: State<DbState>,
    id: String,
) -> Result<StopResult, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.stop_timer(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn confirm_stop(
    db: State<DbState>,
    ticket_id: String,
    title: String,
    hours: f64,
    project: Option<String>,
) -> Result<Entry, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.confirm_stop(&ticket_id, &title, hours, project)
        .map_err(|e| e.to_string())
}

// ===== ENTRY WITH DATE =====

#[tauri::command]
pub fn create_entry_with_date(
    db: State<DbState>,
    date: String,
    description: String,
    hours: f64,
    project: Option<String>,
    project_number: Option<String>,
    area: Option<String>,
    output: Option<String>,
    notes: Option<String>,
) -> Result<Entry, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let area = area.and_then(|a| TaskArea::from_str(&a));
    db.create_entry_with_date(&date, NewEntry {
        description,
        hours,
        project,
        project_number,
        area,
        output,
        notes,
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_hours_for_date(db: State<DbState>, date: String) -> Result<f64, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_hours_for_date(&date).map_err(|e| e.to_string())
}

// ===== SLUG MOOD =====

#[tauri::command]
pub fn get_slug_status(db: State<DbState>) -> Result<SlugStatus, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_slug_status().map_err(|e| e.to_string())
}

// ===== CREATURES =====

#[tauri::command]
pub fn get_creature_state(db: State<DbState>) -> Result<CreatureState, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_creature_state().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn hatch_creature(
    db: State<DbState>,
    creature_type: String,
    name: Option<String>,
) -> Result<Creature, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.hatch_creature(&creature_type, name.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_graveyard(db: State<DbState>) -> Result<Vec<Creature>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_graveyard().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn name_creature(
    db: State<DbState>,
    id: String,
    name: String,
) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.name_creature(&id, &name).map_err(|e| e.to_string())
}

// ===== VACATION =====

#[tauri::command]
pub fn get_vacation_mode(db: State<DbState>) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    Ok(db.get_vacation_mode())
}

#[tauri::command]
pub fn set_vacation_mode(db: State<DbState>, on: bool) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.set_vacation_mode(on).map_err(|e| e.to_string())
}

// ===== PROJECTS =====

#[tauri::command]
pub fn get_projects(db: State<DbState>) -> Result<Vec<Project>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_projects().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(
    db: State<DbState>,
    name: String,
    project_number: Option<String>,
    default_area: Option<String>,
    color: Option<String>,
) -> Result<Project, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_project(name, project_number, default_area, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(
    db: State<DbState>,
    id: String,
    name: String,
    project_number: Option<String>,
    default_area: Option<String>,
    color: Option<String>,
) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_project(&id, name, project_number, default_area, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(db: State<DbState>, id: String) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_project(&id).map_err(|e| e.to_string())
}

// ===== GIT COMMITS (memory aid, not persisted) =====

#[tauri::command]
pub async fn get_commits_for_date(date: String) -> Result<Vec<DayCommitGroup>, String> {
    tauri::async_runtime::spawn_blocking(move || collect_for_date(&date))
        .await
        .map_err(|e| e.to_string())
}
