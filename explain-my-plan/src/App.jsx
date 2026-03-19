import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are a structured thinking assistant. When a user gives you a raw idea or plan, analyze it and return ONLY a valid JSON object (no markdown, no code fences, no extra text) with this exact structure:

{
  "goal": "A clearly stated goal extracted from the input",
  "method": "The approach or method described or implied",
  "steps": ["step 1", "step 2", "step 3"],
  "timeline": "Timeline mentioned, or 'Not specified'",
  "missingElements": {
    "goalClarity": "feedback on goal clarity or null if fine",
    "executionSteps": "feedback on steps or null if fine",
    "resources": "feedback on resources or null if fine",
    "timeline": "feedback on timeline or null if fine"
  },
  "simplifiedVersion": "A single clear sentence summarizing the plan",
  "actionableSteps": ["actionable step 1", "actionable step 2", "actionable step 3", "actionable step 4"],
  "clarityScore": 72,
  "clarityBreakdown": {
    "goalDefined": 25,
    "stepsDefined": 20,
    "timelinePresent": 15,
    "completeness": 12
  },
  "clarityExplanation": "Brief explanation of the score"
}

Scoring rules (max 100):
- goalDefined: 0-30 (is the goal specific and clear?)
- stepsDefined: 0-30 (are steps defined or implied?)
- timelinePresent: 0-20 (is a timeline given?)
- completeness: 0-20 (how complete is the overall plan?)

Be honest, practical, and constructive. Always return valid JSON only.`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f; --surface: #111118; --surface2: #18181f;
    --border: rgba(255,255,255,0.07); --accent: #c8f55a;
    --accent2: #7c5cfc; --accent3: #ff6b6b;
    --text: #eeeef2; --muted: #6b6b7e; --card-radius: 16px;
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; line-height: 1.6; }
  .app { max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }
  .header { margin-bottom: 52px; }
  .header-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
  .header h1 { font-family: 'Syne', sans-serif; font-size: clamp(36px, 6vw, 58px); font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; }
  .header h1 span { color: var(--accent); }
  .header-desc { color: var(--muted); font-size: 15px; margin-top: 16px; max-width: 480px; font-weight: 300; }
  .input-section { margin-bottom: 36px; }
  .input-label { font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; display: block; }
  .input-wrap { position: relative; }
  textarea { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; line-height: 1.7; padding: 20px 24px; resize: none; outline: none; min-height: 130px; transition: border-color 0.2s; }
  textarea::placeholder { color: var(--muted); }
  textarea:focus { border-color: rgba(200,245,90,0.3); }
  .char-count { position: absolute; bottom: 14px; right: 18px; font-size: 11px; color: var(--muted); }
  .analyze-btn { margin-top: 14px; background: var(--accent); color: #0a0a0f; border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 0.03em; padding: 14px 32px; cursor: pointer; transition: opacity 0.2s, transform 0.15s; display: inline-flex; align-items: center; gap: 8px; }
  .analyze-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .analyze-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .spinner { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.3); border-top-color: #0a0a0f; border-radius: 50%; animation: spin 0.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-box { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2); border-radius: 10px; padding: 14px 18px; color: var(--accent3); font-size: 14px; margin-top: 12px; }
  .results { display: flex; flex-direction: column; gap: 16px; animation: fadeUp 0.5s ease; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .results-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .score-badge { background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; padding: 8px 20px; display: flex; align-items: center; gap: 12px; }
  .score-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; line-height: 1; }
  .score-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .score-bar-track { height: 3px; background: var(--surface); border-radius: 2px; overflow: hidden; margin-top: 5px; width: 70px; }
  .score-bar-fill { height: 100%; border-radius: 2px; transition: width 1.2s ease; }
  .simplified-card { background: linear-gradient(135deg, rgba(200,245,90,0.06) 0%, rgba(124,92,252,0.06) 100%); border: 1px solid rgba(200,245,90,0.15); border-radius: var(--card-radius); padding: 24px 28px; }
  .simplified-text { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 600; color: var(--text); line-height: 1.5; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius); padding: 22px 26px; }
  .card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .card-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .card-dot.purple { background: var(--accent2); }
  .card-dot.red { background: var(--accent3); }
  .goal-text { font-size: 15px; font-weight: 400; color: var(--text); line-height: 1.65; }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 600px) { .row-2 { grid-template-columns: 1fr; } }
  .list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .list li { display: flex; gap: 10px; font-size: 14px; font-weight: 300; color: var(--text); line-height: 1.5; }
  .list-num { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; color: var(--accent); min-width: 20px; padding-top: 2px; }
  .list-num.purple { color: var(--accent2); }
  .timeline-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; font-size: 14px; font-weight: 400; color: var(--text); }
  .divider { border: none; border-top: 1px solid var(--border); margin: 14px 0; }
  .missing-grid { display: flex; flex-direction: column; gap: 8px; }
  .missing-item { padding: 12px 16px; background: var(--surface2); border-radius: 10px; border-left: 3px solid var(--accent3); }
  .missing-item.ok { border-left-color: var(--accent); opacity: 0.55; }
  .missing-key { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .missing-val { font-size: 13px; font-weight: 300; color: var(--text); }
  .score-breakdown { display: flex; flex-direction: column; gap: 10px; }
  .breakdown-row { display: flex; align-items: center; gap: 12px; }
  .breakdown-label { color: var(--muted); font-size: 12px; font-weight: 300; min-width: 120px; }
  .breakdown-track { flex: 1; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
  .breakdown-fill { height: 100%; background: var(--accent2); border-radius: 2px; transition: width 1.2s ease; }
  .breakdown-val { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: var(--text); min-width: 36px; text-align: right; }
  .explanation { margin-top: 14px; font-size: 13px; color: var(--muted); font-weight: 300; border-top: 1px solid var(--border); padding-top: 12px; line-height: 1.65; }
  .reset-btn { background: none; border: 1px solid var(--border); border-radius: 8px; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 9px 20px; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
  .reset-btn:hover { border-color: var(--accent); color: var(--accent); }
`;

