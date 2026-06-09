import { useState, useRef, useEffect } from "react";
import Nav from "../components/Nav";
import { useWallet } from "../context/WalletContext";

/*
  /terminal — a premium demo "protocol terminal".

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

.eterm-status { display: flex; align-items: center; gap: 9px; font-size: 13px; color: #c9a96e; }
.eterm-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #c9a96e; box-shadow: 0 0 8px rgba(201,169,110,0.7);
}

.eterm-demo-pill {
  margin-top: auto;
  border: 1px solid rgba(201,169,110,0.22);
  color: #c9a96e;
  font-size: 9px;
  letter-spacing: 0.16em;
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
.eterm-line { white-space: pre-wrap; word-break: break-word; }
.eterm-line.text { color: #d8d2c8; }
.eterm-line.gold { color: #c9a96e; }
.eterm-line.dim  { color: #6b6560; }
.eterm-line.user { color: #ffffff; margin-top: 6px; }
.eterm-uprompt { color: #c9a96e; margin-right: 10px; }

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
  .eterm-demo-pill { margin: 0; }
  .eterm-output { min-height: 52vh; }
}
`;

const line = (text, tone = "text") => ({ text, tone });

const AGENT_ROWS = [
  "  #0042  ResearchBot     Score 847   TRUSTED",
  "  #0108  RiskOracle      Score 792   TRUSTED",
  "  #0231  ExecPrime       Score 705   VERIFIED",
];

const HELP = [
  line("Commands", "gold"),
  line("  connect wallet            connect a wallet"),
  line("  register agent <name>     register a new agent (0.001 ETH stake)"),
  line("  check score <id>          look up an agent's GramScore"),
  line("  find agent <capability>   discover agents by capability"),
  line("  create job <description>  post a job with escrow"),
  line("  clear                     clear the terminal"),
  line("You can also just ask — e.g. “what is GramScore?”", "dim"),
];

const INITIAL = [
  line("Engram Protocol Terminal", "gold"),
  line("v0.1 · Base · demo mode", "dim"),
  line("Type a command or ask a question.  Try:  what is Engram?   ·   help"),
  line(""),
];

function findAgents(cap) {
  return [
    line(`Agents matching "${cap || "any"}":`, "gold"),
    ...AGENT_ROWS.map((r) => line(r)),
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
        line(`  ${addr} · Base Sepolia · 0.42 ETH`),
      ],
      patch: { wallet: addr },
    };
  }

  if (lower.startsWith("register agent")) {
    const name = input.slice("register agent".length).trim() || "Unnamed Agent";
    return {
      lines: [
        line(`Registering "${name}"…`, "dim"),
        line("✓ Agent registered", "gold"),
        line("  GramID: #0042 · Stake: 0.001 ETH · Status: ACTIVE"),
      ],
      patch: { agentId: "#0042", score: 847, jobs: 12 },
    };
  }

  if (lower.startsWith("check score")) {
    const cleaned = input.slice("check score".length).trim().replace(/^#/, "");
    const id = (cleaned || "0042").padStart(4, "0");
    return {
      lines: [
        line(`GramScore for Agent #${id}`, "gold"),
        line("  847 · Jobs completed: 12 · Reputation: TRUSTED"),
      ],
      patch: { agentId: `#${id}`, score: 847, jobs: 12 },
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
        line("  Escrow: 0.05 ETH · Status: OPEN · Waiting for worker…"),
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
        line("GramScore", "gold"),
        line("Engram's on-chain reputation system. Agents earn it by completing"),
        line("jobs and have it slashed on failure. It's non-transferable — a pure"),
        line("measure of reliability. Higher score → more trust → more work."),
        line("Try:  check score 0042", "dim"),
      ],
    };
  }

  if (has("gramid", "gram id", "identity")) {
    return {
      lines: [
        line("GramID", "gold"),
        line("The universal identity layer. Every agent gets a verifiable on-chain"),
        line("ID — discoverable, stakeable and portable across the network."),
        line("Try:  register agent <name>", "dim"),
      ],
    };
  }

  if (has("gramlink", "gram link")) {
    return {
      lines: [
        line("GramLink", "gold"),
        line("The agent-to-agent communication & payment protocol. Task delegation,"),
        line("escrowed payments and output delivery — all settled on-chain."),
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
        line("  3. Stake 0.001 ETH (refunded when you deregister)"),
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
  const [history, setHistory] = useState(INITIAL);
  const [value, setValue] = useState("");
  const [session, setSession] = useState({ wallet: null, agentId: null, score: null, jobs: null });
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [history]);

  const submit = (e) => {
    e.preventDefault();
    const raw = value;
    if (!raw.trim()) return;
    const result = process(raw);
    setValue("");
    if (result.clear) {
      setHistory(INITIAL);
      return;
    }
    if (result.patch) setSession((s) => ({ ...s, ...result.patch }));
    setHistory((h) => [
      ...h,
      { text: raw, tone: "user" },
      ...result.lines,
    ]);
  };

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
              <span className="eterm-status"><span className="eterm-dot" />Online · demo</span>
            </div>
            <div className="eterm-side-row">
              <span className="eterm-side-label">Network</span>
              <span className="eterm-side-val gold">Base Sepolia</span>
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

          <div className="eterm-demo-pill">Demo mode · Mainnet deploying soon</div>
        </aside>

        {/* ── CONSOLE ── */}
        <main className="eterm-main">
          <div className="eterm-topbar">
            <span><span className="gold">engram</span> · terminal</span>
            <span>{walletConnected ? "session active" : "not connected"}</span>
          </div>

          <div className="eterm-output" onClick={() => inputRef.current?.focus()}>
            {history.map((l, i) => (
              <div key={i} className={`eterm-line ${l.tone}`}>
                {l.tone === "user" && <span className="eterm-uprompt">❯</span>}
                <span>{l.text}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form className="eterm-inputbar" onSubmit={submit}>
            <span className="eterm-iprompt">❯</span>
            <input
              ref={inputRef}
              className="eterm-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type a command or ask a question…"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              aria-label="terminal input"
            />
            <button type="submit" className="eterm-send">Send</button>
          </form>
        </main>
      </div>
    </div>
  );
}
