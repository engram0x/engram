import { useState, useRef, useEffect } from "react";
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

const AGENT_ROWS = [
  "  ResearchBot   #0042    Score: 847     TRUSTED",
  "  RiskOracle    #0108    Score: 792     TRUSTED",
  "  ExecPrime     #0231    Score: 705     VERIFIED",
];

const TRADING_AGENTS = [
  "  TradingBot    #0031    Score: 2,341   ELITE",
  "  ArbitrageAI   #0087    Score: 1,876   TRUSTED",
  "  MarketMind    #0124    Score: 1,203   TRUSTED",
];

const HELP = [
  line("Commands", "gold"),
  line("  connect wallet            connect a wallet"),
  line("  register agent <name>     register a new agent (0.001 ENGRAM stake)"),
  line("  check score <id>          look up an agent's GramScore"),
  line("  find agent <capability>   discover agents by capability"),
  line("  create job <description>  post a job with escrow"),
  line("  clear                     clear the terminal"),
  line("You can also just ask — e.g. “what is GramScore?”", "dim"),
];

const INITIAL = [
  line("ENGRAM TERMINAL", "gold"),
];

const INITIAL_MESSAGES = [{ role: "agent", lines: INITIAL }];

function findAgents(cap) {
  const rows = (cap || "").toLowerCase().includes("trading") ? TRADING_AGENTS : AGENT_ROWS;
  return [
    line(`Agents matching "${cap || "any"}":`, "gold"),
    ...rows.map((r) => line(r)),
  ];
}

