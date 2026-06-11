import { useState, useRef, useEffect } from "react";
import Anthropic from "@anthropic-ai/sdk";
import Nav from "../components/Nav";
import { useWallet } from "../context/WalletContext";

/*
  /terminal — a premium "protocol terminal".

  Front-end mock only (no chain calls). Two-panel layout: a left session
  sidebar and a right console with a single input that accepts BOTH slash-style
  commands and natural-language questions. Styled dark + gold with JetBrains
  Mono. All styles are namespaced under `.eterm` so nothing leaks to/from the
  global index.css.
*/

const styles = `
.eterm-page {
  background: #0a0a0a;
  min-height: 100vh;
  color: #d8d2c8;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.eterm-shell { display: flex; height: calc(100vh - 68px); }

/* ── SIDEBAR ── */
.eterm-sidebar {
  width: 288px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
  background: #0c0c0c;
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  gap: 26px;
  overflow-y: auto;
}
.eterm-side-title {
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: #6b6560;
  font-weight: 600;
}
.eterm-side-group { display: flex; flex-direction: column; gap: 16px; }
.eterm-side-row { display: flex; flex-direction: column; gap: 5px; }
.eterm-side-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b6560;
}
.eterm-side-val { font-size: 13px; color: #d8d2c8; word-break: break-all; }
.eterm-side-val.gold { color: #c9a96e; }
.eterm-side-val.muted { color: #4a4542; }

.eterm-status { display: flex; align-items: center; gap: 9px; font-size: 13px; color: #3fb950; }
.eterm-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #3fb950; box-shadow: 0 0 8px rgba(63,185,80,0.7);
}

.eterm-beta-pill {
  margin-top: auto;
  border: 1px solid rgba(201,169,110,0.3);
  color: #c9a96e;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 9px 10px;
  text-align: center;
}

/* ── MAIN ── */
.eterm-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.eterm-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 12px; color: #6b6560; letter-spacing: 0.08em;
}
.eterm-topbar .gold { color: #c9a96e; }

.eterm-output {
  flex: 1;
  overflow-y: auto;
  padding: 26px 24px;
  font-size: 14px;
  line-height: 1.7;
}
.eterm-row { display: flex; margin-bottom: 16px; }
.eterm-row.user { justify-content: flex-end; }
.eterm-row.agent { justify-content: flex-start; }

/* user message: gold-bordered bubble on the right */
.eterm-bubble {
  max-width: 76%;
  border: 1px solid rgba(201,169,110,0.45);
  background: rgba(201,169,110,0.06);
  color: #f0ece4;
  padding: 10px 14px;
  border-radius: 12px 12px 2px 12px;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* terminal response: subtle left-aligned bubble */
.eterm-msg {
  max-width: 82%;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-left: 2px solid rgba(201,169,110,0.5);
  border-radius: 2px 12px 12px 12px;
  padding: 10px 14px;
}
.eterm-line { white-space: pre-wrap; word-break: break-word; }
.eterm-line.text { color: #d8d2c8; }
.eterm-line.gold { color: #c9a96e; }
.eterm-line.dim  { color: #6b6560; }

.eterm-cursor {
  display: inline-block;
  width: 7px;
  height: 1em;
  background: #c9a96e;
  margin-left: 4px;
  vertical-align: text-bottom;
  animation: eterm-blink 1s steps(1) infinite;
}
@keyframes eterm-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

.eterm-inputbar {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255,255,255,0.06);
  background: #0c0c0c;
}
.eterm-iprompt { color: #c9a96e; font-size: 15px; }
.eterm-input {
  flex: 1;
  background: transparent; border: none; outline: none;
  color: #ffffff;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 14px;
  caret-color: #c9a96e;
}
.eterm-input::placeholder { color: #4a4542; }
.eterm-send {
  background: #c9a96e; color: #0a0a0a; border: none;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 10px 20px; cursor: pointer; transition: background 0.2s;
}
.eterm-send:hover { background: #d4b87a; }
.eterm-send:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 820px) {
  .eterm-shell { flex-direction: column; height: auto; }
  .eterm-sidebar {
    width: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px 32px;
    align-items: flex-start;
  }
  .eterm-side-title { width: 100%; }
  .eterm-beta-pill { margin: 0; }
  .eterm-output { min-height: 52vh; }
}

@media (max-width: 480px) {
  .eterm-sidebar { padding: 18px 16px; gap: 16px 24px; }
  .eterm-topbar { padding: 12px 16px; font-size: 11px; }
  .eterm-output { padding: 18px 16px; font-size: 13px; }
  .eterm-bubble, .eterm-msg { max-width: 100%; }
  .eterm-inputbar { padding: 12px 16px; gap: 8px; }
  .eterm-send { padding: 10px 14px; }
  /* the mocked agent listings are space-padded ASCII — let them scroll
     instead of forcing the whole console wider than the screen */
  .eterm-line { overflow-x: auto; }
}
`;