function scoreColor(s) {
  if (s >= 75) return "#c8f55a";
  if (s >= 45) return "#ffc870";
  return "#ff6b6b";
}

const MAX = { goalDefined: 30, stepsDefined: 30, timelinePresent: 20, completeness: 20 };
const LABELS = { goalDefined: "Goal Defined", stepsDefined: "Steps Defined", timelinePresent: "Timeline", completeness: "Completeness" };

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const ref = useRef(null);

  const analyze = async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      
      setResult(data);
    } catch (e) {
      console.error("Analysis error:", e);
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && ref.current) setTimeout(() => ref.current.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [result]);

  const color = result ? scoreColor(result.clarityScore) : "#c8f55a";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="header-eyebrow">AI Clarity Tool</div>
          <h1>Explain My <span>Plan.</span></h1>
          <p className="header-desc">Turn vague ideas into structured, actionable plans. Paste your raw thoughts below.</p>
        </header>

        <div className="input-section">
          <label className="input-label">Your Idea or Plan</label>
          <div className="input-wrap">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`e.g. "I want to start a YouTube channel and earn money quickly"`}
              maxLength={1200}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze(); }}
            />
            <span className="char-count">{input.length}/1200</span>
          </div>
          <button className="analyze-btn" onClick={analyze} disabled={loading || !input.trim()}>
            {loading ? <><span className="spinner" />Analyzing…</> : "Analyze Plan →"}
          </button>
          {error && <div className="error-box">{error}</div>}
        </div>

        {result && (
          <div className="results" ref={ref}>
            <div className="results-header">
              <span className="results-title">Analysis</span>
              <div className="score-badge">
                <div>
                  <div className="score-num" style={{ color }}>{result.clarityScore}</div>
                  <div className="score-label">Clarity Score</div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${result.clarityScore}%`, background: color }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="simplified-card">
              <div className="card-title"><span className="card-dot" />Simplified Version</div>
              <div className="simplified-text">{result.simplifiedVersion}</div>
            </div>

            <div className="row-2">
              <div className="card">
                <div className="card-title"><span className="card-dot purple" />Goal</div>
                <div className="goal-text">{result.goal}</div>
                <hr className="divider" />
                <div className="card-title" style={{ marginBottom: 6 }}><span className="card-dot" />Method</div>
                <div className="goal-text" style={{ fontSize: 14, fontWeight: 300 }}>{result.method}</div>
              </div>
              <div className="card">
                <div className="card-title"><span className="card-dot" />Timeline</div>
                <div className="timeline-chip">🕐 {result.timeline}</div>
                <hr className="divider" />
                <div className="card-title" style={{ marginBottom: 6 }}><span className="card-dot purple" />Identified Steps</div>
                {result.steps?.length ? (
                  <ul className="list">
                    {result.steps.map((s, i) => <li key={i}><span className="list-num">{i + 1}.</span>{s}</li>)}
                  </ul>
                ) : <div style={{ color: "var(--muted)", fontSize: 13 }}>No clear steps identified.</div>}
              </div>
            </div>

            <div className="card">
              <div className="card-title"><span className="card-dot purple" />Actionable Next Steps</div>
              <ul className="list">
                {result.actionableSteps?.map((s, i) => (
                  <li key={i}><span className="list-num purple">{i + 1}.</span>{s}</li>
                ))}
              </ul>
            </div>

            <div className="row-2">
              <div className="card">
                <div className="card-title"><span className="card-dot red" />Missing Elements</div>
                <div className="missing-grid">
                  {Object.entries(result.missingElements || {}).map(([k, v]) => (
                    <div className={`missing-item ${!v ? "ok" : ""}`} key={k}>
                      <div className="missing-key">{k.replace(/([A-Z])/g, " $1").trim()}</div>
                      <div className="missing-val">{v || "✓ Looks good"}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title"><span className="card-dot" />Score Breakdown</div>
                <div className="score-breakdown">
                  {Object.entries(result.clarityBreakdown || {}).map(([k, v]) => (
                    <div className="breakdown-row" key={k}>
                      <span className="breakdown-label">{LABELS[k] || k}</span>
                      <div className="breakdown-track">
                        <div className="breakdown-fill" style={{ width: `${(v / (MAX[k] || 25)) * 100}%` }} />
                      </div>
                      <span className="breakdown-val">{v}/{MAX[k] || 25}</span>
                    </div>
                  ))}
                </div>
                {result.clarityExplanation && <div className="explanation">{result.clarityExplanation}</div>}
              </div>
            </div>

            <button className="reset-btn" onClick={() => { setResult(null); setInput(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              ↑ Analyze Another Plan
            </button>
          </div>
        )}
      </div>
    </>
  );
}