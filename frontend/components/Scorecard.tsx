import React, { useState, useEffect } from "react";

interface HoleScore {
  id: number;
  hole_number: number;
  par: number;
  yardage: number;
  score: number;
  putts: number;
  fairway_hit: number;
  gir: number;
  penalties: number;
  club_used: string;
  distance_to_pin: number;
  shot_notes: string;
  journal: string;
}

interface RoundData {
  round: {
    id: number;
    course_name: string;
    date: string;
    total_score: number;
    total_putts: number;
    fairways_hit: number;
    gir: number;
    format: string;
    tees: string;
    weather: string;
    notes: string;
  };
  holes: HoleScore[];
  bets: any[];
}

export default function Scorecard() {
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rounds/1")
      .then((r) => r.json())
      .then((data) => {
        setRoundData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading scorecard...</div>;
  if (!roundData || !roundData.round) return <div className="empty-state">No rounds yet. Start a new round!</div>;

  const { round, holes } = roundData;
  const front9 = holes.filter((h) => h.hole_number <= 9);
  const back9 = holes.filter((h) => h.hole_number > 9);

  const sum = (arr: HoleScore[], key: keyof HoleScore) =>
    arr.reduce((s, h) => s + ((h[key] as number) || 0), 0);
  const sumPar = (arr: HoleScore[]) => arr.reduce((s, h) => s + (h.par || 4), 0);

  const frontScore = sum(front9, "score");
  const backScore = sum(back9, "score");
  const frontPar = sumPar(front9);
  const backPar = sumPar(back9);
  const totalPar = frontPar + backPar;

  const scoreClass = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return "score-eagle";
    if (diff === -1) return "score-birdie";
    if (diff === 0) return "score-par";
    if (diff === 1) return "score-bogey";
    return "score-double";
  };

  const scoreName = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double";
    return `+${diff}`;
  };

  const selectedHoleData = selectedHole ? holes.find((h) => h.hole_number === selectedHole) : null;

  const vsPar = round.total_score - totalPar;
  const vsParStr = vsPar > 0 ? `+${vsPar}` : vsPar === 0 ? "E" : `${vsPar}`;

  return (
    <div className="scorecard-page">
      {/* Round header */}
      <div className="scorecard-header-card">
        <div className="scorecard-course">{round.course_name}</div>
        <div className="scorecard-meta">
          <span>{round.date}</span>
          <span className="meta-sep">|</span>
          <span>{round.tees} tees</span>
          <span className="meta-sep">|</span>
          <span>{round.format}</span>
        </div>
        {round.weather && <div className="scorecard-weather">{round.weather}</div>}
        <div className="scorecard-totals">
          <div className="total-box">
            <span className="total-label">Score</span>
            <span className="total-value">{round.total_score}</span>
            <span className="total-sub">{vsParStr}</span>
          </div>
          <div className="total-box">
            <span className="total-label">Putts</span>
            <span className="total-value">{round.total_putts}</span>
          </div>
          <div className="total-box">
            <span className="total-label">FW</span>
            <span className="total-value">{round.fairways_hit}/14</span>
          </div>
          <div className="total-box">
            <span className="total-label">GIR</span>
            <span className="total-value">{round.gir}/18</span>
          </div>
        </div>
      </div>

      {/* Scorecard grid */}
      <div className="scorecard-grid-wrapper">
        <div className="scorecard-label">Front 9</div>
        <div className="scorecard-grid">
          <div className="scorecard-row scorecard-row-header">
            <div className="sc-cell sc-label">Hole</div>
            {front9.map((h) => (
              <div key={h.hole_number} className="sc-cell">{h.hole_number}</div>
            ))}
            <div className="sc-cell sc-total">Out</div>
          </div>
          <div className="scorecard-row scorecard-row-par">
            <div className="sc-cell sc-label">Par</div>
            {front9.map((h) => (
              <div key={h.hole_number} className="sc-cell">{h.par}</div>
            ))}
            <div className="sc-cell sc-total">{frontPar}</div>
          </div>
          <div className="scorecard-row scorecard-row-yardage">
            <div className="sc-cell sc-label">Yds</div>
            {front9.map((h) => (
              <div key={h.hole_number} className="sc-cell sc-yardage">{h.yardage}</div>
            ))}
            <div className="sc-cell sc-total">{sum(front9, "yardage")}</div>
          </div>
          <div className="scorecard-row scorecard-row-score">
            <div className="sc-cell sc-label">Score</div>
            {front9.map((h) => (
              <div
                key={h.hole_number}
                className={`sc-cell sc-score ${scoreClass(h.score, h.par)}`}
                onClick={() => setSelectedHole(h.hole_number === selectedHole ? null : h.hole_number)}
              >
                {h.score}
              </div>
            ))}
            <div className="sc-cell sc-total">{frontScore}</div>
          </div>
          <div className="scorecard-row scorecard-row-putts">
            <div className="sc-cell sc-label">Putts</div>
            {front9.map((h) => (
              <div key={h.hole_number} className="sc-cell">{h.putts}</div>
            ))}
            <div className="sc-cell sc-total">{sum(front9, "putts")}</div>
          </div>
          <div className="scorecard-row scorecard-row-indicators">
            <div className="sc-cell sc-label">FW/GIR</div>
            {front9.map((h) => (
              <div key={h.hole_number} className="sc-cell sc-indicators">
                {h.par >= 4 && <span className={`indicator ${h.fairway_hit ? "indicator-hit" : "indicator-miss"}`}>F</span>}
                <span className={`indicator ${h.gir ? "indicator-hit" : "indicator-miss"}`}>G</span>
              </div>
            ))}
            <div className="sc-cell sc-total"></div>
          </div>
        </div>

        <div className="scorecard-label">Back 9</div>
        <div className="scorecard-grid">
          <div className="scorecard-row scorecard-row-header">
            <div className="sc-cell sc-label">Hole</div>
            {back9.map((h) => (
              <div key={h.hole_number} className="sc-cell">{h.hole_number}</div>
            ))}
            <div className="sc-cell sc-total">In</div>
          </div>
          <div className="scorecard-row scorecard-row-par">
            <div className="sc-cell sc-label">Par</div>
            {back9.map((h) => (
              <div key={h.hole_number} className="sc-cell">{h.par}</div>
            ))}
            <div className="sc-cell sc-total">{backPar}</div>
          </div>
          <div className="scorecard-row scorecard-row-yardage">
            <div className="sc-cell sc-label">Yds</div>
            {back9.map((h) => (
              <div key={h.hole_number} className="sc-cell sc-yardage">{h.yardage}</div>
            ))}
            <div className="sc-cell sc-total">{sum(back9, "yardage")}</div>
          </div>
          <div className="scorecard-row scorecard-row-score">
            <div className="sc-cell sc-label">Score</div>
            {back9.map((h) => (
              <div
                key={h.hole_number}
                className={`sc-cell sc-score ${scoreClass(h.score, h.par)}`}
                onClick={() => setSelectedHole(h.hole_number === selectedHole ? null : h.hole_number)}
              >
                {h.score}
              </div>
            ))}
            <div className="sc-cell sc-total">{backScore}</div>
          </div>
          <div className="scorecard-row scorecard-row-putts">
            <div className="sc-cell sc-label">Putts</div>
            {back9.map((h) => (
              <div key={h.hole_number} className="sc-cell">{h.putts}</div>
            ))}
            <div className="sc-cell sc-total">{sum(back9, "putts")}</div>
          </div>
          <div className="scorecard-row scorecard-row-indicators">
            <div className="sc-cell sc-label">FW/GIR</div>
            {back9.map((h) => (
              <div key={h.hole_number} className="sc-cell sc-indicators">
                {h.par >= 4 && <span className={`indicator ${h.fairway_hit ? "indicator-hit" : "indicator-miss"}`}>F</span>}
                <span className={`indicator ${h.gir ? "indicator-hit" : "indicator-miss"}`}>G</span>
              </div>
            ))}
            <div className="sc-cell sc-total"></div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="scorecard-grand-total">
          <span>Total: <strong>{round.total_score}</strong></span>
          <span className={`vs-par ${vsPar > 0 ? "over" : vsPar < 0 ? "under" : ""}`}>{vsParStr}</span>
        </div>
      </div>

      {/* Hole detail popup */}
      {selectedHoleData && (
        <div className="hole-detail-card">
          <div className="hole-detail-header">
            <h3>Hole {selectedHoleData.hole_number}</h3>
            <span className="hole-detail-par">Par {selectedHoleData.par} | {selectedHoleData.yardage} yds</span>
            <button className="hole-detail-close" onClick={() => setSelectedHole(null)}>x</button>
          </div>
          <div className="hole-detail-score">
            <span className={`score-badge ${scoreClass(selectedHoleData.score, selectedHoleData.par)}`}>
              {selectedHoleData.score} — {scoreName(selectedHoleData.score, selectedHoleData.par)}
            </span>
          </div>
          <div className="hole-detail-stats">
            <div className="hd-stat"><span className="hd-label">Putts</span><span>{selectedHoleData.putts}</span></div>
            {selectedHoleData.club_used && <div className="hd-stat"><span className="hd-label">Club</span><span>{selectedHoleData.club_used}</span></div>}
            {selectedHoleData.distance_to_pin > 0 && <div className="hd-stat"><span className="hd-label">Distance</span><span>{selectedHoleData.distance_to_pin} yds</span></div>}
            <div className="hd-stat"><span className="hd-label">Fairway</span><span>{selectedHoleData.fairway_hit ? "Hit" : "Missed"}</span></div>
            <div className="hd-stat"><span className="hd-label">GIR</span><span>{selectedHoleData.gir ? "Yes" : "No"}</span></div>
            {selectedHoleData.penalties > 0 && <div className="hd-stat"><span className="hd-label">Penalties</span><span>{selectedHoleData.penalties}</span></div>}
          </div>
          {selectedHoleData.journal && (
            <div className="hole-detail-journal">
              <span className="hd-label">Journal</span>
              <p>{selectedHoleData.journal}</p>
            </div>
          )}
          {selectedHoleData.shot_notes && (
            <div className="hole-detail-notes">
              <span className="hd-label">Notes</span>
              <p>{selectedHoleData.shot_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