const line = (text, tone = "text") => ({ text, tone });

// Total characters in a response (used to drive the typewriter).
const totalChars = (lines) => lines.reduce((n, l) => n + l.text.length, 0);

// Reveal the first `revealed` characters of a response, line by line.
function partial(lines, revealed) {
  const out = [];
  let rem = revealed;
  for (const l of lines) {
    if (rem >= l.text.length) {
      out.push(l);
      rem -= l.text.length;
    } else if (rem > 0) {
      out.push({ text: l.text.slice(0, rem), tone: l.tone });
      rem = 0;
      break;
    } else {
      break;
    }
  }
  return out;
}

const INITIAL = [
  line("ENGRAM TERMINAL", "gold"),
  line("Ask me anything about Engram, agents, Base, or crypto. Type 'clear' to reset.", "dim"),
];

const INITIAL_MESSAGES = [{ role: "agent", lines: INITIAL }];

// ── Anthropic (Claude) wiring ───────────────────────────────
// The terminal answers questions through the Claude API (Haiku for cost).
// NOTE: VITE_ env vars are inlined into the client bundle at build time, so
// VITE_ANTHROPIC_API_KEY ships to every visitor. Only safe for local/dev or a
// trusted-audience deploy — for a public site, proxy this through a backend.
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })
  : null;

const SYSTEM_PROMPT =
  "You are the Engram protocol terminal. Engram is a coordination protocol for autonomous agents on Base blockchain. Three primitives: GramID (on-chain agent identity), GramLink (agent-to-agent job settlement and communication), GramScore (reputation earned through work, slashed on failure). The token is $ENGRAM, CA: 0x86E980571b2321B8c6efcD0ea2414aB4A0eB8BA3, live on Base. Answer any questions about Engram, crypto, agents, or Base. Keep responses concise and technical. You are an AI agent, not a human.";

// Map the on-screen transcript to Anthropic message turns. The API requires the
// first message to be from the user, so drop any leading assistant turns
// (e.g. the initial ENGRAM TERMINAL banner).
function toApiMessages(msgs) {
  const out = [];
  for (const m of msgs) {
    if (m.role === "user") out.push({ role: "user", content: m.text });
    else out.push({ role: "assistant", content: m.lines.map((l) => l.text).join("\n") });
  }
  while (out.length && out[0].role === "assistant") out.shift();
  return out;
}

// Split Claude's text reply into tone-tagged lines for the typewriter renderer.
function textToLines(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return [line("(no response)", "dim")];
  return trimmed.split("\n").map((t) => line(t));
}

async function askClaude(apiMessages) {
  if (!anthropic) throw new Error("not-configured");
  const resp = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: apiMessages,
  });
  return resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function errorLines(err) {
  if (err && err.message === "not-configured") {
    return [
      line("Terminal AI is not configured.", "gold"),
      line("Set VITE_ANTHROPIC_API_KEY and rebuild to enable live responses.", "dim"),
    ];
  }
  const detail = err?.error?.error?.message || err?.message || "unknown error";
  return [
    line("Couldn't reach the model.", "gold"),
    line(`  ${detail}`, "dim"),
  ];
}

function truncate(addr) {
  return addr && addr.startsWith("0x") && addr.length > 12
    ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
    : addr;
}

