use serde::Serialize;
use std::sync::Mutex;
use sysinfo::System;
use tauri::State;

#[derive(Serialize)]
struct SystemStats {
  cpu: f32,        // 0~100
  mem_used: u64,   // bytes
  mem_total: u64,
  mem_pct: f32,    // 0~100
  process_count: usize,
  uptime_secs: u64,
}

struct SysState(Mutex<System>);

#[tauri::command]
fn system_stats(state: State<SysState>) -> SystemStats {
  let mut sys = state.0.lock().unwrap();
  sys.refresh_cpu_usage();
  sys.refresh_memory();
  sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
  let mem_used = sys.used_memory();
  let mem_total = sys.total_memory().max(1);
  SystemStats {
    cpu: sys.global_cpu_usage(),
    mem_used,
    mem_total,
    mem_pct: mem_used as f32 / mem_total as f32 * 100.0,
    process_count: sys.processes().len(),
    uptime_secs: System::uptime(),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut sys = System::new_all();
  sys.refresh_all();
  tauri::Builder::default()
    .manage(SysState(Mutex::new(sys)))
    .invoke_handler(tauri::generate_handler![system_stats])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
