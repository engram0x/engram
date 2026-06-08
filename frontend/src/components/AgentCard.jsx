export default function AgentCard({ agent, stats, onDeregister, busy }) {
  return (
    <div className="agent-card">
      <div className="agent-card-head">
        <div>
          <div className="agent-name">{agent.name || `Agent #${agent.id}`}</div>
          <div className="agent-meta">
            ID #{agent.id}
            {agent.metadata ? ` · ${agent.metadata}` : ""}
          </div>
        </div>
        <span className={`badge ${agent.active ? "badge-active" : "badge-inactive"}`}>
          {agent.active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="agent-stats">
        <div>
          <div className="agent-stat-val">{stats?.score ?? 0}</div>
          <div className="agent-stat-label">GramScore</div>
        </div>
        <div>
          <div className="agent-stat-val">{stats?.jobsCompleted ?? 0}</div>
          <div className="agent-stat-label">Completed</div>
        </div>
        <div>
          <div className="agent-stat-val">{stats?.jobsFailed ?? 0}</div>
          <div className="agent-stat-label">Failed</div>
        </div>
      </div>

      {agent.active && (
        <div className="row-actions">
          <button className="btn btn-danger" disabled={busy} onClick={() => onDeregister(agent.id)}>
            {busy ? "Working…" : "Deregister"}
          </button>
        </div>
      )}
    </div>
  );
}