export default function Terminal() {
  const { account } = useWallet();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [value, setValue] = useState("");
  const [session] = useState({ wallet: null, agentId: "ENGRAM", score: "1,247", jobs: 8 });
  // in-flight agent reply: { lines, phase: "thinking" | "typing", revealed, step }
  const [pending, setPending] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // keep the view pinned to the latest line as the reply streams in
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  // "thinking" persists while Claude responds; the typewriter runs once the
  // reply arrives and `phase` flips to "typing".
  useEffect(() => {
    if (!pending || pending.phase !== "typing" || !pending.lines) return undefined;
    const total = totalChars(pending.lines);
    if (pending.revealed >= total) {
      const finished = pending.lines;
      setMessages((m) => [...m, { role: "agent", lines: finished }]);
      setPending(null);
      return undefined;
    }
    const t = setTimeout(() => {
      setPending((p) =>
        p && p.phase === "typing"
          ? { ...p, revealed: Math.min(total, p.revealed + p.step) }
          : p
      );
    }, 12);
    return () => clearTimeout(t);
  }, [pending]);

  const submit = async (e) => {
    e.preventDefault();
    const raw = value.trim();
    if (!raw || pending) return;
    setValue("");

    if (raw.toLowerCase() === "clear") {
      setMessages(INITIAL_MESSAGES);
      return;
    }

    // Build the API history from the transcript so far, then add this turn.
    const apiHistory = toApiMessages(messages);
    setMessages((m) => [...m, { role: "user", text: raw }]);
    setPending({ phase: "thinking", lines: null, revealed: 0, step: 1 });

    let lines;
    try {
      const text = await askClaude([...apiHistory, { role: "user", content: raw }]);
      lines = textToLines(text);
    } catch (err) {
      lines = errorLines(err);
    }
    const total = totalChars(lines);
    const step = Math.max(1, Math.ceil(total / 240)); // cap the typewriter at ~3s
    setPending({ phase: "typing", lines, revealed: 0, step });
  };

  const typed = pending && pending.phase === "typing" ? partial(pending.lines, pending.revealed) : null;

  const walletDisplay = account ? truncate(account) : session.wallet || "Not connected";
  const walletConnected = Boolean(account || session.wallet);

  return (
    <div className="eterm-page">
      <style>{styles}</style>
      <Nav />

      <div className="eterm-shell">
        {/* ── SESSION SIDEBAR ── */}
        <aside className="eterm-sidebar">
          <div className="eterm-side-title">Session</div>

          <div className="eterm-side-group">
            <div className="eterm-side-row">
              <span className="eterm-side-label">Status</span>
              <span className="eterm-status"><span className="eterm-dot" />ACTIVE</span>
            </div>
            <div className="eterm-side-row">
              <span className="eterm-side-label">Network</span>
              <span className="eterm-side-val gold">Base</span>
            </div>
            <div className="eterm-side-row">
              <span className="eterm-side-label">Wallet</span>
              <span className={`eterm-side-val ${walletConnected ? "gold" : "muted"}`}>{walletDisplay}</span>
            </div>
            <div className="eterm-side-row">
              <span className="eterm-side-label">Agent ID</span>
              <span className={`eterm-side-val ${session.agentId ? "gold" : "muted"}`}>{session.agentId || "—"}</span>
            </div>
            <div className="eterm-side-row">
              <span className="eterm-side-label">GramScore</span>
              <span className={`eterm-side-val ${session.score != null ? "gold" : "muted"}`}>{session.score != null ? session.score : "—"}</span>
            </div>
            <div className="eterm-side-row">
              <span className="eterm-side-label">Jobs</span>
              <span className={`eterm-side-val ${session.jobs != null ? "gold" : "muted"}`}>{session.jobs != null ? session.jobs : "—"}</span>
            </div>
          </div>

          <div className="eterm-beta-pill">Beta · Base</div>
        </aside>

        {/* ── CONSOLE ── */}
        <main className="eterm-main">
          <div className="eterm-topbar">
            <span><span className="gold">engram</span> · terminal</span>
            <span>{walletConnected ? "session active" : "not connected"}</span>
          </div>

          <div className="eterm-output" onClick={() => inputRef.current?.focus()}>
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="eterm-row user">
                  <div className="eterm-bubble">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="eterm-row agent">
                  <div className="eterm-msg">
                    {m.lines.map((l, j) => (
                      <div key={j} className={`eterm-line ${l.tone}`}>{l.text}</div>
                    ))}
                  </div>
                </div>
              )
            )}

            {pending && (
              <div className="eterm-row agent">
                <div className="eterm-msg">
                  {pending.phase === "thinking" ? (
                    <div className="eterm-line dim">Engram is thinking<span className="eterm-cursor" /></div>
                  ) : typed && typed.length ? (
                    typed.map((l, j) => (
                      <div key={j} className={`eterm-line ${l.tone}`}>
                        {l.text}
                        {j === typed.length - 1 && <span className="eterm-cursor" />}
                      </div>
                    ))
                  ) : (
                    <div className="eterm-line"><span className="eterm-cursor" /></div>
                  )}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form className="eterm-inputbar" onSubmit={submit}>
            <span className="eterm-iprompt">❯</span>
            <input
              ref={inputRef}
              className="eterm-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={pending ? "Engram is responding…" : "Type a command or ask a question…"}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              aria-label="terminal input"
              disabled={!!pending}
            />
            <button type="submit" className="eterm-send" disabled={!!pending}>Send</button>
          </form>
        </main>
      </div>
    </div>
  );
}
