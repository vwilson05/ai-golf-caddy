import React, { useState, useEffect } from "react";
import Landing from "./Landing";
import Scorecard from "./Scorecard";
import Voice from "./Voice";
import Stats from "./Stats";
import Bets from "./Bets";
import Settings from "./Settings";

type Tab = "scorecard" | "voice" | "stats" | "bets" | "settings";

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState<Tab>("scorecard");

  useEffect(() => {
    const handlePop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  // Landing page
  if (route === "/" || route === "") {
    return <Landing onTryDemo={() => navigate("/app")} />;
  }

  // App pages
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "scorecard", label: "Scorecard", icon: "📋" },
    { id: "voice", label: "Voice", icon: "🎙️" },
    { id: "stats", label: "Stats", icon: "📊" },
    { id: "bets", label: "Bets", icon: "💰" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-inner">
          <button className="logo-btn" onClick={() => navigate("/")}>
            <span className="logo-icon">⛳</span>
            <span className="logo-text">Caddy</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeTab === "scorecard" && <Scorecard />}
        {activeTab === "voice" && <Voice />}
        {activeTab === "stats" && <Stats />}
        {activeTab === "bets" && <Bets />}
        {activeTab === "settings" && <Settings />}
      </main>

      <nav className="bottom-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
