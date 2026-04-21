mod commands;

use chrono::Datelike;
use chrono::Timelike;
use tauri::Emitter;
use tauri::Manager;
use tauri::tray::TrayIconEvent;
use tauri::WebviewWindowBuilder;
use tauri::WebviewUrl;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_entries_for_week,
            commands::get_entries_for_date,
            commands::get_today_entries,
            commands::create_entry,
            commands::update_entry,
            commands::delete_entry,
            commands::get_week_summary,
            commands::open_main_window,
            commands::create_entry_with_date,
            commands::get_hours_for_date,
            commands::get_slug_status,
            commands::get_tickets,
            commands::create_ticket,
            commands::move_ticket,
            commands::delete_ticket,
            commands::start_timer,
            commands::stop_timer,
            commands::confirm_stop,
            commands::get_projects,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
        ])
        .setup(|app| {
            // Initialize the database
            let db = slog_core::Database::open_default()
                .expect("Failed to open SLOG database");
            app.manage(std::sync::Mutex::new(db));

            // Morning reminder — check every 60s, pop up at 9:00 if slug is neglected
            let reminder_handle = app.handle().clone();
            std::thread::spawn(move || {
                let mut last_shown_date = String::new();
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(60));
                    let now = chrono::Local::now();
                    let hour = now.hour();
                    let today = now.format("%Y-%m-%d").to_string();
                    let weekday = now.weekday();

                    // Only trigger at 9:00-9:05 on weekdays, once per day
                    if hour == 9
                        && weekday != chrono::Weekday::Sat
                        && weekday != chrono::Weekday::Sun
                        && last_shown_date != today
                    {
                        // Check if they've logged anything today
                        if let Some(db_state) = reminder_handle.try_state::<std::sync::Mutex<slog_core::Database>>() {
                            if let Ok(db) = db_state.lock() {
                                let today_hours = db.get_hours_for_date(&today).unwrap_or(0.0);
                                if today_hours < 1.0 {
                                    // Show the main window with the reminder
                                    if let Some(window) = reminder_handle.get_webview_window("main") {
                                        window.show().ok();
                                        window.set_focus().ok();
                                        // Emit event to frontend to show reminder
                                        window.emit("show-slug-reminder", ()).ok();
                                    }
                                    last_shown_date = today;
                                }
                            }
                        }
                    }
                }
            });

            // Handle tray icon click — toggle tray popup
            let app_handle = app.handle().clone();
            if let Some(tray) = app.tray_by_id("main") {
                tray.on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { button, button_state, rect, .. } = event {
                        if button == tauri::tray::MouseButton::Left
                            && button_state == tauri::tray::MouseButtonState::Up
                        {
                            // Center popup below tray icon
                            let popup_width = 360.0_f64;
                            let (rx, ry) = match rect.position {
                                tauri::Position::Physical(p) => (p.x as f64, p.y as f64),
                                tauri::Position::Logical(p) => (p.x, p.y),
                            };
                            let (rw, rh) = match rect.size {
                                tauri::Size::Physical(s) => (s.width as f64, s.height as f64),
                                tauri::Size::Logical(s) => (s.width, s.height),
                            };
                            let x = rx - (popup_width / 2.0) + (rw / 2.0);
                            let y = ry + rh + 4.0;

                            if let Some(popup) = app_handle.get_webview_window("tray-popup") {
                                if popup.is_visible().unwrap_or(false) {
                                    popup.hide().ok();
                                } else {
                                    popup.set_position(tauri::Position::Physical(
                                        tauri::PhysicalPosition::new(x as i32, y as i32),
                                    )).ok();
                                    popup.show().ok();
                                    popup.set_focus().ok();
                                }
                            } else {
                                // Create the tray popup window anchored below the tray icon
                                // visible_on_all_workspaces so it appears over fullscreen apps
                                let builder = WebviewWindowBuilder::new(
                                    &app_handle,
                                    "tray-popup",
                                    WebviewUrl::App("/tray".into()),
                                )
                                .title("")
                                .inner_size(popup_width, 480.0)
                                .position(x, y)
                                .resizable(false)
                                .decorations(false)
                                .always_on_top(true)
                                .visible_on_all_workspaces(true)
                                .skip_taskbar(true)
                                .visible(true)
                                .focused(true);

                                if let Ok(popup) = builder.build() {
                                    // Hide popup when it loses focus
                                    let popup_handle = popup.clone();
                                    popup.on_window_event(move |event| {
                                        if let tauri::WindowEvent::Focused(false) = event {
                                            popup_handle.hide().ok();
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        // Hide main window on close instead of quitting — keep tray alive
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    window.hide().ok();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running SLOG");
}
