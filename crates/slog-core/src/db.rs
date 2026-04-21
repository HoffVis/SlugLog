use crate::types::*;
use chrono::{Datelike, Local, NaiveDate};
use rusqlite::{params, Connection, Result as SqlResult};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    /// Open the database at the default location: ~/Documents/slog/slog.db
    pub fn open_default() -> SqlResult<Self> {
        let path = Self::default_path();
        Self::open(&path)
    }

    pub fn default_path() -> PathBuf {
        let dir = dirs::document_dir()
            .unwrap_or_else(|| dirs::home_dir().unwrap())
            .join("slog");
        std::fs::create_dir_all(&dir).ok();
        dir.join("slog.db")
    }

    pub fn open(path: &PathBuf) -> SqlResult<Self> {
        let conn = Connection::open(path)?;
        let db = Self { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> SqlResult<()> {
        // Migrate: add synced column to entries if missing
        if self.conn.prepare("SELECT synced FROM entries LIMIT 0").is_err() {
            self.conn.execute_batch("ALTER TABLE entries ADD COLUMN synced INTEGER NOT NULL DEFAULT 0;").ok();
        }

        // Migrate: add started_at column if missing
        let has_started_at: bool = self.conn
            .prepare("SELECT started_at FROM tickets LIMIT 0")
            .is_ok();
        if !has_started_at {
            self.conn.execute_batch(
                "ALTER TABLE tickets ADD COLUMN started_at TEXT;"
            ).ok(); // ok() because table might not exist yet
        }

        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS entries (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                description TEXT NOT NULL,
                hours REAL NOT NULL,
                project TEXT,
                project_number TEXT,
                area TEXT,
                output TEXT,
                notes TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
            CREATE INDEX IF NOT EXISTS idx_entries_project ON entries(project);

            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'todo',
                project TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                started_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                project_number TEXT,
                default_area TEXT,
                color TEXT
            );

            INSERT OR IGNORE INTO settings (key, value) VALUES ('daily_budget', '8.0');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('daily_air', '1.0');",
        )
    }

    pub fn create_entry_with_date(&self, date: &str, entry: NewEntry) -> SqlResult<Entry> {
        let now = Local::now();
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = now.to_rfc3339();
        let time = now.format("%H:%M").to_string();
        let area_str = entry.area.as_ref().map(|a| a.as_str().to_string());

        self.conn.execute(
            "INSERT INTO entries (id, timestamp, date, time, description, hours, project, project_number, area, output, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                id, timestamp, date, time,
                entry.description, entry.hours, entry.project,
                entry.project_number, area_str, entry.output, entry.notes,
            ],
        )?;

        Ok(Entry {
            id, timestamp, date: date.to_string(), time,
            description: entry.description, hours: entry.hours,
            project: entry.project, project_number: entry.project_number,
            area: entry.area, output: entry.output, notes: entry.notes,
            synced: false,
        })
    }

    pub fn get_hours_for_date(&self, date: &str) -> SqlResult<f64> {
        self.conn.query_row(
            "SELECT COALESCE(SUM(hours), 0) FROM entries WHERE date = ?1",
            params![date],
            |row| row.get(0),
        )
    }

    pub fn create_entry(&self, entry: NewEntry) -> SqlResult<Entry> {
        let now = Local::now();
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = now.to_rfc3339();
        let date = now.format("%Y-%m-%d").to_string();
        let time = now.format("%H:%M").to_string();
        let area_str = entry.area.as_ref().map(|a| a.as_str().to_string());

        self.conn.execute(
            "INSERT INTO entries (id, timestamp, date, time, description, hours, project, project_number, area, output, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                id,
                timestamp,
                date,
                time,
                entry.description,
                entry.hours,
                entry.project,
                entry.project_number,
                area_str,
                entry.output,
                entry.notes,
            ],
        )?;

        Ok(Entry {
            id,
            timestamp,
            date,
            time,
            description: entry.description,
            hours: entry.hours,
            project: entry.project,
            project_number: entry.project_number,
            area: entry.area,
            output: entry.output,
            notes: entry.notes,
            synced: false,
        })
    }

    pub fn get_entries_for_date(&self, date: &str) -> SqlResult<Vec<Entry>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, timestamp, date, time, description, hours, project, project_number, area, output, notes, COALESCE(synced, 0) as synced
             FROM entries WHERE date = ?1 ORDER BY time ASC",
        )?;
        let entries = stmt
            .query_map(params![date], |row| {
                Ok(Entry {
                    id: row.get(0)?,
                    timestamp: row.get(1)?,
                    date: row.get(2)?,
                    time: row.get(3)?,
                    description: row.get(4)?,
                    hours: row.get(5)?,
                    project: row.get(6)?,
                    project_number: row.get(7)?,
                    area: row
                        .get::<_, Option<String>>(8)?
                        .and_then(|a| TaskArea::from_str(&a)),
                    output: row.get(9)?,
                    notes: row.get(10)?,
                    synced: row.get::<_, i32>(11).unwrap_or(0) != 0,
                })
            })?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(entries)
    }

    pub fn get_entries_for_week(&self, year: i32, week: u32) -> SqlResult<Vec<Entry>> {
        // Calculate Monday and Sunday of the given ISO week
        let monday = NaiveDate::from_isoywd_opt(year, week, chrono::Weekday::Mon)
            .unwrap_or_else(|| NaiveDate::from_ymd_opt(year, 1, 1).unwrap());
        let sunday = NaiveDate::from_isoywd_opt(year, week, chrono::Weekday::Sun)
            .unwrap_or_else(|| monday + chrono::Duration::days(6));

        let start = monday.format("%Y-%m-%d").to_string();
        let end = sunday.format("%Y-%m-%d").to_string();

        let mut stmt = self.conn.prepare(
            "SELECT id, timestamp, date, time, description, hours, project, project_number, area, output, notes, COALESCE(synced, 0) as synced
             FROM entries WHERE date >= ?1 AND date <= ?2 ORDER BY date ASC, time ASC",
        )?;
        let entries = stmt
            .query_map(params![start, end], |row| {
                Ok(Entry {
                    id: row.get(0)?,
                    timestamp: row.get(1)?,
                    date: row.get(2)?,
                    time: row.get(3)?,
                    description: row.get(4)?,
                    hours: row.get(5)?,
                    project: row.get(6)?,
                    project_number: row.get(7)?,
                    area: row
                        .get::<_, Option<String>>(8)?
                        .and_then(|a| TaskArea::from_str(&a)),
                    output: row.get(9)?,
                    notes: row.get(10)?,
                    synced: row.get::<_, i32>(11).unwrap_or(0) != 0,
                })
            })?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(entries)
    }

    pub fn update_entry(
        &self,
        id: &str,
        description: Option<String>,
        hours: Option<f64>,
        project: Option<String>,
        project_number: Option<String>,
        area: Option<TaskArea>,
        output: Option<String>,
        notes: Option<String>,
    ) -> SqlResult<Entry> {
        // Build dynamic update
        let mut sets = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(ref v) = description {
            sets.push("description = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(v) = hours {
            sets.push("hours = ?");
            values.push(Box::new(v));
        }
        if let Some(ref v) = project {
            sets.push("project = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = project_number {
            sets.push("project_number = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = area {
            sets.push("area = ?");
            values.push(Box::new(v.as_str().to_string()));
        }
        if let Some(ref v) = output {
            sets.push("output = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = notes {
            sets.push("notes = ?");
            values.push(Box::new(v.clone()));
        }

        if !sets.is_empty() {
            values.push(Box::new(id.to_string()));
            let sql = format!(
                "UPDATE entries SET {} WHERE id = ?",
                sets.join(", ")
            );
            let params: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
            self.conn.execute(&sql, params.as_slice())?;
        }

        // Return updated entry
        let mut stmt = self.conn.prepare(
            "SELECT id, timestamp, date, time, description, hours, project, project_number, area, output, notes, COALESCE(synced, 0) as synced
             FROM entries WHERE id = ?1",
        )?;
        stmt.query_row(params![id], |row| {
            Ok(Entry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                date: row.get(2)?,
                time: row.get(3)?,
                description: row.get(4)?,
                hours: row.get(5)?,
                project: row.get(6)?,
                project_number: row.get(7)?,
                area: row
                    .get::<_, Option<String>>(8)?
                    .and_then(|a| TaskArea::from_str(&a)),
                output: row.get(9)?,
                notes: row.get(10)?,
                synced: row.get::<_, i32>(11).unwrap_or(0) != 0,
            })
        })
    }

    pub fn toggle_synced(&self, id: &str) -> SqlResult<bool> {
        let current: i32 = self.conn.query_row(
            "SELECT COALESCE(synced, 0) FROM entries WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )?;
        let new_val = if current == 0 { 1 } else { 0 };
        self.conn.execute(
            "UPDATE entries SET synced = ?1 WHERE id = ?2",
            params![new_val, id],
        )?;
        Ok(new_val != 0)
    }

    pub fn delete_entry(&self, id: &str) -> SqlResult<()> {
        self.conn
            .execute("DELETE FROM entries WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_week_summary(&self, year: i32, week: u32) -> SqlResult<WeekSummary> {
        let entries = self.get_entries_for_week(year, week)?;

        let total_hours: f64 = entries.iter().map(|e| e.hours).sum();

        // By project
        let mut project_map: std::collections::HashMap<String, (Option<String>, f64)> =
            std::collections::HashMap::new();
        for e in &entries {
            let name = e.project.clone().unwrap_or_else(|| "(unassigned)".to_string());
            let entry = project_map
                .entry(name)
                .or_insert_with(|| (e.project_number.clone(), 0.0));
            entry.1 += e.hours;
        }
        let mut by_project: Vec<ProjectHours> = project_map
            .into_iter()
            .map(|(project, (pn, hours))| ProjectHours {
                project,
                project_number: pn,
                hours,
            })
            .collect();
        by_project.sort_by(|a, b| b.hours.partial_cmp(&a.hours).unwrap());

        // By area
        let mut area_map: std::collections::HashMap<String, f64> =
            std::collections::HashMap::new();
        for e in &entries {
            let name = e
                .area
                .as_ref()
                .map(|a| a.display().to_string())
                .unwrap_or_else(|| "(unset)".to_string());
            *area_map.entry(name).or_insert(0.0) += e.hours;
        }
        let mut by_area: Vec<AreaHours> = area_map
            .into_iter()
            .map(|(area, hours)| AreaHours { area, hours })
            .collect();
        by_area.sort_by(|a, b| b.hours.partial_cmp(&a.hours).unwrap());

        // By day
        let mut day_map: std::collections::HashMap<String, (f64, usize)> =
            std::collections::HashMap::new();
        for e in &entries {
            let entry = day_map.entry(e.date.clone()).or_insert((0.0, 0));
            entry.0 += e.hours;
            entry.1 += 1;
        }

        // Include all 7 days of the week
        let monday = NaiveDate::from_isoywd_opt(year, week, chrono::Weekday::Mon)
            .unwrap_or_else(|| NaiveDate::from_ymd_opt(year, 1, 1).unwrap());
        let mut by_day = Vec::new();
        for i in 0..7 {
            let d = monday + chrono::Duration::days(i);
            let date_str = d.format("%Y-%m-%d").to_string();
            let (hours, count) = day_map.get(&date_str).copied().unwrap_or((0.0, 0));
            by_day.push(DayHours {
                date: date_str,
                hours,
                entry_count: count,
            });
        }

        Ok(WeekSummary {
            total_hours,
            by_project,
            by_area,
            by_day,
        })
    }

    // ===== TICKETS =====

    pub fn create_ticket(&self, title: String, description: Option<String>, project: Option<String>) -> SqlResult<Ticket> {
        let now = Local::now().to_rfc3339();
        let id = uuid::Uuid::new_v4().to_string();

        let max_order: i32 = self.conn.query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM tickets WHERE status = 'todo'",
            [],
            |row| row.get(0),
        )?;

        self.conn.execute(
            "INSERT INTO tickets (id, title, description, status, project, created_at, updated_at, sort_order, started_at)
             VALUES (?1, ?2, ?3, 'todo', ?4, ?5, ?5, ?6, NULL)",
            params![id, title, description, project, now, max_order + 1],
        )?;

        Ok(Ticket {
            id,
            title,
            description,
            status: TicketStatus::Todo,
            project,
            created_at: now.clone(),
            updated_at: now,
            sort_order: max_order + 1,
            started_at: None,
        })
    }

    fn row_to_ticket(row: &rusqlite::Row) -> rusqlite::Result<Ticket> {
        Ok(Ticket {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            status: TicketStatus::from_str(&row.get::<_, String>(3)?)
                .unwrap_or(TicketStatus::Todo),
            project: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
            sort_order: row.get(7)?,
            started_at: row.get(8)?,
        })
    }

    pub fn get_all_tickets(&self) -> SqlResult<Vec<Ticket>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, description, status, project, created_at, updated_at, sort_order, started_at
             FROM tickets ORDER BY sort_order ASC",
        )?;
        let tickets = stmt
            .query_map([], Self::row_to_ticket)?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(tickets)
    }

    pub fn update_ticket_status(&self, id: &str, status: &TicketStatus) -> SqlResult<()> {
        let now = Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE tickets SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status.as_str(), now, id],
        )?;
        Ok(())
    }

    pub fn update_ticket(&self, id: &str, title: Option<String>, description: Option<String>, project: Option<String>) -> SqlResult<()> {
        let now = Local::now().to_rfc3339();
        let mut sets = vec!["updated_at = ?1"];
        let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(now)];

        if let Some(ref v) = title {
            sets.push("title = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = description {
            sets.push("description = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = project {
            sets.push("project = ?");
            values.push(Box::new(v.clone()));
        }

        values.push(Box::new(id.to_string()));
        let sql = format!("UPDATE tickets SET {} WHERE id = ?", sets.join(", "));
        let params: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
        self.conn.execute(&sql, params.as_slice())?;
        Ok(())
    }

    pub fn delete_ticket(&self, id: &str) -> SqlResult<()> {
        self.conn.execute("DELETE FROM tickets WHERE id = ?1", params![id])?;
        Ok(())
    }

    // ===== TIMER =====

    /// Start timer on a ticket. Auto-stops any other running ticket first.
    pub fn start_timer(&self, id: &str) -> SqlResult<Option<StopResult>> {
        let now = Local::now();
        let now_str = now.to_rfc3339();
        let mut stop_result = None;

        // Auto-stop any currently running ticket
        let running: Option<(String, String)> = self.conn.query_row(
            "SELECT id, started_at FROM tickets WHERE started_at IS NOT NULL AND id != ?1 LIMIT 1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).ok();

        if let Some((running_id, _)) = running {
            stop_result = Some(self.stop_timer_internal(&running_id, &now)?);
        }

        // Start this ticket
        self.conn.execute(
            "UPDATE tickets SET started_at = ?1, status = 'in_progress', updated_at = ?1 WHERE id = ?2",
            params![now_str, id],
        )?;

        Ok(stop_result)
    }

    /// Stop timer and return proposed hours (slug-budgeted)
    pub fn stop_timer(&self, id: &str) -> SqlResult<StopResult> {
        let now = Local::now();
        self.stop_timer_internal(id, &now)
    }

    fn stop_timer_internal(&self, id: &str, now: &chrono::DateTime<chrono::Local>) -> SqlResult<StopResult> {
        // Get ticket info
        let (title, started_at_str, project): (String, String, Option<String>) = self.conn.query_row(
            "SELECT title, started_at, project FROM tickets WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;

        // Calculate elapsed
        let started_at = chrono::DateTime::parse_from_rfc3339(&started_at_str)
            .unwrap_or_else(|_| now.fixed_offset());
        let elapsed_secs = (now.timestamp() - started_at.timestamp()).max(0) as f64;
        let elapsed_hours = (elapsed_secs / 3600.0 * 2.0).round() / 2.0; // round to nearest 0.5

        // Get today's budget
        let today = now.format("%Y-%m-%d").to_string();
        let logged_today: f64 = self.conn.query_row(
            "SELECT COALESCE(SUM(hours), 0) FROM entries WHERE date = ?1",
            params![today],
            |row| row.get(0),
        )?;
        let budget: f64 = self.get_setting("daily_budget").unwrap_or(8.0);
        let air: f64 = self.get_setting("daily_air").unwrap_or(1.0);
        let remaining = (budget - air - logged_today).max(0.0);

        // Slug it: propose the lesser of elapsed or remaining budget
        let proposed = if elapsed_hours > remaining && remaining > 0.0 {
            ((remaining * 2.0).round() / 2.0).max(0.5) // round to 0.5, min 0.5
        } else if remaining <= 0.0 {
            0.5 // always at least 0.5
        } else {
            elapsed_hours.max(0.5)
        };

        // Clear the timer
        self.conn.execute(
            "UPDATE tickets SET started_at = NULL, updated_at = ?1 WHERE id = ?2",
            params![now.to_rfc3339(), id],
        )?;

        Ok(StopResult {
            ticket_id: id.to_string(),
            ticket_title: title,
            project,
            elapsed_hours,
            proposed_hours: proposed,
            logged_today,
            budget_remaining: remaining,
        })
    }

    /// Confirm stop: create the actual log entry, pulling project defaults
    pub fn confirm_stop(&self, ticket_id: &str, title: &str, hours: f64, project: Option<String>) -> SqlResult<Entry> {
        // Look up project defaults if we have a project name
        let (project_number, default_area) = if let Some(ref pname) = project {
            self.conn.query_row(
                "SELECT project_number, default_area FROM projects WHERE name = ?1",
                params![pname],
                |row| Ok((row.get::<_, Option<String>>(0)?, row.get::<_, Option<String>>(1)?)),
            ).unwrap_or((None, None))
        } else {
            (None, None)
        };

        self.create_entry(NewEntry {
            description: title.to_string(),
            hours,
            project,
            project_number,
            area: default_area.and_then(|a| TaskArea::from_str(&a)),
            output: None,
            notes: None,
        })
    }

    // ===== PROJECTS =====

    pub fn create_project(&self, name: String, project_number: Option<String>, default_area: Option<String>, color: Option<String>) -> SqlResult<Project> {
        let id = uuid::Uuid::new_v4().to_string();
        let area = default_area.as_deref().and_then(TaskArea::from_str);
        self.conn.execute(
            "INSERT INTO projects (id, name, project_number, default_area, color) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, project_number, area.as_ref().map(|a| a.as_str()), color],
        )?;
        Ok(Project { id, name, project_number, default_area: area, color })
    }

    pub fn get_all_projects(&self) -> SqlResult<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, project_number, default_area, color FROM projects ORDER BY name ASC",
        )?;
        let projects = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                project_number: row.get(2)?,
                default_area: row.get::<_, Option<String>>(3)?
                    .and_then(|a| TaskArea::from_str(&a)),
                color: row.get(4)?,
            })
        })?.collect::<SqlResult<Vec<_>>>()?;
        Ok(projects)
    }

    pub fn update_project(&self, id: &str, name: String, project_number: Option<String>, default_area: Option<String>, color: Option<String>) -> SqlResult<()> {
        let area = default_area.as_deref().and_then(TaskArea::from_str);
        self.conn.execute(
            "UPDATE projects SET name = ?1, project_number = ?2, default_area = ?3, color = ?4 WHERE id = ?5",
            params![name, project_number, area.as_ref().map(|a| a.as_str()), color, id],
        )?;
        Ok(())
    }

    pub fn delete_project(&self, id: &str) -> SqlResult<()> {
        self.conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        Ok(())
    }

    // ===== SLUG STATUS =====

    pub fn get_slug_status(&self) -> SqlResult<SlugStatus> {
        let now = Local::now();
        let today = now.format("%Y-%m-%d").to_string();
        let today_weekday = now.weekday();
        let is_weekend = today_weekday == chrono::Weekday::Sat || today_weekday == chrono::Weekday::Sun;

        // Today's hours
        let today_hours: f64 = self.conn.query_row(
            "SELECT COALESCE(SUM(hours), 0) FROM entries WHERE date = ?1",
            params![today],
            |row| row.get(0),
        )?;

        // Last date with any entries
        let last_log_date: Option<String> = self.conn.query_row(
            "SELECT MAX(date) FROM entries",
            [],
            |row| row.get(0),
        ).ok().flatten();

        // Count working days missed (excluding weekends)
        // Today doesn't count as missed — you just got here!
        // We count from last_log_date+1 to YESTERDAY
        let working_days_missed = if today_hours > 0.0 {
            0
        } else if let Some(ref last_date) = last_log_date {
            let last = NaiveDate::parse_from_str(last_date, "%Y-%m-%d")
                .unwrap_or_else(|_| NaiveDate::from_ymd_opt(2020, 1, 1).unwrap());
            let today_naive = NaiveDate::parse_from_str(&today, "%Y-%m-%d")
                .unwrap_or_else(|_| NaiveDate::from_ymd_opt(2020, 1, 1).unwrap());
            let yesterday = today_naive - chrono::Duration::days(1);

            // If last log was today or yesterday, no missed days
            if last >= yesterday {
                0
            } else {
                let mut count = 0;
                let mut d = last + chrono::Duration::days(1);
                while d <= yesterday {
                    let wd = d.weekday();
                    if wd != chrono::Weekday::Sat && wd != chrono::Weekday::Sun {
                        count += 1;
                    }
                    d += chrono::Duration::days(1);
                }
                count
            }
        } else {
            // No entries ever — maximum sadness
            10
        };

        Ok(SlugStatus {
            working_days_missed,
            last_log_date,
            today_hours,
            is_weekend,
        })
    }

    fn get_setting(&self, key: &str) -> Option<f64> {
        self.conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get::<_, String>(0),
        )
        .ok()
        .and_then(|v| v.parse().ok())
    }
}
