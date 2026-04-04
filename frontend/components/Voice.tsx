import React, { useState, useRef, useEffect } from "react";

interface ParsedResult {
  source: string;
  confidence: number;
  parsed: any;
  aiError?: string;
}

export default function Voice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [addedToScorecard, setAddedToScorecard] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(final || interim);
        if (final) {
          setTextInput(final);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-parse when voice stops and we have text
  const prevListening = useRef(false);
  useEffect(() => {
    if (prevListening.current && !isListening && textInput.trim()) {
      handleParse(textInput);
    }
    prevListening.current = isListening;
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setParsedResult(null);
      setAddedToScorecard(false);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleParse = async (text?: string) => {
    const input = text || textInput;
    if (!input.trim()) return;
    setIsParsing(true);
    setParsedResult(null);
    setAddedToScorecard(false);

    try {
      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      setParsedResult(data);
    } catch {
      setParsedResult({ source: "error", confidence: 0, parsed: {}, aiError: "Network error" });
    }
    setIsParsing(false);
  };

  const handleAddToScorecard = async () => {
    if (!parsedResult?.parsed) return;
    const p = parsedResult.parsed;
    try {
      await fetch("/api/rounds/1/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: 1,
          hole_number: p.hole || 1,
          par: p.par || 4,
          score: p.score,
          putts: p.putts,
          fairway_hit: p.fairway === true,
          gir: p.gir === true,
          penalties: p.penalties || 0,
          club_used: p.club,
          distance_to_pin: p.distance,
          shot_notes: p.journal || p.betUpdate || "",
          journal: p.journal || "",
        }),
      });
      setAddedToScorecard(true);
    } catch {}
  };

  const examplePhrases = [
    "Hole 1, bogey, 2 putts, missed the fairway right",
    "Made a par on 5, hit driver 280, had 120 in and hit PW to 15 feet",
    "Double bogey, 3 putt from 40 feet. Water off the tee, took a drop.",
    "Birdie! One putt from 8 feet. Team wins the hole, we're up 3.",
    "Back 9, they're pressing for 2 units",
  ];

  const renderParsed = (data: ParsedResult) => {
    const p = data.parsed || {};
    const fields: { label: string; value: string }[] = [];

    if (p.hole) fields.push({ label: "Hole", value: String(p.hole) });
    if (p.scoreName || p.score !== undefined) {
      const name = p.scoreName
        ? p.scoreName.charAt(0).toUpperCase() + p.scoreName.slice(1)
        : "";
      const num = p.score !== undefined ? `(${p.score})` : "";
      fields.push({ label: "Score", value: `${name} ${num}`.trim() });
    }
    if (p.putts !== undefined) fields.push({ label: "Putts", value: String(p.putts) });
    if (p.club) fields.push({ label: "Club", value: p.club });
    if (p.distance) fields.push({ label: "Distance", value: `${p.distance} yds` });
    if (p.fairway !== undefined && p.fairway !== null)
      fields.push({
        label: "Fairway",
        value: p.fairway ? "Hit" : `Missed${p.fairwayMiss ? ` ${p.fairwayMiss}` : ""}`,
      });
    if (p.gir) fields.push({ label: "GIR", value: "Yes" });
    if (p.penalties)
      fields.push({ label: "Penalties", value: `${p.penalties} (${p.penaltyType || "penalty"})` });
    if (p.journal) fields.push({ label: "Journal", value: p.journal });
    if (p.betUpdate) fields.push({ label: "Match", value: p.betUpdate });
    if (p.pressInfo) fields.push({ label: "Press", value: p.pressInfo });

    return (
      <div className="voice-result-card">
        <div className="voice-result-header">
          <span className={`source-badge ${data.source === "ai" ? "source-ai" : "source-parser"}`}>
            {data.source === "ai" ? "AI Parsed" : "Instant Parse"}
          </span>
          <span className="confidence-badge">
            {Math.round((data.confidence || 0) * 100)}% confidence
          </span>
        </div>
        <div className="voice-result-fields">
          {fields.map((f, i) => (
            <div key={i} className="voice-field">
              <span className="voice-field-label">{f.label}</span>
              <span className="voice-field-value">{f.value}</span>
            </div>
          ))}
        </div>
        {data.aiError && (
          <div className="voice-ai-note">AI unavailable, used local parser: {data.aiError}</div>
        )}
        {!addedToScorecard ? (
          <button className="btn btn-primary voice-add-btn" onClick={handleAddToScorecard}>
            Add to Scorecard
          </button>
        ) : (
          <div className="voice-added">Added to scorecard</div>
        )}
      </div>
    );
  };

  return (
    <div className="voice-page">
      <h2 className="page-title">Voice Input</h2>
      <p className="page-subtitle">Tell your caddy what happened</p>

      {/* Mic button */}
      <div className="voice-mic-area">
        {speechSupported ? (
          <button
            className={`voice-mic-btn ${isListening ? "listening" : ""}`}
            onClick={toggleListening}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            {isListening && (
              <>
                <div className="mic-pulse-ring"></div>
                <div className="mic-pulse-ring mic-pulse-ring-2"></div>
              </>
            )}
          </button>
        ) : (
          <div className="voice-no-speech">Voice not supported in this browser. Use text input below.</div>
        )}
        {isListening && <div className="voice-listening-text">Listening...</div>}
        {isParsing && <div className="voice-listening-text">Understanding...</div>}
      </div>

      {/* Parsed result — shown prominently */}
      {parsedResult && renderParsed(parsedResult)}

      {/* Raw transcript — small and muted */}
      {transcript && !isListening && (
        <div className="voice-raw-transcript">You said: "{transcript}"</div>
      )}

      {/* Text input fallback */}
      <div className="voice-text-area">
        <textarea
          className="voice-textarea"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder='Or type: "Hole 5, bogey, 2 putts, hit a 7 iron from 165..."'
          rows={3}
        />
        <button
          className="btn btn-primary voice-parse-btn"
          onClick={() => handleParse()}
          disabled={isParsing || !textInput.trim()}
        >
          {isParsing ? "Parsing..." : "Parse"}
        </button>
      </div>

      {/* Example phrases */}
      <div className="voice-examples">
        <h3 className="voice-examples-title">Try these phrases</h3>
        <div className="voice-example-list">
          {examplePhrases.map((phrase, i) => (
            <button
              key={i}
              className="voice-example-chip"
              onClick={() => {
                setTextInput(phrase);
                setParsedResult(null);
                setAddedToScorecard(false);
                handleParse(phrase);
              }}
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
