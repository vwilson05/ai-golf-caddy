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
  const [demoListening, setDemoListening] = useState(false);
  const demoRecognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e: any) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        setDemoText(final || interim);
        if (final) setDemoParsed(null);
      };
      rec.onend = () => setDemoListening(false);
      rec.onerror = () => setDemoListening(false);
      demoRecognitionRef.current = rec;
    }
  }, []);

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
      icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>,
      text: "Fumbling with your phone on the tee box",
    },
    {
      icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      text: "Arguing about who owes what on 18",
    },
    {
      icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      text: "Can't remember what you shot 3 weeks ago",
    },
    {
      icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      text: 'Your buddy says he had a 4... you know it was a 5',
    },
  ];

  const featureIcons = {
    mic: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
    dollar: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15.5 9.5a2.5 2.5 0 0 0-2.5-2.5h-2a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5h-2.5a2.5 2.5 0 0 1-2.5-2.5"/></svg>,
    book: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="13" y2="11"/></svg>,
    chart: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    flag: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    brain: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4c0 1.1.45 2.1 1.17 2.83L12 12l2.83-3.17A4 4 0 0 0 16 6a4 4 0 0 0-4-4z"/><path d="M12 12v10"/><path d="M8 22h8"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><path d="M6 12c-2 0-3.5 1.5-3.5 3.5S4 19 6 19"/><path d="M18 12c2 0 3.5 1.5 3.5 3.5S20 19 18 19"/></svg>,
    devices: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="12" height="18" rx="2"/><line x1="8" y1="18" x2="8" y2="18.01"/><rect x="17" y="6" width="5" height="10" rx="1.5"/><line x1="19.5" y1="13" x2="19.5" y2="13.01"/></svg>,
    weather: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
    heart: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    group: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };

  const features = [
    { icon: featureIcons.mic, title: "Voice Scoring", desc: "Just talk. Say what happened — your caddy enters the score, putts, penalties, and journal notes. Works on your phone and Apple Watch." },
    { icon: featureIcons.dollar, title: "Bet Tracking", desc: "Nassau, skins, wolf, dots, presses — auto-calculated. End-of-round settlement with Venmo-ready amounts. No more mental math on 16." },
    { icon: featureIcons.book, title: "Shot Journal", desc: "\"Flushed the 6-iron pin high.\" Your round, your story. Searchable memories of every shot, every course, every round." },
    { icon: featureIcons.chart, title: "Deep Stats + GHIN", desc: "Fairways, GIR, putts, club distances, miss patterns. Auto-post to GHIN for handicap tracking. Know your game like a tour pro." },
    { icon: featureIcons.flag, title: "GPS Yardages", desc: "Front, middle, back — plus hazard carry distances. Clean numbers, no map clutter. Know exactly what club to hit." },
    { icon: featureIcons.brain, title: "AI Caddy That Learns", desc: "After a few rounds, your caddy knows YOUR game. \"You miss right from 150. Aim left center.\" Gets smarter every round you play." },
    { icon: featureIcons.devices, title: "iPhone + Apple Watch", desc: "Full iOS app with Apple Watch companion. Glanceable scorecard, tap-to-talk scoring, bet status on your wrist. Android coming soon." },
    { icon: featureIcons.weather, title: "Weather + Conditions", desc: "Wind speed, direction, temperature, altitude — factored into club recommendations. \"It's playing 10 yards longer with this headwind.\"" },
    { icon: featureIcons.heart, title: "Apple Health", desc: "Sync your round to Apple Health — steps walked, distance covered, active calories burned. Your golf counts as exercise (finally)." },
    { icon: featureIcons.group, title: "Group Play & Tournaments", desc: "Live shared scorecard for your group. Tournament mode for outings, club championships, and charity events. Leaderboard in real-time." },
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
    if (p.distance) fields.push({ label: "Approach", value: `${p.distance} yards` });
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

  const LogoIcon = () => (
    <svg className="logo-icon-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <span className="logo-icon"><LogoIcon /></span>
            <span className="logo-text">Hey Caddy</span>
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
          <p className="section-subtitle">Tap the mic and talk, or type — watch it parse in real-time</p>
          <div className="demo-box">
            <textarea
              className="demo-textarea"
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              rows={3}
              placeholder="Try: 'Hole 5, bogey, 2 putts, hit driver 260, had 170 in...'"
            />
            <div className="demo-actions">
              {demoRecognitionRef.current && (
                <button
                  className={`demo-mic-btn ${demoListening ? "demo-mic-listening" : ""}`}
                  onClick={() => {
                    if (demoListening) {
                      demoRecognitionRef.current.stop();
                    } else {
                      setDemoParsed(null);
                      demoRecognitionRef.current.start();
                      setDemoListening(true);
                    }
                  }}
                  title={demoListening ? "Stop listening" : "Tap to speak"}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                  </svg>
                  {demoListening ? "Listening..." : "Speak"}
                </button>
              )}
              <button
                className="btn btn-primary demo-parse-btn"
                onClick={handleDemoParse}
                disabled={demoParsing}
              >
                {demoParsing ? "Parsing..." : "Parse Input"}
              </button>
            </div>
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

      {/* On-Course Preview */}
      <section className="section preview-section">
        <div className="section-inner">
          <h2 className="section-title preview-title">What it looks like on the course</h2>
          <p className="section-subtitle preview-subtitle">Glanceable data on your phone and watch. Everything you need, nothing you don't.</p>
          <div className="preview-grid">
            {/* Phone Mockup */}
            <div className="phone-mockup">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="phone-hole-header">
                  <span className="phone-hole-label">HOLE 7</span>
                  <span className="phone-hole-meta">Par 4 &middot; 395 yds</span>
                </div>
                <div className="phone-divider"></div>

                <div className="phone-yardage">
                  <div className="phone-yardage-main">
                    <span className="phone-section-label">YOUR SHOT</span>
                    <span className="phone-yardage-number">146 <span className="phone-yardage-unit">yds to pin</span></span>
                  </div>
                  <div className="phone-yardage-detail">
                    Front 135 &middot; Middle 146 &middot; Back 157
                  </div>
                </div>

                <div className="phone-conditions">
                  <span className="phone-section-label">CONDITIONS</span>
                  <div className="phone-conditions-row">Wind: 8 mph helping, left to right</div>
                  <div className="phone-conditions-row">Temp: 72&deg;F &middot; Partly cloudy</div>
                </div>

                <div className="phone-caddy">
                  <span className="phone-section-label">CADDY ADVICE</span>
                  <p className="phone-caddy-text">
                    &ldquo;Your 8-iron averages 148 yards. With the helping wind, it&rsquo;s playing 140. Smooth 8-iron, aim 5 yards right of pin for the wind.&rdquo;
                  </p>
                </div>

                <div className="phone-scorecard">
                  <span className="phone-section-label">SCORECARD</span>
                  <div className="phone-scorecard-row">Thru 6 &middot; +2 (74 pace)</div>
                  <div className="phone-scorecard-row">Last hole: Par (2 putts)</div>
                </div>

                <div className="phone-bottom-bar">
                  <span className="phone-bar-btn phone-bar-btn-primary">Tap to talk</span>
                  <span className="phone-bar-btn">Scorecard</span>
                  <span className="phone-bar-btn phone-bar-btn-gold">Bets: +3 units</span>
                </div>
              </div>
            </div>

            {/* Watch Mockup */}
            <div className="watch-mockup">
              <div className="watch-crown"></div>
              <div className="watch-screen">
                <div className="watch-line-main">H7 &middot; 146 yds</div>
                <div className="watch-divider"></div>
                <div className="watch-line">8-iron &rarr; aim right</div>
                <div className="watch-line">Wind helping</div>
                <div className="watch-divider"></div>
                <div className="watch-line-small">+2 thru 6</div>
                <div className="watch-line-gold">Bets: +3</div>
              </div>
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
              <span className="platform-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg></span>
              <h3>iPhone App</h3>
              <p>Full-featured iOS app with voice input, GPS, scorecard, and bet tracking. Coming to the App Store.</p>
            </div>
            <div className="platform-card">
              <span className="platform-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="10" x2="12" y2="12"/><line x1="12" y1="12" x2="13.5" y2="13"/></svg></span>
              <h3>Apple Watch</h3>
              <p>Glanceable scorecard, tap-to-talk scoring, bet status, and yardages — right on your wrist.</p>
            </div>
            <div className="platform-card">
              <span className="platform-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><circle cx="9.5" cy="7" r="1" fill="currentColor"/><circle cx="14.5" cy="7" r="1" fill="currentColor"/><path d="M8 11c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5"/></svg></span>
              <h3>Android</h3>
              <p>Android app coming soon. Same features, same voice-first experience.</p>
              <span className="platform-coming-soon">Coming Soon</span>
            </div>
            <div className="platform-card">
              <span className="platform-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
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
            <span className="logo-icon"><LogoIcon /></span>
            <span className="logo-text">Hey Caddy</span>
          </div>
          <p className="footer-tagline">Voice-first golf scoring & betting</p>
          <p className="footer-copy">&copy; 2026 Hey Caddy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
