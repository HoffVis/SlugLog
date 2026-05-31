use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DayCommit {
    pub sha: String,
    pub repo: String,
    pub message: String,
    pub timestamp: String,
    pub url: Option<String>,
    pub pushed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DayCommitGroup {
    pub repo: String,
    pub commits: Vec<DayCommit>,
}

fn next_iso_day(date: &str) -> Option<String> {
    let parsed = chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d").ok()?;
    Some(parsed.succ_opt()?.format("%Y-%m-%d").to_string())
}

fn pushed_for_day(date: &str) -> Vec<DayCommit> {
    let output = Command::new("gh")
        .args([
            "search",
            "commits",
            "--author=@me",
            &format!("--committer-date={}", date),
            "--json",
            "sha,commit,repository,url",
            "--limit",
            "100",
        ])
        .output();

    let output = match output {
        Ok(o) if o.status.success() => o,
        _ => return Vec::new(),
    };

    let json: serde_json::Value = match serde_json::from_slice(&output.stdout) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };

    let arr = match json.as_array() {
        Some(a) => a,
        None => return Vec::new(),
    };

    arr.iter()
        .filter_map(|item| {
            let sha = item["sha"].as_str()?.to_string();
            let repo = item["repository"]["name"].as_str()?.to_string();
            let raw_msg = item["commit"]["message"].as_str()?.to_string();
            let message = raw_msg.lines().next().unwrap_or("").to_string();
            let timestamp = item["commit"]["committer"]["date"].as_str()?.to_string();
            let url = item["url"].as_str().map(String::from);
            Some(DayCommit {
                sha,
                repo,
                message,
                timestamp,
                url,
                pushed: true,
            })
        })
        .collect()
}

fn home_desktop() -> Option<PathBuf> {
    std::env::var("HOME").ok().map(|h| PathBuf::from(h).join("Desktop"))
}

fn walk_for_git(dir: &Path, out: &mut Vec<PathBuf>, depth: usize, max_depth: usize) {
    if depth > max_depth {
        return;
    }
    let git_dir = dir.join(".git");
    if git_dir.exists() {
        out.push(dir.to_path_buf());
        return;
    }
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n,
            None => continue,
        };
        if name.starts_with('.') || name == "node_modules" || name == "target" || name == "build" {
            continue;
        }
        walk_for_git(&path, out, depth + 1, max_depth);
    }
}

fn discover_local_repos() -> Vec<PathBuf> {
    let desktop = match home_desktop() {
        Some(d) => d,
        None => return Vec::new(),
    };
    let mut out = Vec::new();
    walk_for_git(&desktop, &mut out, 0, 4);
    out
}

fn has_upstream(repo: &Path) -> bool {
    Command::new("git")
        .arg("-C")
        .arg(repo)
        .args(["rev-parse", "--abbrev-ref", "@{u}"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn unpushed_for_day(repo: &Path, date: &str, next_day: &str) -> Vec<DayCommit> {
    let range = if has_upstream(repo) { "@{u}..HEAD" } else { "HEAD" };
    let output = Command::new("git")
        .arg("-C")
        .arg(repo)
        .args([
            "log",
            range,
            &format!("--since={}T00:00:00", date),
            &format!("--until={}T00:00:00", next_day),
            "--pretty=format:%H|%aI|%s",
        ])
        .output();

    let output = match output {
        Ok(o) if o.status.success() => o,
        _ => return Vec::new(),
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let repo_name = repo
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("local")
        .to_string();

    stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|line| {
            let mut parts = line.splitn(3, '|');
            let sha = parts.next()?.to_string();
            let timestamp = parts.next()?.to_string();
            let message = parts.next()?.to_string();
            Some(DayCommit {
                sha,
                repo: repo_name.clone(),
                message,
                timestamp,
                url: None,
                pushed: false,
            })
        })
        .collect()
}

fn group_commits(all: Vec<DayCommit>) -> Vec<DayCommitGroup> {
    use std::collections::{HashMap, HashSet};
    let mut seen: HashSet<String> = HashSet::new();
    let mut groups: HashMap<String, Vec<DayCommit>> = HashMap::new();
    for c in all {
        if !seen.insert(c.sha.clone()) {
            continue;
        }
        groups.entry(c.repo.clone()).or_default().push(c);
    }
    let mut out: Vec<DayCommitGroup> = groups
        .into_iter()
        .map(|(repo, mut commits)| {
            commits.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
            DayCommitGroup { repo, commits }
        })
        .collect();
    out.sort_by(|a, b| a.repo.to_lowercase().cmp(&b.repo.to_lowercase()));
    out
}

pub fn collect_for_date(date: &str) -> Vec<DayCommitGroup> {
    let next_day = match next_iso_day(date) {
        Some(d) => d,
        None => return Vec::new(),
    };
    let mut all = pushed_for_day(date);
    for repo in discover_local_repos() {
        all.extend(unpushed_for_day(&repo, date, &next_day));
    }
    group_commits(all)
}
