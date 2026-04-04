import React, { useState, useEffect } from "react";

interface BetData {
  id: number;
  bet_type: string;
  unit_value: number;
  teams: string;
  status: string;
  settings: string;
  results: any[];
  presses: any[];
}

export default function Bets() {
  const [bets, setBets] = useState<BetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rounds/1/bets")
      .then((r) => r.json())
      .then((data) => {
        setBets(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading bets...</div>;
  if (bets.length === 0) return (
    <div className="bets-page">
      <h2 className="page-title">Bets</h2>
      <div className="empty-state">No active bets. Start a Nassau or skins game!</div>
    </div>
  );

  return (
    <div className="bets-page">
      <h2 className="page-title">Bets</h2>

      {bets.map((bet) => {
        const teams = JSON.parse(bet.teams);
        const settings = JSON.parse(bet.settings);
        const results = bet.results || [];
        const presses = bet.presses || [];
        const lastResult = results.length > 0 ? results[results.length - 1] : null;
        const runningTotal = lastResult ? JSON.parse(lastResult.running_total) : { front: 0, back: 0, overall: 0 };

        // Calculate front/back winners
        const front9Results = results.filter((r: any) => r.hole_number <= 9);
        const back9Results = results.filter((r: any) => r.hole_number > 9);
        const lastFront = front9Results.length > 0 ? JSON.parse(front9Results[front9Results.length - 1].running_total) : null;
        const lastBack = back9Results.length > 0 ? JSON.parse(back9Results[back9Results.length - 1].running_total) : null;

        const frontStatus = lastFront ? (lastFront.front > 0 ? `${teams.team1?.name} ${lastFront.front} UP` : lastFront.front < 0 ? `${teams.team2?.name} ${Math.abs(lastFront.front)} UP` : "ALL SQUARE") : "—";
        const backStatus = lastBack ? (lastBack.back > 0 ? `${teams.team1?.name} ${lastBack.back} UP` : lastBack.back < 0 ? `${teams.team2?.name} ${Math.abs(lastBack.back)} UP` : "ALL SQUARE") : "—";
        const overallStatus = runningTotal.overall > 0 ? `${teams.team1?.name} ${runningTotal.overall} UP` : runningTotal.overall < 0 ? `${teams.team2?.name} ${Math.abs(runningTotal.overall)} UP` : "ALL SQUARE";

        // Calculate settlement
        let totalOwed = 0;
        const unit = bet.unit_value;
        if (lastFront && lastFront.front !== 0) totalOwed += unit;
        if (lastBack && lastBack.back !== 0) totalOwed += unit;
        if (runningTotal.overall !== 0) totalOwed += unit;
        // Presses
        totalOwed += presses.length * unit;

        const winner = runningTotal.overall >= 0 ? teams.team1?.name : teams.team2?.name;
        const loser = runningTotal.overall >= 0 ? teams.team2?.name : teams.team1?.name;

        return (
          <div key={bet.id} className="bet-card">
            <div className="bet-card-header">
              <div className="bet-type-badge">{bet.bet_type.toUpperCase()}</div>
              <div className="bet-unit">${bet.unit_value}/unit</div>
              <div className={`bet-status-badge ${bet.status}`}>{bet.status}</div>
            </div>

            <div className="bet-teams">
              <div className="bet-team">
                <span className="team-name">{teams.team1?.name || "Team 1"}</span>
              </div>
              <span className="bet-vs">vs</span>
              <div className="bet-team">
                <span className="team-name">{teams.team2?.name || "Team 2"}</span>
              </div>
            </div>

            {/* Nassau breakdown */}
            {bet.bet_type === "nassau" && (
              <div className="nassau-breakdown">
                <div className="nassau-row">
                  <span className="nassau-label">Front 9</span>
                  <span className="nassau-status">{frontStatus}</span>
                  <span className="nassau-unit">${unit}</span>
                </div>
                <div className="nassau-row">
                  <span className="nassau-label">Back 9</span>
                  <span className="nassau-status">{backStatus}</span>
                  <span className="nassau-unit">${unit}</span>
                </div>
                <div className="nassau-row nassau-overall">
                  <span className="nassau-label">Overall</span>
                  <span className="nassau-status">{overallStatus}</span>
                  <span className="nassau-unit">${unit}</span>
                </div>
              </div>
            )}

            {/* Presses */}
            {presses.length > 0 && (
              <div className="presses-section">
                <h4 className="presses-title">Presses</h4>
                {presses.map((press: any) => (
                  <div key={press.id} className="press-row">
                    <span className="press-team">{press.pressing_team}</span>
                    <span className="press-detail">
                      {press.bet_name || "Press"} from hole {press.from_hole}
                    </span>
                    <span className="press-unit">${press.unit_value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Hole-by-hole results */}
            <div className="bet-results-section">
              <h4 className="bet-results-title">Hole-by-Hole</h4>
              <div className="bet-results-grid">
                {results.map((r: any) => {
                  const res = JSON.parse(r.result);
                  return (
                    <div key={r.hole_number} className={`bet-hole-result ${res.winner}`}>
                      <span className="bet-hole-num">{r.hole_number}</span>
                      <span className="bet-hole-scores">
                        {res.team1Score}-{res.team2Score}
                      </span>
                      <span className="bet-hole-winner">
                        {res.winner === "team1" ? "W" : res.winner === "team2" ? "L" : "T"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settlement */}
            {bet.status === "settled" && (
              <div className="bet-settlement">
                <div className="settlement-label">Settlement</div>
                <div className="settlement-amount">
                  {loser} owes {winner} <strong>${totalOwed}</strong>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
