use clap::{Parser, Subcommand};
use chrono::Datelike;
use slog_core::{Database, NewEntry, TaskArea};

#[derive(Parser)]
#[command(name = "slog", about = "SlugLog — Dev Journal & Timetracker CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Log a new entry. Only description and hours are required.
    Log {
        /// What you did
        description: String,
        /// Hours spent
        hours: f64,
        #[arg(short, long)]
        project: Option<String>,
        #[arg(long, alias = "pn")]
        project_number: Option<String>,
        #[arg(short, long)]
        area: Option<String>,
        #[arg(short, long)]
        output: Option<String>,
        #[arg(short, long)]
        notes: Option<String>,
    },
    /// Show today's entries
    Today,
    /// Show this week's entries and summary
    Week,
    /// Start a timer on a task (creates ticket if needed, auto-stops previous)
    Start {
        /// Task description
        description: String,
        #[arg(short, long)]
        project: Option<String>,
    },
    /// Stop the running timer and log the entry
    Stop,
    /// Show what's currently running
    Status,
}

fn main() {
    let cli = Cli::parse();
    let db = Database::open_default().expect("Failed to open SLOG database");

    match cli.command {
        Commands::Log {
            description,
            hours,
            project,
            project_number,
            area,
            output,
            notes,
        } => {
            let area = area.and_then(|a| TaskArea::from_str(&a));
            let entry = db
                .create_entry(NewEntry {
                    description,
                    hours,
                    project,
                    project_number,
                    area,
                    output,
                    notes,
                })
                .expect("Failed to create entry");
            println!(
                "Logged: {} ({:.1}h) at {}",
                entry.description, entry.hours, entry.time
            );
        }
        Commands::Today => {
            let today = chrono::Local::now().format("%Y-%m-%d").to_string();
            let entries = db
                .get_entries_for_date(&today)
                .expect("Failed to get entries");
            if entries.is_empty() {
                println!("No entries today. Start slogging!");
                return;
            }
            let total: f64 = entries.iter().map(|e| e.hours).sum();
            println!("Today ({}) — {:.1}h total\n", today, total);
            for e in &entries {
                let project = e.project.as_deref().unwrap_or("");
                let area = e.area.as_ref().map(|a| a.display()).unwrap_or("");
                println!(
                    "  {} │ {:.1}h │ {} {} │ {}",
                    e.time, e.hours, project, area, e.description
                );
            }
        }
        Commands::Week => {
            let now = chrono::Local::now();
            let year = now.year();
            let week = now.iso_week().week();
            let entries = db
                .get_entries_for_week(year, week)
                .expect("Failed to get entries");
            let summary = db
                .get_week_summary(year, week)
                .expect("Failed to get summary");

            println!("Week {} ({}) — {:.1}h total\n", week, year, summary.total_hours);

            for day in &summary.by_day {
                if day.entry_count == 0 {
                    let date = chrono::NaiveDate::parse_from_str(&day.date, "%Y-%m-%d").ok();
                    let weekday = date.map(|d| d.format("%a").to_string()).unwrap_or_default();
                    println!("  {} {} — (no entries)", weekday, day.date);
                    continue;
                }
                let date = chrono::NaiveDate::parse_from_str(&day.date, "%Y-%m-%d").ok();
                let weekday = date.map(|d| d.format("%a").to_string()).unwrap_or_default();
                println!(
                    "  {} {} — {:.1}h ({} entries)",
                    weekday, day.date, day.hours, day.entry_count
                );
                for e in entries.iter().filter(|e| e.date == day.date) {
                    let project = e.project.as_deref().unwrap_or("");
                    println!("    {} │ {:.1}h │ {} │ {}", e.time, e.hours, project, e.description);
                }
            }

            if !summary.by_project.is_empty() {
                println!("\nBy project:");
                for p in &summary.by_project {
                    let pn = p
                        .project_number
                        .as_deref()
                        .map(|n| format!(" #{}", n))
                        .unwrap_or_default();
                    println!("  {:.1}h — {}{}", p.hours, p.project, pn);
                }
            }
        }
        Commands::Start { description, project } => {
            // Create a ticket and start the timer
            let ticket = db
                .create_ticket(description.clone(), None, project.clone())
                .expect("Failed to create ticket");
            let auto_stopped = db
                .start_timer(&ticket.id)
                .expect("Failed to start timer");

            // If something was auto-stopped, log it automatically
            if let Some(stopped) = auto_stopped {
                let hours = stopped.proposed_hours;
                db.confirm_stop(
                    &stopped.ticket_id,
                    &stopped.ticket_title,
                    hours,
                    stopped.project.clone(),
                )
                .expect("Failed to log auto-stopped task");
                println!(
                    "Auto-stopped: {} ({:.1}h logged)",
                    stopped.ticket_title, hours
                );
            }

            println!("Timer started: {}", description);
            if let Some(ref p) = project {
                println!("  Project: {}", p);
            }
            println!("  Run `slog stop` when done.");
        }
        Commands::Stop => {
            // Find the running ticket
            let tickets = db.get_all_tickets().expect("Failed to get tickets");
            let running = tickets.iter().find(|t| t.started_at.is_some());

            match running {
                Some(ticket) => {
                    let result = db
                        .stop_timer(&ticket.id)
                        .expect("Failed to stop timer");

                    // Auto-log with proposed hours
                    let entry = db
                        .confirm_stop(
                            &result.ticket_id,
                            &result.ticket_title,
                            result.proposed_hours,
                            result.project.clone(),
                        )
                        .expect("Failed to log entry");

                    println!("Stopped: {}", result.ticket_title);
                    println!(
                        "  Timer: {:.1}h → Logged: {:.1}h (slug-budgeted)",
                        result.elapsed_hours, result.proposed_hours
                    );
                    if result.elapsed_hours > result.proposed_hours {
                        println!(
                            "  The slug slowed {:.1}h to fit your day budget",
                            result.elapsed_hours - result.proposed_hours
                        );
                    }
                    println!("  Today: {:.1}h logged", result.logged_today + result.proposed_hours);
                }
                None => {
                    println!("No timer running. Start one with `slog start \"task name\"`");
                }
            }
        }
        Commands::Status => {
            let tickets = db.get_all_tickets().expect("Failed to get tickets");
            let running = tickets.iter().find(|t| t.started_at.is_some());

            match running {
                Some(ticket) => {
                    let started = chrono::DateTime::parse_from_rfc3339(
                        ticket.started_at.as_ref().unwrap(),
                    )
                    .unwrap();
                    let elapsed = chrono::Local::now().signed_duration_since(started);
                    let mins = elapsed.num_minutes();
                    let h = mins / 60;
                    let m = mins % 60;
                    let time_str = if h > 0 {
                        format!("{}h {}m", h, m)
                    } else {
                        format!("{}m", m)
                    };

                    println!("Running: {}", ticket.title);
                    println!("  Elapsed: {}", time_str);
                    if let Some(ref p) = ticket.project {
                        println!("  Project: {}", p);
                    }
                    println!("  Run `slog stop` to log it.");
                }
                None => {
                    println!("No timer running.");

                    // Show today's summary
                    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
                    let hours = db.get_hours_for_date(&today).unwrap_or(0.0);
                    println!("Today: {:.1}h logged", hours);
                }
            }
        }
    }
}
