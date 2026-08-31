use serde::Serialize;
use std::sync::Mutex;
use sysinfo::{Networks, System};
use tauri::State;

#[derive(Serialize)]
struct SystemStats {
  cpu: f32,        // 0~100
  mem_used: u64,   // bytes
  mem_total: u64,
  mem_pct: f32,    // 0~100
  process_count: usize,
  uptime_secs: u64,
  battery_pct: Option<f32>,
  charging: bool,
  net_bps: f64, // 최근 폴링 구간의 초당 송수신 바이트
  top_procs: Vec<ProcInfo>, // CPU 상위 프로세스
}

#[derive(Serialize)]
struct ProcInfo {
  pid: u32,
  name: String,
  cpu: f32,
}

struct SysState(Mutex<System>, Mutex<Networks>, Mutex<std::time::Instant>);

#[tauri::command]
fn system_stats(state: State<SysState>) -> SystemStats {
  let mut sys = state.0.lock().unwrap();
  sys.refresh_cpu_usage();
  sys.refresh_memory();
  sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
  let net_bps = {
    let mut nets = state.1.lock().unwrap();
    let mut last = state.2.lock().unwrap();
    nets.refresh(true);
    let secs = last.elapsed().as_secs_f64().max(0.5);
    *last = std::time::Instant::now();
    let bytes: u64 = nets.iter().map(|(_, d)| d.received() + d.transmitted()).sum();
    bytes as f64 / secs
  };
  let mut top: Vec<ProcInfo> = sys
    .processes()
    .values()
    .map(|p| ProcInfo { pid: p.pid().as_u32(), name: p.name().to_string_lossy().into_owned(), cpu: p.cpu_usage() })
    .collect();
  top.sort_by(|a, b| b.cpu.total_cmp(&a.cpu));
  top.truncate(3);
  let (battery_pct, charging) = read_battery();
  let mem_used = sys.used_memory();
  let mem_total = sys.total_memory().max(1);
  SystemStats {
    cpu: sys.global_cpu_usage(),
    mem_used,
    mem_total,
    mem_pct: mem_used as f32 / mem_total as f32 * 100.0,
    process_count: sys.processes().len(),
    uptime_secs: System::uptime(),
    battery_pct,
    charging,
    net_bps,
    top_procs: top,
  }
}

/// 사용자가 버튼으로 직접 요청했을 때만 호출됨. 이름이 일치할 때만 SIGTERM(정중한 종료 요청).
#[tauri::command]
fn calm_process(pid: u32, expected_name: String, state: State<SysState>) -> Result<String, String> {
  let mut sys = state.0.lock().unwrap();
  sys.refresh_processes(sysinfo::ProcessesToUpdate::Some(&[sysinfo::Pid::from_u32(pid)]), true);
  let p = sys.process(sysinfo::Pid::from_u32(pid)).ok_or("프로세스가 이미 사라졌어요")?;
  let name = p.name().to_string_lossy().into_owned();
  if name != expected_name {
    return Err(format!("프로세스가 바뀌었어요 ({name}) — 다시 확인해 주세요"));
  }
  if p.kill_with(sysinfo::Signal::Term).unwrap_or(false) {
    Ok(name)
  } else {
    Err("종료 요청을 보내지 못했어요 (권한 부족일 수 있어요)".into())
  }
}

fn read_battery() -> (Option<f32>, bool) {
  let Ok(manager) = starship_battery::Manager::new() else { return (None, true) };
  let Ok(mut batteries) = manager.batteries() else { return (None, true) };
  match batteries.next() {
    Some(Ok(b)) => {
      let pct = b.state_of_charge().get::<starship_battery::units::ratio::percent>();
      let charging = !matches!(b.state(), starship_battery::State::Discharging);
      (Some(pct), charging)
    }
    _ => (None, true),
  }
}

#[derive(Serialize)]
struct JunkChunk {
  bytes: u64,
  files: usize,
  source: String, // "npm" | "pip" | "xcode"
}

/// 재생성 가능한 캐시만 조사(읽기 전용). 아무것도 삭제하지 않음.
fn junk_roots() -> Vec<(std::path::PathBuf, String, u64)> {
  let home = dirs::home_dir().unwrap_or_default();
  vec![
    (home.join(".npm/_cacache"), "npm".into(), 30),
    (home.join("Library/Caches/pip"), "pip".into(), 30),
    (home.join("Library/Developer/Xcode/DerivedData"), "xcode".into(), 14),
  ]
}

fn walk_old_files(dir: &std::path::PathBuf, cutoff: std::time::SystemTime, sizes: &mut Vec<u64>, depth: u32) {
  if depth > 6 || sizes.len() > 20000 { return; }
  let Ok(rd) = std::fs::read_dir(dir) else { return };
  for e in rd.flatten() {
    let Ok(meta) = e.metadata() else { continue };
    if meta.is_dir() {
      walk_old_files(&e.path(), cutoff, sizes, depth + 1);
    } else if meta.is_file() && meta.modified().map(|m| m < cutoff).unwrap_or(false) {
      sizes.push(meta.len());
    }
  }
}

/// 오래된 캐시 파일 크기를 ~256MB 뭉치로 묶어 반환 (조사만, 삭제 없음)
#[tauri::command]
fn scan_junk() -> Vec<JunkChunk> {
  let mut chunks = Vec::new();
  for (root, source, days) in junk_roots() {
    if !root.exists() { continue; }
    let cutoff = std::time::SystemTime::now() - std::time::Duration::from_secs(days * 86400);
    let mut sizes = Vec::new();
    walk_old_files(&root, cutoff, &mut sizes, 0);
    let (mut bytes, mut files) = (0u64, 0usize);
    for sz in sizes {
      bytes += sz;
      files += 1;
      if bytes >= 256 * 1024 * 1024 {
        chunks.push(JunkChunk { bytes, files, source: source.clone() });
        bytes = 0; files = 0;
        if chunks.len() >= 120 { break; }
      }
    }
    if bytes > 1024 * 1024 {
      chunks.push(JunkChunk { bytes, files, source: source.clone() });
    }
  }
  chunks
}

#[tauri::command]
fn save_png(name: String, base64: String) -> Result<String, String> {
  use base64::Engine;
  // 파일명 안전장치
  let safe: String = name.chars().filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_' || *c == '.').collect();
  let bytes = base64::engine::general_purpose::STANDARD.decode(base64).map_err(|e| e.to_string())?;
  let dir = dirs::desktop_dir().or_else(dirs::download_dir).ok_or("저장 폴더를 찾을 수 없음")?;
  let path = dir.join(if safe.is_empty() { "world.png".into() } else { safe });
  std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
  Ok(path.display().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut sys = System::new_all();
  sys.refresh_all();
  tauri::Builder::default()
    .manage(SysState(Mutex::new(sys), Mutex::new(Networks::new_with_refreshed_list()), Mutex::new(std::time::Instant::now())))
    .invoke_handler(tauri::generate_handler![system_stats, save_png, scan_junk, calm_process])
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
