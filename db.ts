import { Database } from "bun:sqlite";
import { join } from "path";

const DB_PATH = join(import.meta.dir, "caddy.db");

const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent performance
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    handicap REAL DEFAULT 0,
    email TEXT,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    course_name TEXT NOT NULL,
    course_id TEXT,
    date TEXT NOT NULL,
    tees TEXT DEFAULT 'white',
    format TEXT DEFAULT 'stroke' CHECK(format IN ('stroke','match','scramble','bestball','stableford','skins')),
    total_score INTEGER,
    total_putts INTEGER,
    fairways_hit INTEGER,
    gir INTEGER,
    notes TEXT,
    weather TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS hole_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    hole_number INTEGER NOT NULL CHECK(hole_number BETWEEN 1 AND 18),
    par INTEGER DEFAULT 4 CHECK(par BETWEEN 3 AND 5),
    yardage INTEGER,
    score INTEGER,
    putts INTEGER,
    fairway_hit INTEGER DEFAULT 0,
    gir INTEGER DEFAULT 0,
    penalties INTEGER DEFAULT 0,
    club_used TEXT,
    distance_to_pin INTEGER,
    shot_notes TEXT,
    journal TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (round_id) REFERENCES rounds(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(round_id, player_id, hole_number)
  );

  CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id INTEGER NOT NULL,
    bet_type TEXT NOT NULL CHECK(bet_type IN ('nassau','skins','wolf','dots','custom')),
    unit_value REAL DEFAULT 1,
    teams TEXT DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK(status IN ('active','settled')),
    settings TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (round_id) REFERENCES rounds(id)
  );

  CREATE TABLE IF NOT EXISTS bet_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bet_id INTEGER NOT NULL,
    hole_number INTEGER NOT NULL,
    result TEXT DEFAULT '{}',
    running_total TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bet_id) REFERENCES bets(id)
  );

  CREATE TABLE IF NOT EXISTS presses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bet_id INTEGER NOT NULL,
    pressing_team TEXT NOT NULL,
    from_hole INTEGER NOT NULL,
    bet_name TEXT,
    unit_value REAL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bet_id) REFERENCES bets(id)
  );

  CREATE TABLE IF NOT EXISTS club_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    club TEXT NOT NULL,
    avg_distance REAL DEFAULT 0,
    total_shots INTEGER DEFAULT 0,
    miss_pattern TEXT DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(player_id, club)
  );

  CREATE TABLE IF NOT EXISTS email_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'landing',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