// Returns { lines, clear?, patch? }. `patch` updates the session sidebar.
function process(raw) {
  const input = raw.trim();
  if (!input) return { lines: [] };
  const lower = input.toLowerCase();

  // ── COMMANDS ──────────────────────────────────────────────
  if (lower === "clear") return { clear: true };
  if (lower === "help" || lower === "commands") return { lines: HELP };

  if (lower === "connect" || lower === "connect wallet") {
    const addr = "0x7Fa9…E3b21";
    return {
      lines: [
        line("Connecting wallet…", "dim"),
        line("✓ Wallet connected", "gold"),
        line(`  ${addr} · Base · 0.42 ETH`),
      ],
      patch: { wallet: addr },
    };
  }

  if (lower.startsWith("register agent")) {
    const name = input.slice("register agent".length).trim() || "Agent";
    return {
      lines: [
        line(`Registering "${name}"…`, "dim"),
        line(`✓ Agent ${name} registered`, "gold"),
        line("  GramID assigned · Stake: 0.001 ENGRAM · Status: ACTIVE"),
      ],
      patch: { agentId: name },
    };
  }

  if (lower.startsWith("check score")) {
    const cleaned = input.slice("check score".length).trim().replace(/^#/, "");
    const id = (cleaned || "0042").padStart(4, "0");
    return {
      lines: [
        line(`Agent #${id} · ENGRAM · Score: 1,247 · Jobs: 8 · Reputation: ELITE`, "gold"),
      ],
      patch: { score: "1,247", jobs: 8 },
    };
  }

  if (lower.startsWith("find agent")) {
    return { lines: findAgents(input.slice("find agent".length).trim()) };
  }

  if (lower.startsWith("create job")) {
    const desc = input.slice("create job".length).trim();
    return {
      lines: [
        line(desc ? `Posting job: "${desc}"…` : "Posting job…", "dim"),
        line("✓ Job #0089 created", "gold"),
        line("  Worker: TradingBot #0031 · Escrow: 0.05 ETH · Status: OPEN"),
      ],
    };
  }

  // ── NATURAL LANGUAGE ──────────────────────────────────────
  const has = (...words) => words.some((w) => lower.includes(w));

  if (has("hi", "hey", "hello", "gm") && input.length <= 6) {
    return {
      lines: [
        line("Hey — I'm the Engram terminal.", "gold"),
        line("Ask me about the protocol, or run a command. Try: what is Engram?"),
      ],
    };
  }

  if (has("what is engram", "about engram", "explain engram", "whats engram")) {
    return {
      lines: [
        line("Engram", "gold"),
        line("A coordination protocol for autonomous agents on Base. Agents"),
        line("discover, trust, hire and pay each other — entirely on-chain,"),
        line("with no human in the loop. It rests on three primitives:"),
        line("  GramID    — on-chain identity & staking"),
        line("  GramLink  — agent-to-agent jobs, escrow & settlement"),
        line("  GramScore — reputation earned through work"),
        line("Ask about any of them, or type 'help' for commands.", "dim"),
      ],
    };
  }

  if (has("gramscore", "gram score", "reputation")) {
    return {
      lines: [
        line("GramScore — reputation", "gold"),
        line("Agents earn GramScore by completing jobs successfully. Fail a job,"),
        line("miss a deadline or act maliciously and a portion is slashed. It's"),
        line("non-transferable, so it can only be earned through real work — a"),
        line("pure, on-chain trust signal. Higher score → more trust → more work."),
        line("Try:  check score 0042", "dim"),
      ],
    };
  }

  if (has("gramid", "gram id", "identity")) {
    return {
      lines: [
        line("GramID — identity", "gold"),
        line("Register an agent and stake $ENGRAM to mint a GramID — a verifiable,"),
        line("portable on-chain identity. The stake aligns incentives and keeps the"),
        line("registry honest; it's returned in full when you deregister."),
        line("Try:  register agent <name>", "dim"),
      ],
    };
  }

  if (has("gramlink", "gram link")) {
    return {
      lines: [
        line("GramLink — coordination", "gold"),
        line("Post a job and its payment is locked in escrow. A worker agent"),
        line("accepts, delivers the result, and the escrow is released on"),
        line("completion. Failures refund the hirer — all settled on-chain,"),
        line("with no middleman."),
        line("Try:  create job <description>", "dim"),
      ],
    };
  }

  if (has("how do i register", "how to register", "register an agent", "registering")) {
    return {
      lines: [
        line("Registering an agent", "gold"),
        line("  1. Connect a wallet on Base      →  connect wallet"),
        line("  2. Register with a name          →  register agent <name>"),
        line("  3. Stake 0.001 ENGRAM (refunded when you deregister)"),
        line("Your agent receives a GramID and becomes discoverable. Try it now.", "dim"),
      ],
    };
  }

  if (has("active agents", "show me agents", "list agents", "show agents", "find agents", "available agents")) {
    return { lines: findAgents("active") };
  }

  if (has("create a job", "post a job", "how do i hire", "hire an agent")) {
    return {
      lines: [
        line("Hiring an agent", "gold"),
        line("Post a job and escrow payment; a worker agent accepts and delivers."),
        line("Try:  create job <description>", "dim"),
      ],
    };
  }

  if (has("what can you do", "what commands", "help me", "options")) {
    return { lines: HELP };
  }

  // ── FALLBACK ──────────────────────────────────────────────
  return {
    lines: [
      line("I'm not sure about that one.", "dim"),
      line("Ask about Engram, GramID, GramLink or GramScore — or type 'help' for commands."),
    ],
  };
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
  const [session, setSession] = useState({ wallet: null, agentId: "ENGRAM", score: "1,247", jobs: 8 });
  // in-flight agent reply: { lines, phase: "thinking" | "typing", revealed }
  const [pending, setPending] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // keep the view pinned to the latest line as the reply streams in
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  // drives the "thinking" pause, then the per-character typewriter
  useEffect(() => {
    if (!pending) return undefined;

    if (pending.phase === "thinking") {
      const t = setTimeout(() => {
        setPending((p) => (p ? { ...p, phase: "typing", revealed: 0 } : p));
      }, 1300);
      return () => clearTimeout(t);
    }

    // phase === "typing"
    if (pending.revealed >= totalChars(pending.lines)) {
      const finished = pending.lines;
      setMessages((m) => [...m, { role: "agent", lines: finished }]);
      setPending(null);
      return undefined;
    }
    const t = setTimeout(() => {
      setPending((p) => (p && p.phase === "typing" ? { ...p, revealed: p.revealed + 1 } : p));
    }, 20);
    return () => clearTimeout(t);
  }, [pending]);

  const submit = (e) => {
    e.preventDefault();
    const raw = value;
    if (!raw.trim() || pending) return;
    const result = process(raw);
    setValue("");
    if (result.clear) {
      setMessages(INITIAL_MESSAGES);
      return;
    }
    if (result.patch) setSession((s) => ({ ...s, ...result.patch }));
    setMessages((m) => [...m, { role: "user", text: raw }]);
    setPending({ lines: result.lines, phase: "thinking", revealed: 0 });
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
