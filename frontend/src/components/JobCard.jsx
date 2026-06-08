import { formatEther } from "ethers";
import { JOB_STATUS } from "../config/contracts";

const STATUS_CLASS = {
  OPEN: "badge-open",
  ACTIVE: "badge-open",
  COMPLETED: "badge-completed",
  FAILED: "badge-failed",
  DISPUTED: "badge-disputed",
};

export default function JobCard({ job, role, busy, onAccept, onComplete, onFail, onDispute }) {
  const status = JOB_STATUS[job.status];
  const isWorker = role === "worker";
  const isHirer = role === "hirer";

  return (
    <div className="job-card">
      <div className="job-card-head">
        <div>
          <div className="agent-name">Job #{job.id}</div>
          <div className="agent-meta">
            Hirer #{job.hirerAgentId} → Worker #{job.workerAgentId} · {formatEther(job.payment)} ETH
          </div>
        </div>
        <span className={`badge ${STATUS_CLASS[status]}`}>{status}</span>
      </div>

      <div className="agent-meta" style={{ marginTop: 12, wordBreak: "break-all" }}>
        Task: {job.taskHash || "—"}
        {job.resultHash ? ` · Result: ${job.resultHash}` : ""}
      </div>

      <div className="row-actions">
        {isWorker && status === "OPEN" && (
          <button className="btn btn-blue" disabled={busy} onClick={() => onAccept(job.id)}>
            Accept Job
          </button>
        )}
        {isWorker && status === "ACTIVE" && (
          <button className="btn btn-blue" disabled={busy} onClick={() => onComplete(job)}>
            Complete Job
          </button>
        )}
        {isHirer && (status === "OPEN" || status === "ACTIVE") && (
          <button className="btn btn-danger" disabled={busy} onClick={() => onFail(job.id)}>
            Fail Job
          </button>
        )}
        {(status === "OPEN" || status === "ACTIVE") && (
          <button className="btn" disabled={busy} onClick={() => onDispute(job.id)}>
            Dispute
          </button>
        )}
      </div>
    </div>
  );
}
