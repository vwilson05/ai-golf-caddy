import React, { useState, useEffect } from "react";

export default function Settings() {
  const [player, setPlayer] = useState<any>(null);
  const [clubStats, setClubStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/player").then((r) => r.json()),
      fetch("/api/stats/1").then((r) => r.json()),
    ])
      .then(([players, stats]) => {
        if (players.length > 0) setPlayer(players[0]);
        if (stats.clubStats) setClubStats(stats.clubStats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    // In a real app, this would update the player
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="settings-page">
      <h2 className="page-title">Settings</h2>

      <div className="settings-section">
        <h3 className="settings-section-title">Player Profile</h3>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={player?.name || ""}
              onChange={(e) => setPlayer({ ...player, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Handicap</label>
            <input
              className="form-input"
              type="number"
              value={player?.handicap || ""}
              onChange={(e) => setPlayer({ ...player, handicap: parseFloat(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={player?.email || ""}
              onChange={(e) => setPlayer({ ...player, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              type="tel"
              value={player?.phone || ""}
              onChange={(e) => setPlayer({ ...player, phone: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? "Saved!" : "Save Profile"}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Default Preferences</h3>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">Preferred Tees</label>
            <select className="form-select">
              <option value="white">White</option>
              <option value="blue">Blue</option>
              <option value="black">Black</option>
              <option value="gold">Gold</option>
              <option value="red">Red</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Bet Type</label>
            <select className="form-select">
              <option value="nassau">Nassau</option>
              <option value="skins">Skins</option>
              <option value="wolf">Wolf</option>
              <option value="dots">Dots</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Unit ($)</label>
            <input className="form-input" type="number" defaultValue={2} min={1} />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">My Clubs</h3>
        <p className="settings-note">Auto-populated from your round data</p>
        <div className="club-bag">
          {clubStats.map((club: any) => (
            <div key={club.club} className="club-bag-item">
              <span className="club-bag-name">{club.club}</span>
              <span className="club-bag-dist">{club.avg_distance} yds avg</span>
              <span className="club-bag-shots">{club.total_shots} shots tracked</span>
            </div>
          ))}
          {clubStats.length === 0 && (
            <p className="settings-note">No club data yet. Play a round to see your distances.</p>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>
        <p className="settings-about">
          Caddy v1.0 — Voice-First Golf Scoring & Betting<br />
          Built by golfers, for golfers.
        </p>
      </div>
    </div>
  );
}
