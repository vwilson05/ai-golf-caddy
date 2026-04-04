import React, { useState, useEffect } from "react";

interface PlayerStats {
  player: any;
  rounds: number;
  totalHoles: number;
  avgScore: number;
  avgPutts: number;
  fairwayPct: number;
  girPct: number;
  threePuttRate: number;
  scoring: {
    eagles: number;
    birdies: number;
    pars: number;
    bogeys: number;
    doubles: number;
    others: number;
  };
  clubStats: any[];
  recentRounds: any[];
}

export default function Stats() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/1")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading stats...</div>;
  if (!stats) return <div className="empty-state">No stats available yet.</div>;

  const totalScoring =
    stats.scoring.eagles +
    stats.scoring.birdies +
    stats.scoring.pars +
    stats.scoring.bogeys +
    stats.scoring.doubles +
    stats.scoring.others;

  const scoringPct = (val: number) =>
    totalScoring > 0 ? Math.round((val / totalScoring) * 100) : 0;

  return (
    <div className="stats-page">
      <h2 className="page-title">Statistics</h2>
      <p className="page-subtitle">{stats.player.name} | {stats.player.handicap} handicap</p>

      {/* Overview cards */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-value">{stats.avgScore}</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgPutts}</div>
          <div className="stat-label">Avg Putts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.fairwayPct}%</div>
          <div className="stat-label">Fairways</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.girPct}%</div>
          <div className="stat-label">GIR</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.rounds}</div>
          <div className="stat-label">Rounds</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.threePuttRate}%</div>
          <div className="stat-label">3-Putt Rate</div>
        </div>
      </div>

      {/* Scoring Distribution */}
      <div className="stats-section">
        <h3 className="stats-section-title">Scoring Distribution</h3>
        <div className="scoring-dist">
          {[
            { label: "Eagles", value: stats.scoring.eagles, color: "#D4A843", cls: "eagle" },
            { label: "Birdies", value: stats.scoring.birdies, color: "#2D6A4F", cls: "birdie" },
            { label: "Pars", value: stats.scoring.pars, color: "#1A1A1A", cls: "par" },
            { label: "Bogeys", value: stats.scoring.bogeys, color: "#E07A5F", cls: "bogey" },
            { label: "Doubles+", value: stats.scoring.doubles + stats.scoring.others, color: "#C1121F", cls: "double" },
          ].map((item) => (
            <div key={item.label} className="scoring-dist-row">
              <span className="scoring-dist-label">{item.label}</span>
              <div className="scoring-dist-bar-bg">
                <div
                  className={`scoring-dist-bar scoring-bar-${item.cls}`}
                  style={{ width: `${scoringPct(item.value)}%` }}
                />
              </div>
              <span className="scoring-dist-count">{item.value}</span>
              <span className="scoring-dist-pct">{scoringPct(item.value)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Club Distances */}
      <div className="stats-section">
        <h3 className="stats-section-title">Club Distances</h3>
        <div className="club-table">
          <div className="club-table-header">
            <span className="club-col-name">Club</span>
            <span className="club-col-dist">Avg Distance</span>
            <span className="club-col-shots">Shots</span>
          </div>
          {stats.clubStats.map((club: any) => (
            <div key={club.club} className="club-table-row">
              <span className="club-col-name">{club.club}</span>
              <span className="club-col-dist">{club.avg_distance} yds</span>
              <span className="club-col-shots">{club.total_shots}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Rounds */}
      <div className="stats-section">
        <h3 className="stats-section-title">Recent Rounds</h3>
        <div className="recent-rounds">
          {stats.recentRounds.map((round: any) => (
            <div key={round.id} className="recent-round-card">
              <div className="recent-round-course">{round.course_name}</div>
              <div className="recent-round-meta">
                <span>{round.date}</span>
                <span className="recent-round-score">{round.total_score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
