import db from "./db";

// Idempotency check
const existing = db.query("SELECT COUNT(*) as count FROM players").get() as any;
if (existing.count > 0) {
  console.log("Demo data already exists, skipping seed.");
  process.exit(0);
}

console.log("Seeding demo data...");

// Player: Victor Wilson, 15 handicap
const playerInsert = db.prepare(
  "INSERT INTO players (name, handicap, email) VALUES (?, ?, ?)"
);
playerInsert.run("Victor Wilson", 15, "victor@example.com");
const playerId = 1;

// Round: Torrey Pines North, today, stroke play
const today = new Date().toISOString().split("T")[0];
const roundInsert = db.prepare(
  "INSERT INTO rounds (player_id, course_name, course_id, date, tees, format, total_score, total_putts, fairways_hit, gir, notes, weather) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
roundInsert.run(
  playerId,
  "Torrey Pines North",
  "torrey-north",
  today,
  "white",
  "stroke",
  85,
  34,
  8,
  7,
  "Great day out. Wind picked up on the back nine.",
  "72°F, partly cloudy, 10mph wind"
);
const roundId = 1;

// Torrey Pines North hole data (white tees)
const tpNorth = [
  { hole: 1, par: 4, yardage: 392 },
  { hole: 2, par: 4, yardage: 380 },
  { hole: 3, par: 3, yardage: 178 },
  { hole: 4, par: 4, yardage: 362 },
  { hole: 5, par: 4, yardage: 435 },
  { hole: 6, par: 5, yardage: 499 },
  { hole: 7, par: 4, yardage: 385 },
  { hole: 8, par: 3, yardage: 163 },
  { hole: 9, par: 5, yardage: 487 },
  { hole: 10, par: 4, yardage: 365 },
  { hole: 11, par: 3, yardage: 155 },
  { hole: 12, par: 4, yardage: 398 },
  { hole: 13, par: 4, yardage: 412 },
  { hole: 14, par: 5, yardage: 502 },
  { hole: 15, par: 4, yardage: 357 },
  { hole: 16, par: 3, yardage: 171 },
  { hole: 17, par: 4, yardage: 424 },
  { hole: 18, par: 5, yardage: 526 },
];

// Victor's scores for the round — realistic 15-handicap round
const scores = [
  { hole: 1, score: 5, putts: 2, fairway: 1, gir: 0, club: "7-Iron", dist: 155, penalties: 0, notes: "Approach just right of the green, chipped on nicely", journal: "Solid start, just missed GIR right" },
  { hole: 2, score: 4, putts: 2, fairway: 1, gir: 1, club: "8-Iron", dist: 148, penalties: 0, notes: "Hit it to 20 feet, two putt par", journal: "Pure iron shot, left the birdie putt short" },
  { hole: 3, score: 2, putts: 1, fairway: 0, gir: 1, club: "6-Iron", dist: 178, penalties: 0, notes: "Pin high, 12 feet for birdie and drained it!", journal: "Flushed the 6-iron, best shot of the day. Birdie putt never left the cup." },
  { hole: 4, score: 5, putts: 2, fairway: 0, gir: 0, club: "PW", dist: 115, penalties: 0, notes: "Pulled driver into rough, had to chip out", journal: "Terrible drive left, punched out, pitched on for bogey" },
  { hole: 5, score: 6, putts: 2, fairway: 1, gir: 0, club: "5-Iron", dist: 195, penalties: 0, notes: "Long par 4, came up short with approach", journal: "Good drive but 5-iron came up 20 yards short. Tough hole." },
  { hole: 6, score: 5, putts: 2, fairway: 1, gir: 1, club: "8-Iron", dist: 145, penalties: 0, notes: "Two good shots then 8-iron to the green", journal: "Par on the par 5, played it smart" },
  { hole: 7, score: 3, putts: 1, fairway: 1, gir: 1, club: "9-Iron", dist: 138, penalties: 0, notes: "9-iron to 8 feet, made the putt", journal: "Birdie! 9-iron was money. Read the break perfectly." },
  { hole: 8, score: 4, putts: 2, fairway: 0, gir: 0, club: "7-Iron", dist: 163, penalties: 0, notes: "Missed green right, tough up-and-down", journal: "Three-quarter 7-iron pushed right. Chipped to 6 feet but missed the par save." },
  { hole: 9, score: 5, putts: 2, fairway: 0, gir: 1, club: "6-Iron", dist: 185, penalties: 0, notes: "Driver went right, recovery was good", journal: "Saved par... wait no, that's bogey on a par 5. Ugh. 3-putt avoided though." },
  { hole: 10, score: 5, putts: 2, fairway: 1, gir: 0, club: "PW", dist: 120, penalties: 0, notes: "PW spun back off the green", journal: "Approach had too much spin, rolled off the front" },
  { hole: 11, score: 3, putts: 2, fairway: 0, gir: 1, club: "8-Iron", dist: 155, penalties: 0, notes: "Solid 8-iron to 15 feet", journal: "Par on a tricky par 3. Wind was swirling." },
  { hole: 12, score: 5, putts: 2, fairway: 0, gir: 0, club: "9-Iron", dist: 140, penalties: 1, notes: "OB off the tee, re-teed", journal: "Snap hooked driver OB. Hitting 3 off the tee. Salvaged bogey which felt like a win." },
  { hole: 13, score: 5, putts: 2, fairway: 1, gir: 0, club: "7-Iron", dist: 168, penalties: 0, notes: "Approach caught the bunker", journal: "Good drive, but 7-iron found the greenside bunker. Blast out to 8 feet, missed the putt." },
  { hole: 14, score: 5, putts: 1, fairway: 1, gir: 1, club: "7-Iron", dist: 170, penalties: 0, notes: "Reached in two, two-putt par", journal: "Bombed driver, 7-iron from 170 to the green. Two-putt birdie... wait, par 5 so that's par. Still happy." },
  { hole: 15, score: 4, putts: 2, fairway: 0, gir: 1, club: "SW", dist: 95, penalties: 0, notes: "Missed fairway but wedge in was great", journal: "Sand wedge from the rough to 10 feet. Good par." },
  { hole: 16, score: 4, putts: 3, fairway: 0, gir: 1, club: "7-Iron", dist: 171, penalties: 0, notes: "Three putt bogey from 30 feet", journal: "Hit the green but three-jacked from 30 feet. Left first putt 6 feet short, lipped out the next." },
  { hole: 17, score: 6, putts: 2, fairway: 0, gir: 0, club: "5-Iron", dist: 190, penalties: 1, notes: "Water off the tee", journal: "Driver found the water. Drop, 5-iron short, chip on, two putt. Double. Rough finish." },
  { hole: 18, score: 5, putts: 2, fairway: 1, gir: 0, club: "8-Iron", dist: 152, penalties: 0, notes: "Great drive, approach just missed, bogey finish", journal: "Piped driver 270 down the middle. 8-iron to the fringe. Chip close, one putt... nope, two putt bogey to finish 87." },
];

const holeInsert = db.prepare(
  "INSERT INTO hole_scores (round_id, player_id, hole_number, par, yardage, score, putts, fairway_hit, gir, penalties, club_used, distance_to_pin, shot_notes, journal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

for (const s of scores) {
  const holeInfo = tpNorth.find((h) => h.hole === s.hole)!;
  holeInsert.run(
    roundId,
    playerId,
    s.hole,
    holeInfo.par,
    holeInfo.yardage,
    s.score,
    s.putts,
    s.fairway,
    s.gir,
    s.penalties,
    s.club,
    s.dist,
    s.notes,
    s.journal
  );
}

// Nassau bet: 2 units per nine, with a press on the back 9
const betInsert = db.prepare(
  "INSERT INTO bets (round_id, bet_type, unit_value, teams, status, settings) VALUES (?, ?, ?, ?, ?, ?)"
);
betInsert.run(
  roundId,
  "nassau",
  2,
  JSON.stringify({
    team1: { name: "Victor & Mike", players: [1] },
    team2: { name: "Dave & Tom", players: [] },
  }),
  "settled",
  JSON.stringify({
    auto_press: false,
    press_at: 2,
    max_presses: 3,
  })
);
const betId = 1;

// Bet results for each hole
const betResultInsert = db.prepare(
  "INSERT INTO bet_results (bet_id, hole_number, result, running_total) VALUES (?, ?, ?, ?)"
);

// Simulate match play results (team1 vs team2 best ball)
const team1Scores = scores.map((s) => s.score);
// Simulate team2 scores (opponents)
const team2Scores = [4, 5, 3, 4, 5, 5, 5, 3, 5, 4, 4, 5, 4, 5, 5, 3, 5, 5];

let frontRunning = 0; // positive = team1 up
let backRunning = 0;
let overallRunning = 0;

for (let i = 0; i < 18; i++) {
  const t1 = team1Scores[i];
  const t2 = team2Scores[i];
  const holeResult = t1 < t2 ? "team1" : t1 > t2 ? "team2" : "halved";

  if (i < 9) {
    frontRunning += t1 < t2 ? 1 : t1 > t2 ? -1 : 0;
  } else {
    backRunning += t1 < t2 ? 1 : t1 > t2 ? -1 : 0;
  }
  overallRunning += t1 < t2 ? 1 : t1 > t2 ? -1 : 0;

  betResultInsert.run(
    betId,
    i + 1,
    JSON.stringify({ winner: holeResult, team1Score: t1, team2Score: t2 }),
    JSON.stringify({
      front: frontRunning,
      back: i >= 9 ? backRunning : 0,
      overall: overallRunning,
    })
  );
}

// Press on back 9 (team2 pressing from hole 13)
const pressInsert = db.prepare(
  "INSERT INTO presses (bet_id, pressing_team, from_hole, bet_name, unit_value) VALUES (?, ?, ?, ?, ?)"
);
pressInsert.run(betId, "team2", 13, "Back 9 Press", 2);

// Club stats from the round
const clubStatsInsert = db.prepare(
  "INSERT OR REPLACE INTO club_stats (player_id, club, avg_distance, total_shots, miss_pattern) VALUES (?, ?, ?, ?, ?)"
);

const clubData: Record<string, { distances: number[]; misses: string[] }> = {};
for (const s of scores) {
  if (!clubData[s.club]) clubData[s.club] = { distances: [], misses: [] };
  clubData[s.club].distances.push(s.dist);
}

// Add Driver stats too
clubData["Driver"] = { distances: [255, 270, 245, 260, 280, 250, 265, 240, 270], misses: ["left", "right", "left"] };

for (const [club, data] of Object.entries(clubData)) {
  const avg = data.distances.reduce((a, b) => a + b, 0) / data.distances.length;
  clubStatsInsert.run(
    playerId,
    club,
    Math.round(avg),
    data.distances.length,
    JSON.stringify({ left: 3, right: 2, short: 1, long: 1 })
  );
}

console.log("Demo data seeded successfully!");
console.log("  - Player: Victor Wilson (15 handicap)");
console.log("  - Round: Torrey Pines North, 85 (+13)");
console.log("  - 18 holes with full shot data");
console.log("  - Nassau bet with back 9 press");
console.log("  - Club stats from round data");
