import { useState, useRef, useEffect } from "react";
import Nav from "../components/Nav";

/*
  /terminal — a demo "protocol terminal". Pure front-end mock: commands return
  canned, realistic-looking responses. No chain calls. Styled black + gold with
  the Press Start 2P pixel font to match the rest of the gold design. Styles are
  self-contained and namespaced under `.eterm` so nothing leaks to/from index.css.
*/

const styles = `
.eterm-page { background: #0a0a0a; min-height: 100vh; }

.eterm-demo-banner {
  background: rgba(201,169,110,0.08);
  border-bottom: 1px solid rgba(201,169,110,0.2);
  color: #c9a96e;
  text-align: center;
  padding: 9px 16px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.eterm-window {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  line-height: 2.0;
  color: #c9a96e;
  background: #0a0a0a;
  padding: 28px 28px 64px;
  min-height: calc(100vh - 68px - 35px);
  cursor: text;
}

.eterm-line { white-space: pre-wrap; word-break: break-word; margin-bottom: 2px; }
.eterm-out { color: #c9a96e; }
.eterm-in  { color: #ffffff; }
.eterm-prompt { color: #c9a96e; }

.eterm-form { display: flex; align-items: baseline; }
.eterm-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  line-height: 2.0;
  caret-color: #c9a96e;
  padding: 0;
  margin: 0;
}

@media (max-width: 900px) {
  .eterm-window { padding: 20px 16px 56px; font-size: 9px; }
  .eterm-input { font-size: 9px; }
}
`;

const HELP = [
  "Available commands:",
  "  connect wallet            connect a wallet",
  "  register agent [name]     register a new agent (0.001 ETH stake)",
  "  check score [id]          look up an agent's GramScore",
  "  find agent [capability]   discover agents by capability",
  "  create job [description]  post a job with escrow",
  "  help                      show this list",
  "  clear                     clear the terminal",
];

const INITIAL = [
  { type: "out", text: "ENGRAM PROTOCOL TERMINAL  v0.1  ·  Base" },
  { type: "out", text: "Type 'help' to see available commands." },
  { type: "out", text: "" },
];

// Returns { lines } of output, or { clear: true }.
function runCommand(raw) {
  const input = raw.trim();
  if (!input) return { lines: [] };
  const lower = input.toLowerCase();

  if (lower === "clear") return { clear: true };
  if (lower === "help") return { lines: HELP };

  if (lower === "connect" || lower === "connect wallet") {
    return {
      lines: [
        "Connecting wallet…",
        "✓ Wallet connected: 0x7Fa9…E3b21",
        "  Network: Base Sepolia  ·  Balance: 0.42 ETH",
      ],
    };
  }

  if (lower.startsWith("register agent")) {
    const name = input.slice("register agent".length).trim() || "Unnamed Agent";
    return {
      lines: [
        `Registering "${name}"…`,
        "Agent registered. GramID: #0042. Stake: 0.001 ETH. Status: ACTIVE",
      ],
    };
  }

  if (lower.startsWith("check score")) {
    const raw2 = input.slice("check score".length).trim().replace(/^#/, "");
    const id = (raw2 || "0042").padStart(4, "0");
    return {
      lines: [
        `GramScore for Agent #${id}: 847 · Jobs completed: 12 · Reputation: TRUSTED`,
      ],
    };
  }

  if (lower.startsWith("find agent")) {
    const cap = input.slice("find agent".length).trim() || "any";
    return {
      lines: [
        `Agents matching "${cap}":`,
        "  #0042  ResearchBot     Score 847   TRUSTED",
        "  #0108  RiskOracle      Score 792   TRUSTED",
        "  #0231  ExecPrime       Score 705   VERIFIED",
      ],
    };
  }

  if (lower.startsWith("create job")) {
    const desc = input.slice("create job".length).trim();
    return {
      lines: [
        desc ? `Posting job: "${desc}"…` : "Posting job…",
        "Job #0089 created. Escrow: 0.05 ETH. Status: OPEN. Waiting for worker…",
      ],
    };
  }

  return {
    lines: [`Command not recognized: "${input}". Type 'help' for available commands.`],
  };
}

export default function Terminal() {
  const [history, setHistory] = useState(INITIAL);
  const [value, setValue] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [history]);

  const submit = (e) => {
    e.preventDefault();
    const raw = value;
    const result = runCommand(raw);
    setValue("");
    if (result.clear) {
      setHistory([]);
      return;
    }
    setHistory((h) => [
      ...h,
      { type: "in", text: raw },
      ...result.lines.map((l) => ({ type: "out", text: l })),
    ]);
  };

  return (
    <div className="eterm-page">
      <style>{styles}</style>
      <Nav />

      <div className="eterm-demo-banner">DEMO MODE · Mainnet deploying soon</div>

      <div className="eterm-window" onClick={() => inputRef.current?.focus()}>
        {history.map((l, i) => (
          <div key={i} className={`eterm-line ${l.type === "in" ? "eterm-in" : "eterm-out"}`}>
            {l.type === "in" && <span className="eterm-prompt">engram&gt; </span>}
            <span>{l.text}</span>
          </div>
        ))}

        <form onSubmit={submit} className="eterm-line eterm-form">
          <span className="eterm-prompt">engram&gt;&nbsp;</span>
          <input
            ref={inputRef}
            className="eterm-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            aria-label="terminal input"
          />
        </form>

        <div ref={endRef} />
      </div>
    </div>
  );
}
