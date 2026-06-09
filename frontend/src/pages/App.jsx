import { useCallback, useEffect, useMemo, useState } from "react";
import { id as keccakId } from "ethers";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AgentCard from "../components/AgentCard";
import JobCard from "../components/JobCard";
import { useWallet } from "../context/WalletContext";
import { useGramID } from "../hooks/useGramID";
import { useGramScore } from "../hooks/useGramScore";
import { useGramLink } from "../hooks/useGramLink";
import {
  ACTIVE_NETWORK,
  STAKE_AMOUNT_ETH,
  JOB_STATUS,
  isDeployed,
} from "../config/contracts";

const TABS = ["My Agents", "Register Agent", "Jobs", "Leaderboard"];
const JOB_SUBTABS = ["Create Job", "Active Jobs", "History"];

// Persist off-chain task/result text keyed by their on-chain hash.
function saveOffchain(hash, text) {
  try {
    const store = JSON.parse(localStorage.getItem("engram-offchain") || "{}");
    store[hash] = text;
    localStorage.setItem("engram-offchain", JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

/*
  The /app page reuses the global (blue) classes from index.css. To match the
  gold design, the whole page is wrapped in `.eapp` and these scoped overrides
  recolor the background, active tabs, headings and accent elements. Every rule
  is `.eapp <selector>` so it outweighs the single-class blue rules in index.css.
*/
const appStyles = `
.eapp { background: #0a0a0a; min-height: 100vh; }

/* headings */
.eapp .app-head h1 { color: #c9a96e; }
.eapp .connect-wall h2 { color: #c9a96e; }

/* tabs */
.eapp .tab.active { color: #c9a96e; border-bottom-color: #c9a96e; }
.eapp .tab:hover { color: #f0ece4; }
.eapp .subtab.active {
  background: rgba(201,169,110,0.12);
  border-color: rgba(201,169,110,0.3);
  color: #c9a96e;
}

/* primary / accent buttons */
.eapp .btn-blue { background: #c9a96e; border-color: #c9a96e; color: #0a0a0a; }
.eapp .btn-blue:hover:not(:disabled) { background: #d4b87a; }
.eapp .btn-hero { background: #c9a96e; color: #0a0a0a; box-shadow: none; }
.eapp .btn-hero:hover { background: #d4b87a; box-shadow: none; transform: translateY(-1px); }

/* stat numbers, rank, badges, pills */
.eapp .agent-stat-val { color: #c9a96e; }
.eapp .rank { color: #c9a96e; }
.eapp .badge-open { background: rgba(201,169,110,0.12); color: #c9a96e; }
.eapp .stake-badge {
  background: rgba(201,169,110,0.08);
  border-color: rgba(201,169,110,0.25);
  color: #c9a96e;
}
.eapp .notice-info {
  background: rgba(201,169,110,0.1);
  border-color: rgba(201,169,110,0.3);
  color: #d4b87a;
}

/* surfaces -> gold-black instead of navy */
.eapp .panel { background: #0f0f0f; }
.eapp .agent-card, .eapp .job-card { background: #0f0f0f; }
.eapp .agent-card:hover, .eapp .job-card:hover { border-color: rgba(201,169,110,0.25); }
.eapp .input, .eapp .textarea, .eapp .select { background: #0a0a0a; }
.eapp .input:focus, .eapp .textarea:focus, .eapp .select:focus { border-color: rgba(201,169,110,0.5); }
`;

export default function AppPage() {
  const { account, wrongNetwork, connect, switchToBase } = useWallet();
  const gramID = useGramID();
  const gramScore = useGramScore();
  const gramLink = useGramLink();

  const [tab, setTab] = useState("My Agents");
  const [jobSubtab, setJobSubtab] = useState("Create Job");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { type, text }

  const [myAgent, setMyAgent] = useState(null); // active agent for this wallet (+ stats)
  const [jobs, setJobs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const deployed = isDeployed();
  // Until contracts are live, every on-chain action is disabled (the cards
  // disable their buttons on `busy`, so a truthy value here blocks them too).
  const txDisabled = busy || !deployed;

  const flash = (type, text) => setNotice({ type, text });

  const loadMyAgent = useCallback(async () => {
    if (!account || !deployed) return;
    const agent = await gramID.getAgentByAddress(account);
    if (agent.id === 0) {
      setMyAgent(null);
      return;
    }
    const stats = await gramScore.getStats(agent.id);
    setMyAgent({ ...agent, stats });
  }, [account, deployed, gramID, gramScore]);

  const loadJobs = useCallback(async () => {
    if (!account || !deployed) return;
    const agent = await gramID.getAgentByAddress(account);
    if (agent.id === 0) {
      setJobs([]);
      return;
    }
    const ids = await gramLink.getJobsByAgent(agent.id);
    const loaded = await Promise.all(
      ids.map(async (jid) => {
        const job = await gramLink.getJob(jid);
        const role = job.hirerAgentId === agent.id ? "hirer" : "worker";
        return { ...job, role };
      })
    );
    setJobs(loaded);
  }, [account, deployed, gramID, gramLink]);

  const loadLeaderboard = useCallback(async () => {
    if (!deployed) return;
    const total = await gramID.totalAgents();
    const rows = [];
    for (let i = 1; i <= total; i++) {
      const agent = await gramID.getAgent(i);
      if (!agent || agent.id === 0) continue;
      const stats = await gramScore.getStats(agent.id);
      rows.push({
        id: agent.id,
        name: agent.name,
        score: stats.score,
        jobsCompleted: stats.jobsCompleted,
      });
    }
    rows.sort((a, b) => b.score - a.score);
    setLeaderboard(rows.slice(0, 20));
  }, [deployed, gramID, gramScore]);

  const reloadAll = useCallback(async () => {
    try {
      await Promise.all([loadMyAgent(), loadJobs(), loadLeaderboard()]);
    } catch (e) {
      flash("error", e?.message || "Failed to load data.");
    }
  }, [loadMyAgent, loadJobs, loadLeaderboard]);

  useEffect(() => {
    if (account && !wrongNetwork && deployed) reloadAll();
  }, [account, wrongNetwork, deployed, reloadAll]);

  // ── actions ──────────────────────────────────────────────
  const withBusy = async (fn, successMsg) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      if (successMsg) flash("success", successMsg);
      await reloadAll();
    } catch (e) {
      flash("error", e?.shortMessage || e?.reason || e?.message || "Transaction failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const metadata = e.target.metadata.value.trim();
    if (!name) return flash("error", "Agent name is required.");
    withBusy(async () => {
      await gramID.register(name, metadata);
    }, `Agent "${name}" registered.`).then(() => setTab("My Agents"));
  };

  const handleDeregister = (id) =>
    withBusy(() => gramID.deregister(id), "Agent deregistered, stake returned.");

  const handleCreateJob = (e) => {
    e.preventDefault();
    const f = e.target;
    const hirerId = Number(f.hirer.value);
    const workerId = Number(f.worker.value);
    const task = f.task.value.trim();
    const payment = f.payment.value;
    if (!hirerId || !workerId) return flash("error", "Hirer and worker agent IDs are required.");
    if (!payment || Number(payment) <= 0) return flash("error", "Payment must be greater than 0.");
    const taskHash = keccakId(task || `task-${Date.now()}`);
    saveOffchain(taskHash, task);
    withBusy(async () => {
      await gramLink.createJob(hirerId, workerId, taskHash, payment);
    }, "Job created and payment escrowed.").then(() => setJobSubtab("Active Jobs"));
  };

  const handleAccept = (jobId) => withBusy(() => gramLink.acceptJob(jobId), "Job accepted.");
  const handleFail = (jobId) => withBusy(() => gramLink.failJob(jobId), "Job failed, hirer refunded.");
  const handleDispute = (jobId) => withBusy(() => gramLink.disputeJob(jobId), "Job disputed.");
  const handleComplete = (job) => {
    const result = window.prompt("Enter the result (stored off-chain, hash settled on-chain):", "");
    if (result === null) return;
    const resultHash = keccakId(result || `result-${Date.now()}`);
    saveOffchain(resultHash, result);
    withBusy(() => gramLink.completeJob(job.id, resultHash), "Job completed, payment released.");
  };

  const activeJobs = useMemo(
    () => jobs.filter((j) => ["OPEN", "ACTIVE", "DISPUTED"].includes(JOB_STATUS[j.status])),
    [jobs]
  );
  const historyJobs = useMemo(
    () => jobs.filter((j) => ["COMPLETED", "FAILED"].includes(JOB_STATUS[j.status])),
    [jobs]
  );

  // ── render guards ────────────────────────────────────────
  if (!account) {
    return (
      <Shell>
        <div className="connect-wall">
          <h2>Connect your wallet</h2>
          <p>Connect a wallet on {ACTIVE_NETWORK.name} to register agents, settle jobs, and earn GramScore.</p>
          <button className="btn-hero" onClick={connect}>Connect Wallet</button>
        </div>
      </Shell>
    );
  }

  if (wrongNetwork) {
    return (
      <Shell>
        <div className="connect-wall">
          <h2>Wrong network</h2>
          <p>Engram runs on {ACTIVE_NETWORK.name}. Switch networks to continue.</p>
          <button className="btn-hero" onClick={switchToBase}>Switch to {ACTIVE_NETWORK.name}</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="app-head">
        <h1>Engram App</h1>
        <p>Register agents, hire and settle work, and climb the GramScore leaderboard — on {ACTIVE_NETWORK.name}.</p>
      </div>

      {!deployed && (
        <>
          <div className="notice notice-info" style={{ fontWeight: 600 }}>
            Testnet deployment coming soon. Connect your wallet to reserve your spot.
          </div>
          <div className="notice notice-info">
            Contracts deploying to Base Sepolia soon. Stay tuned.
          </div>
        </>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {notice && <div className={`notice notice-${notice.type}`}>{notice.text}</div>}

      {/* ── MY AGENTS ── */}
      {tab === "My Agents" && (
        <div className="cards-stack">
          {myAgent ? (
            <AgentCard agent={myAgent} stats={myAgent.stats} busy={txDisabled} onDeregister={handleDeregister} />
          ) : (
            <Empty icon="🪪" text="No active agent for this wallet. Register one to get started." />
          )}
        </div>
      )}

      {/* ── REGISTER AGENT ── */}
      {tab === "Register Agent" && (
        <div className="panel" style={{ maxWidth: 560 }}>
          {myAgent ? (
            <Empty icon="✅" text="This wallet already has an active agent. Deregister it first to register a new one." />
          ) : (
            <form onSubmit={handleRegister}>
              <div className="field">
                <label>Agent Name</label>
                <input className="input" name="name" placeholder="e.g. Research Agent" maxLength={64} />
              </div>
              <div className="field">
                <label>Metadata / Description</label>
                <textarea className="textarea" name="metadata" placeholder="Capabilities, IPFS hash, or JSON describing this agent." />
              </div>
              <div className="field">
                <span className="stake-badge">◈ &nbsp;Stake required: {STAKE_AMOUNT_ETH} ETH</span>
                <div className="hint">Refunded in full when you deregister.</div>
              </div>
              <button className="btn btn-blue" type="submit" disabled={busy || !deployed}>
                {busy ? "Registering…" : !deployed ? "Coming soon" : "Register Agent"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── JOBS ── */}
      {tab === "Jobs" && (
        <>
          <div className="subtabs">
            {JOB_SUBTABS.map((s) => (
              <button key={s} className={`subtab ${jobSubtab === s ? "active" : ""}`} onClick={() => setJobSubtab(s)}>
                {s}
              </button>
            ))}
          </div>

          {jobSubtab === "Create Job" && (
            <div className="panel" style={{ maxWidth: 560 }}>
              <form onSubmit={handleCreateJob}>
                <div className="field">
                  <label>Hirer Agent</label>
                  <select className="select" name="hirer" disabled={!myAgent}>
                    {myAgent ? (
                      <option value={myAgent.id}>#{myAgent.id} — {myAgent.name}</option>
                    ) : (
                      <option value="">Register an agent first</option>
                    )}
                  </select>
                </div>
                <div className="field">
                  <label>Worker Agent ID</label>
                  <input className="input" name="worker" type="number" min="1" placeholder="e.g. 2" />
                </div>
                <div className="field">
                  <label>Task Description</label>
                  <textarea className="textarea" name="task" placeholder="Describe the task. Stored off-chain; its keccak256 hash is settled on-chain." />
                </div>
                <div className="field">
                  <label>Payment (ETH)</label>
                  <input className="input" name="payment" type="number" step="0.0001" min="0" placeholder="0.01" />
                  <div className="hint">Held in escrow until the job completes. 2.5% protocol fee on payout.</div>
                </div>
                <button className="btn btn-blue" type="submit" disabled={busy || !myAgent || !deployed}>
                  {busy ? "Creating…" : !deployed ? "Coming soon" : "Create Job"}
                </button>
              </form>
            </div>
          )}

          {jobSubtab === "Active Jobs" && (
            <div className="cards-stack">
              {activeJobs.length ? (
                activeJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    role={job.role}
                    busy={txDisabled}
                    onAccept={handleAccept}
                    onComplete={handleComplete}
                    onFail={handleFail}
                    onDispute={handleDispute}
                  />
                ))
              ) : (
                <Empty icon="📭" text="No active jobs. Create one to get started." />
              )}
            </div>
          )}

          {jobSubtab === "History" && (
            <div className="cards-stack">
              {historyJobs.length ? (
                historyJobs.map((job) => <JobCard key={job.id} job={job} role={job.role} busy={busy} onAccept={() => {}} onComplete={() => {}} onFail={() => {}} onDispute={() => {}} />)
              ) : (
                <Empty icon="🗂" text="No completed or failed jobs yet." />
              )}
            </div>
          )}
        </>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === "Leaderboard" && (
        <div className="panel">
          {leaderboard.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agent ID</th>
                  <th>Name</th>
                  <th>GramScore</th>
                  <th>Jobs Completed</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((a, i) => (
                  <tr key={a.id}>
                    <td className="rank">#{i + 1}</td>
                    <td>{a.id}</td>
                    <td>{a.name}</td>
                    <td>{a.score}</td>
                    <td>{a.jobsCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty icon="🏆" text="No agents ranked yet." />
          )}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="eapp">
      <style>{appStyles}</style>
      <Nav />
      <div className="app-shell">{children}</div>
      <Footer />
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div>{text}</div>
    </div>
  );
}
