import db from "./db";
import { parseGolfInput as scriptParse, resolveScore } from "./parser";
import { parseGolfInput as aiParse, generateCaddyAdvice, generateRoundSummary, generateStatInsights } from "./ai";
import { join } from "path";

const PORT = parseInt(process.env.PORT || "3341");
const isDev = process.env.NODE_ENV !== "production";

// Auto-seed demo data if empty
const playerCount = db.query("SELECT COUNT(*) as count FROM players").get() as any;
if (playerCount.count === 0) {
  console.log("No data found, seeding demo data...");
  await import("./seed-demo");
}

// Build frontend with Bun bundler
async function buildFrontend() {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, "frontend/main.tsx")],
    outdir: join(import.meta.dir, "dist"),
    naming: "[name].[hash].[ext]",
    target: "browser",
    format: "esm",
    splitting: true,
    minify: !isDev,
    define: {
      "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
    },
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    throw new Error("Frontend build failed");
  }

  // Find the main output file
  const mainOutput = result.outputs.find(o => o.path.includes("main."));
  return mainOutput ? mainOutput.path.split("/").pop()! : "main.js";
}

let mainJsFile = await buildFrontend();

// Watch for changes in dev mode and rebuild
if (isDev) {
  // We'll rebuild on each request in dev mode (bun --hot handles server restarts)
  console.log("Dev mode: frontend will rebuild on server restart");
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getHtmlWithBundle(mainJs: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Hey Caddy — Voice-First Golf Scoring & Betting</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css?v=${Date.now()}" />
  <meta name="theme-color" content="#1B4332" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/dist/${mainJs}"></script>
</body>
</html>`;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Static files
    if (path === "/styles.css") {
      const file = Bun.file(join(import.meta.dir, "styles.css"));
      return new Response(file, { headers: { "Content-Type": "text/css", "Cache-Control": "no-cache, must-revalidate" } });
    }

    if (path.startsWith("/dist/")) {
      const filePath = join(import.meta.dir, path);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": "application/javascript" },
        });
      }
    }

    // API Routes
    // Voice parse
    if (path === "/api/voice/parse" && method === "POST") {
      try {
        const body = await req.json();
        const { text, roundContext } = body;
        if (!text) return json({ error: "text is required" }, 400);

        // First try script parser
        const scriptResult = scriptParse(text);

        if (scriptResult.confidence >= 0.7) {
          return json({
            source: "parser",
            confidence: scriptResult.confidence,
            parsed: scriptResult,
          });
        }

        // Fall back to Claude AI
        try {
          const aiResult = await aiParse(text, roundContext);
          return json({
            source: "ai",
            confidence: 0.95,
            parsed: aiResult,
          });
        } catch (aiErr: any) {
          // If AI fails, return what the script parser got
          return json({
            source: "parser",
            confidence: scriptResult.confidence,
            parsed: scriptResult,
            aiError: aiErr.message,
          });
        }
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // Player CRUD
    if (path === "/api/player" && method === "GET") {
      const players = db.query("SELECT * FROM players ORDER BY created_at DESC").all();
      return json(players);
    }

    if (path === "/api/player" && method === "POST") {
      const body = await req.json();
      const { name, handicap, email, phone } = body;
      const result = db.prepare(
        "INSERT INTO players (name, handicap, email, phone) VALUES (?, ?, ?, ?)"
      ).run(name, handicap || 0, email || null, phone || null);
      return json({ id: result.lastInsertRowid, name, handicap });
    }

    // Rounds
    if (path === "/api/rounds" && method === "POST") {
      const body = await req.json();
      const { player_id, course_name, course_id, date, tees, format, weather, notes } = body;
      const result = db.prepare(
        "INSERT INTO rounds (player_id, course_name, course_id, date, tees, format, weather, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(player_id, course_name, course_id || null, date, tees || "white", format || "stroke", weather || null, notes || null);
      return json({ id: result.lastInsertRowid });
    }

    if (path === "/api/rounds" && method === "GET") {
      const playerId = url.searchParams.get("player_id");
      let rounds;
      if (playerId) {
        rounds = db.query("SELECT * FROM rounds WHERE player_id = ? ORDER BY date DESC").all(parseInt(playerId));
      } else {
        rounds = db.query("SELECT * FROM rounds ORDER BY date DESC").all();
      }
      return json(rounds);
    }

    // Round by ID
    const roundMatch = path.match(/^\/api\/rounds\/(\d+)$/);
    if (roundMatch && method === "GET") {
      const roundId = parseInt(roundMatch[1]);
      const round = db.query("SELECT * FROM rounds WHERE id = ?").get(roundId);
      if (!round) return json({ error: "Round not found" }, 404);
      const holes = db.query(
        "SELECT * FROM hole_scores WHERE round_id = ? ORDER BY hole_number"
      ).all(roundId);
      const bets = db.query("SELECT * FROM bets WHERE round_id = ?").all(roundId);
      return json({ round, holes, bets });
    }

    // Add/update hole score
    const scoreMatch = path.match(/^\/api\/rounds\/(\d+)\/score$/);
    if (scoreMatch && method === "POST") {
      const roundId = parseInt(scoreMatch[1]);
      const body = await req.json();
      const {
        player_id, hole_number, par, yardage, score, putts,
        fairway_hit, gir, penalties, club_used, distance_to_pin,
        shot_notes, journal
      } = body;

      // Upsert
      db.prepare(`
        INSERT INTO hole_scores (round_id, player_id, hole_number, par, yardage, score, putts, fairway_hit, gir, penalties, club_used, distance_to_pin, shot_notes, journal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(round_id, player_id, hole_number) DO UPDATE SET
          par=excluded.par, yardage=excluded.yardage, score=excluded.score, putts=excluded.putts,
          fairway_hit=excluded.fairway_hit, gir=excluded.gir, penalties=excluded.penalties,
          club_used=excluded.club_used, distance_to_pin=excluded.distance_to_pin,
          shot_notes=excluded.shot_notes, journal=excluded.journal
      `).run(
        roundId, player_id || 1, hole_number, par || 4, yardage || null,
        score, putts || null, fairway_hit ? 1 : 0, gir ? 1 : 0,
        penalties || 0, club_used || null, distance_to_pin || null,
        shot_notes || null, journal || null
      );

      // Update round totals
      const totals = db.query(`
        SELECT
          SUM(score) as total_score,
          SUM(putts) as total_putts,
          SUM(fairway_hit) as fairways_hit,
          SUM(gir) as gir
        FROM hole_scores WHERE round_id = ?
      `).get(roundId) as any;

      if (totals) {
        db.prepare(
          "UPDATE rounds SET total_score=?, total_putts=?, fairways_hit=?, gir=? WHERE id=?"
        ).run(totals.total_score, totals.total_putts, totals.fairways_hit, totals.gir, roundId);
      }

      return json({ success: true });
    }

    // Create bet
    const betMatch = path.match(/^\/api\/rounds\/(\d+)\/bet$/);
    if (betMatch && method === "POST") {
      const roundId = parseInt(betMatch[1]);
      const body = await req.json();
      const { bet_type, unit_value, teams, settings } = body;
      const result = db.prepare(
        "INSERT INTO bets (round_id, bet_type, unit_value, teams, settings) VALUES (?, ?, ?, ?, ?)"
      ).run(roundId, bet_type, unit_value || 1, JSON.stringify(teams || {}), JSON.stringify(settings || {}));
      return json({ id: result.lastInsertRowid });
    }

    // Record press
    const pressMatch = path.match(/^\/api\/rounds\/(\d+)\/press$/);
    if (pressMatch && method === "POST") {
      const body = await req.json();
      const { bet_id, pressing_team, from_hole, bet_name, unit_value } = body;
      const result = db.prepare(
        "INSERT INTO presses (bet_id, pressing_team, from_hole, bet_name, unit_value) VALUES (?, ?, ?, ?, ?)"
      ).run(bet_id, pressing_team, from_hole, bet_name || null, unit_value || 1);
      return json({ id: result.lastInsertRowid });
    }

    // Get bets for round
    const betsMatch = path.match(/^\/api\/rounds\/(\d+)\/bets$/);
    if (betsMatch && method === "GET") {
      const roundId = parseInt(betsMatch[1]);
      const bets = db.query("SELECT * FROM bets WHERE round_id = ?").all(roundId);
      const results: any[] = [];
      for (const bet of bets as any[]) {
        const betResults = db.query(
          "SELECT * FROM bet_results WHERE bet_id = ? ORDER BY hole_number"
        ).all(bet.id);
        const presses = db.query(
          "SELECT * FROM presses WHERE bet_id = ?"
        ).all(bet.id);
        results.push({ ...bet, results: betResults, presses });
      }
      return json(results);
    }

    // Settle bets
    const settleMatch = path.match(/^\/api\/rounds\/(\d+)\/settle$/);
    if (settleMatch && method === "POST") {
      const roundId = parseInt(settleMatch[1]);
      db.prepare("UPDATE bets SET status = 'settled' WHERE round_id = ?").run(roundId);
      const bets = db.query("SELECT * FROM bets WHERE round_id = ?").all(roundId);
      return json({ settled: bets.length, bets });
    }

    // Player stats
    const statsMatch = path.match(/^\/api\/stats\/(\d+)$/);
    if (statsMatch && method === "GET") {
      const playerId = parseInt(statsMatch[1]);
      const player = db.query("SELECT * FROM players WHERE id = ?").get(playerId);
      if (!player) return json({ error: "Player not found" }, 404);

      const rounds = db.query("SELECT * FROM rounds WHERE player_id = ? ORDER BY date DESC").all(playerId);
      const allHoles = db.query(`
        SELECT hs.* FROM hole_scores hs
        JOIN rounds r ON hs.round_id = r.id
        WHERE hs.player_id = ?
        ORDER BY r.date DESC, hs.hole_number
      `).all(playerId) as any[];

      const clubStats = db.query("SELECT * FROM club_stats WHERE player_id = ? ORDER BY avg_distance DESC").all(playerId);

      // Compute stats
      const totalRounds = rounds.length;
      const totalHoles = allHoles.length;
      const avgScore = totalRounds > 0
        ? (rounds as any[]).reduce((sum, r) => sum + (r.total_score || 0), 0) / totalRounds
        : 0;
      const avgPutts = totalRounds > 0
        ? (rounds as any[]).reduce((sum, r) => sum + (r.total_putts || 0), 0) / totalRounds
        : 0;

      let birdies = 0, pars = 0, bogeys = 0, doubles = 0, others = 0, eagles = 0;
      let threePutts = 0;
      let fairwaysHit = 0, fairwayHoles = 0;
      let girCount = 0;

      for (const h of allHoles) {
        const diff = (h.score || 0) - (h.par || 4);
        if (diff <= -2) eagles++;
        else if (diff === -1) birdies++;
        else if (diff === 0) pars++;
        else if (diff === 1) bogeys++;
        else if (diff === 2) doubles++;
        else others++;

        if (h.putts >= 3) threePutts++;
        if (h.par >= 4) {
          fairwayHoles++;
          if (h.fairway_hit) fairwaysHit++;
        }
        if (h.gir) girCount++;
      }

      return json({
        player,
        rounds: totalRounds,
        totalHoles,
        avgScore: Math.round(avgScore * 10) / 10,
        avgPutts: Math.round(avgPutts * 10) / 10,
        fairwayPct: fairwayHoles > 0 ? Math.round((fairwaysHit / fairwayHoles) * 100) : 0,
        girPct: totalHoles > 0 ? Math.round((girCount / totalHoles) * 100) : 0,
        threePuttRate: totalHoles > 0 ? Math.round((threePutts / totalHoles) * 100) : 0,
        scoring: { eagles, birdies, pars, bogeys, doubles, others },
        clubStats,
        recentRounds: rounds.slice(0, 10),
      });
    }

    // Caddy advice
    if (path === "/api/caddy/advice" && method === "POST") {
      try {
        const body = await req.json();
        const advice = await generateCaddyAdvice(
          body.player, body.hole, body.stats, body.conditions
        );
        return json({ advice });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // Round summary
    const summaryMatch = path.match(/^\/api\/rounds\/(\d+)\/summary$/);
    if (summaryMatch && method === "POST") {
      try {
        const roundId = parseInt(summaryMatch[1]);
        const round = db.query("SELECT * FROM rounds WHERE id = ?").get(roundId);
        const holes = db.query("SELECT * FROM hole_scores WHERE round_id = ? ORDER BY hole_number").all(roundId);
        const bets = db.query("SELECT * FROM bets WHERE round_id = ?").all(roundId);
        const summary = await generateRoundSummary(round, holes, bets);
        return json({ summary });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // Email signup
    if (path === "/api/email-signup" && method === "POST") {
      try {
        const body = await req.json();
        const { email, source } = body;
        if (!email) return json({ error: "email required" }, 400);
        db.prepare(
          "INSERT OR IGNORE INTO email_signups (email, source) VALUES (?, ?)"
        ).run(email, source || "landing");
        return json({ success: true });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // SPA fallback — serve index.html for all non-API, non-static routes
    if (!path.startsWith("/api/") && !path.startsWith("/dist/") && path !== "/styles.css") {
      return new Response(getHtmlWithBundle(mainJsFile), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`
  Hey Caddy — AI Golf Caddy
  Web: http://localhost:${PORT}
  App: http://localhost:${PORT}/app
  ${isDev ? "[DEV] Dev mode" : "[PROD] Production mode"}
`);
