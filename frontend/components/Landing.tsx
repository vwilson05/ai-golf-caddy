import React, { useState } from "react";

interface Props {
  onTryDemo: () => void;
}

export default function Landing({ onTryDemo }: Props) {
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [demoText, setDemoText] = useState(
    "Hole 7, made a birdie with one putt. Had 145 in and hit an 8 iron, landed pin high. Our team won the hole."
  );
  const [demoParsed, setDemoParsed] = useState<any>(null);
  const [demoParsing, setDemoParsing] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing-hero" }),
      });
      setEmailSubmitted(true);
    } catch {}
  };

  const handleDemoParse = async () => {
    if (!demoText.trim()) return;
    setDemoParsing(true);
    setDemoParsed(null);
    try {
      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: demoText }),
      });
      const data = await res.json();
      setDemoParsed(data);
    } catch (e) {
      setDemoParsed({ error: "Failed to parse" });
    }
    setDemoParsing(false);
  };

  const painPoints = [
    {
      icon: "📱",
      text: "Fumbling with your phone on the tee box",
    },
    {
      icon: "💸",
      text: "Arguing about who owes what on 18",
    },
    {
      icon: "🤔",
      text: "Can't remember what you shot 3 weeks ago",
    },
    {
      icon: "🧢",
      text: 'Your buddy says he had a 4... you know it was a 5',
    },
  ];

  const features = [
    { icon: "🎙️", title: "Voice Scoring", desc: "Just talk. Say what happened — your caddy enters the score, putts, penalties, and journal notes. Works on your phone and Apple Watch." },
    { icon: "💰", title: "Bet Tracking", desc: "Nassau, skins, wolf, dots, presses — auto-calculated. End-of-round settlement with Venmo-ready amounts. No more mental math on 16." },
    { icon: "📓", title: "Shot Journal", desc: "\"Flushed the 6-iron pin high.\" Your round, your story. Searchable memories of every shot, every course, every round." },
    { icon: "📊", title: "Deep Stats + GHIN", desc: "Fairways, GIR, putts, club distances, miss patterns. Auto-post to GHIN for handicap tracking. Know your game like a tour pro." },
    { icon: "🗺️", title: "GPS Yardages", desc: "Front, middle, back — plus hazard carry distances. Clean numbers, no map clutter. Know exactly what club to hit." },
    { icon: "🤖", title: "AI Caddy That Learns", desc: "After a few rounds, your caddy knows YOUR game. \"You miss right from 150. Aim left center.\" Gets smarter every round you play." },
    { icon: "⌚", title: "iPhone + Apple Watch", desc: "Full iOS app with Apple Watch companion. Glanceable scorecard, tap-to-talk scoring, bet status on your wrist. Android coming soon." },
    { icon: "🌦️", title: "Weather + Conditions", desc: "Wind speed, direction, temperature, altitude — factored into club recommendations. \"It's playing 10 yards longer with this headwind.\"" },
    { icon: "❤️", title: "Apple Health", desc: "Sync your round to Apple Health — steps walked, distance covered, active calories burned. Your golf counts as exercise (finally)." },
    { icon: "👥", title: "Group Play & Tournaments", desc: "Live shared scorecard for your group. Tournament mode for outings, club championships, and charity events. Leaderboard in real-time." },
  ];

  const renderParsedResult = (data: any) => {
    if (!data) return null;
    if (data.error) return <div className="demo-error">{data.error}</div>;

    const p = data.parsed || {};
    const fields: { label: string; value: any }[] = [];

    if (p.hole) fields.push({ label: "Hole", value: p.hole });
    if (p.scoreName || p.score !== undefined) {
      const name = p.scoreName ? p.scoreName.charAt(0).toUpperCase() + p.scoreName.slice(1) : '';
      const num = p.score !== undefined ? `(${p.score})` : '';
      fields.push({ label: "Score", value: `${name} ${num}`.trim() });
    }
    if (p.putts !== undefined) fields.push({ label: "Putts", value: p.putts });
    if (p.club) fields.push({ label: "Club", value: p.club });
    if (p.distance) fields.push({ label: "Distance", value: `${p.distance} yards` });
    if (p.fairway !== undefined && p.fairway !== null) fields.push({ label: "Fairway", value: p.fairway ? "Hit" : `Missed${p.fairwayMiss ? ` ${p.fairwayMiss}` : ""}` });
    if (p.gir) fields.push({ label: "GIR", value: "Yes" });
    if (p.penalties) fields.push({ label: "Penalties", value: `${p.penalties} (${p.penaltyType || 'penalty'})` });
    if (p.journal) fields.push({ label: "Journal", value: p.journal });
    if (p.betUpdate) fields.push({ label: "Match", value: p.betUpdate });

    return (
      <div className="demo-result">
        <div className="demo-result-header">
          <span className="demo-source-badge">{data.source === "ai" ? "AI Parsed" : "Instant Parse"}</span>
          <span className="demo-confidence">Confidence: {Math.round((data.confidence || 0) * 100)}%</span>
        </div>
        <div className="demo-fields">
          {fields.map((f, i) => (
            <div key={i} className="demo-field">
              <span className="demo-field-label">{f.label}</span>
              <span className="demo-field-value">{String(f.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <span className="logo-icon">⛳</span>
            <span className="logo-text">Caddy</span>
          </div>
          <button className="btn btn-outline-light" onClick={onTryDemo}>
            Try the Demo
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Voice-First Golf Companion</div>
          <h1 className="hero-title">
            Just talk.<br />
            Your AI caddy handles the rest.
          </h1>
          <p className="hero-subtitle">
            Voice-powered scoring, betting, stats, and caddy advice.
            Because your hands should be on your club, not your phone.
          </p>
          <div className="hero-mic-animation">
            <div className="mic-circle">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <div className="mic-pulse"></div>
              <div className="mic-pulse mic-pulse-2"></div>
            </div>
          </div>
          {!emailSubmitted ? (
            <form className="hero-email-form" onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="Enter your email for early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hero-email-input"
              />
              <button type="submit" className="btn btn-gold">Get Early Access</button>
            </form>
          ) : (
            <div className="hero-email-success">You're on the list. We'll be in touch.</div>
          )}
          <button className="btn btn-primary hero-demo-btn" onClick={onTryDemo}>
            Try the Demo
          </button>
        </div>
      </section>

      {/* Live Demo */}
      <section className="section demo-section">
        <div className="section-inner">
          <h2 className="section-title">See it in action</h2>
          <p className="section-subtitle">Type any golf input and watch it parse in real-time</p>
          <div className="demo-box">
            <textarea
              className="demo-textarea"
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              rows={3}
              placeholder="Try: 'Hole 5, bogey, 2 putts, hit driver 260, had 170 in...'"
            />
            <button
              className="btn btn-primary demo-parse-btn"
              onClick={handleDemoParse}
              disabled={demoParsing}
            >
              {demoParsing ? "Parsing..." : "Parse Input"}
            </button>
            {demoParsed && renderParsedResult(demoParsed)}
          </div>
          <div className="demo-examples">
            <p className="demo-examples-label">Try these:</p>
            <div className="demo-example-chips">
              {[
                "Hole 1, bogey, 2 putts, missed the fairway right",
                "Made a par on 5, hit driver 280, had 120 in and hit PW to 15 feet",
                "Double bogey, 3 putt from 40 feet. Water off the tee, took a drop.",
                "Birdie! One putt from 8 feet. Team wins the hole, we're up 3.",
              ].map((ex, i) => (
                <button
                  key={i}
                  className="demo-chip"
                  onClick={() => { setDemoText(ex); setDemoParsed(null); }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="section pain-section">
        <div className="section-inner">
          <h2 className="section-title">Sound familiar?</h2>
          <div className="pain-cards">
            {painPoints.map((p, i) => (
              <div key={i} className="pain-card">
                <span className="pain-icon">{p.icon}</span>
                <p className="pain-text">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features-section">
        <div className="section-inner">
          <h2 className="section-title">Everything your round needs</h2>
          <div className="feature-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="section platform-section">
        <div className="section-inner">
          <h2 className="section-title">Available everywhere you play</h2>
          <p className="section-subtitle">One account. Every device. Every round.</p>
          <div className="platform-grid">
            <div className="platform-card">
              <span className="platform-icon">📱</span>
              <h3>iPhone App</h3>
              <p>Full-featured iOS app with voice input, GPS, scorecard, and bet tracking. Coming to the App Store.</p>
            </div>
            <div className="platform-card">
              <span className="platform-icon">⌚</span>
              <h3>Apple Watch</h3>
              <p>Glanceable scorecard, tap-to-talk scoring, bet status, and yardages — right on your wrist.</p>
            </div>
            <div className="platform-card">
              <span className="platform-icon">🤖</span>
              <h3>Android</h3>
              <p>Android app coming soon. Same features, same voice-first experience.</p>
              <span className="platform-coming-soon">Coming Soon</span>
            </div>
            <div className="platform-card">
              <span className="platform-icon">🌐</span>
              <h3>Web App</h3>
              <p>Review rounds, stats, and bet history from any browser. Plan your next round from your desk.</p>
            </div>
          </div>
          <div className="platform-integrations">
            <h3>Integrations</h3>
            <div className="integration-badges">
              <span className="integration-badge">GHIN Handicap</span>
              <span className="integration-badge">Apple Health</span>
              <span className="integration-badge">Apple Watch</span>
              <span className="integration-badge">Weather</span>
              <span className="integration-badge">GPS Course Data</span>
              <span className="integration-badge">Venmo / Zelle</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-section">
        <div className="section-inner">
          <h2 className="section-title">How it works</h2>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-number">1</div>
              <h3>Talk</h3>
              <p>Tell your caddy what happened. Natural language, any phrasing. "Birdie on 7, one putt, hit an 8 iron from 145."</p>
            </div>
            <div className="how-step">
              <div className="how-step-number">2</div>
              <h3>Track</h3>
              <p>Scorecard, bets, stats, and journal all update automatically. No fumbling, no menus, no tapping.</p>
            </div>
            <div className="how-step">
              <div className="how-step-number">3</div>
              <h3>Learn</h3>
              <p>After a few rounds, your caddy knows your game and gives real advice. "You miss right with your 7-iron — aim left center."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section pricing-section">
        <div className="section-inner">
          <h2 className="section-title">Simple pricing</h2>
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="pricing-tier">Free</div>
              <div className="pricing-price">$0</div>
              <ul className="pricing-features">
                <li>Voice scoring</li>
                <li>Basic scorecard</li>
                <li>Putts & penalties tracking</li>
                <li>Nassau betting</li>
                <li>Round history</li>
              </ul>
              <button className="btn btn-outline" onClick={onTryDemo}>Get Started</button>
            </div>
            <div className="pricing-card pricing-card-pro">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-tier">Pro</div>
              <div className="pricing-price">
                $9.99<span className="pricing-period">/mo</span>
              </div>
              <div className="pricing-annual">or $79/year (save 34%)</div>
              <ul className="pricing-features">
                <li>Everything in Free</li>
                <li>All bet formats (skins, wolf, dots, custom)</li>
                <li>30+ statistics + GHIN integration</li>
                <li>Shot journal with search</li>
                <li>AI caddy that learns your game</li>
                <li>GPS yardages (front/middle/back)</li>
                <li>Weather &amp; conditions in club recs</li>
                <li>Apple Watch app</li>
                <li>Apple Health sync</li>
                <li>Group &amp; tournament mode</li>
              </ul>
              {!emailSubmitted ? (
                <form onSubmit={handleEmailSubmit} className="pricing-email-form">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pricing-email-input"
                  />
                  <button type="submit" className="btn btn-gold">Join Waitlist</button>
                </form>
              ) : (
                <div className="hero-email-success">You're on the list!</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="section credibility-section">
        <div className="section-inner">
          <p className="credibility-text">
            Built by a golfer who was tired of losing track of presses on the back nine.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-logo">
            <span className="logo-icon">⛳</span>
            <span className="logo-text">Caddy</span>
          </div>
          <p className="footer-tagline">Voice-first golf scoring & betting</p>
          <p className="footer-copy">&copy; 2026 Caddy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
