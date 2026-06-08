// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGramID {
    function idToOwner(uint256 id) external view returns (address);
    function isRegistered(address agent) external view returns (bool);
}

interface IGramScore {
    function increaseScore(uint256 agentId, uint256 amount) external;
    function decreaseScore(uint256 agentId, uint256 amount) external;
    function recordJobCompleted(uint256 agentId) external;
    function recordJobFailed(uint256 agentId) external;
}

/**
 * @title GramLink
 * @notice On-chain job settlement layer for Engram. Task/result content lives off-chain;
 *         only hashes and escrowed payment are kept on-chain. Outcomes feed GramScore.
 */
contract GramLink is Ownable, ReentrancyGuard {
    enum JobStatus { OPEN, ACTIVE, COMPLETED, FAILED, DISPUTED }

    struct Job {
        uint256 id;
        uint256 hirerAgentId;
        uint256 workerAgentId;
        uint256 payment;
        JobStatus status;
        string taskHash;
        string resultHash;
        uint256 createdAt;
        uint256 completedAt;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => uint256[]) private jobsByAgent;
    uint256 public totalJobs;

    IGramID public immutable gramID;
    IGramScore public immutable gramScore;

    uint256 public protocolFee = 250; // basis points (2.5%)
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public accruedFees;

    // score rewards / penalties
    uint256 public constant WORKER_REWARD = 10;
    uint256 public constant HIRER_REWARD = 2;
    uint256 public constant WORKER_PENALTY = 5;

    event JobCreated(uint256 indexed jobId, uint256 indexed hirerAgentId, uint256 indexed workerAgentId, uint256 payment);
    event JobAccepted(uint256 indexed jobId);
    event JobCompleted(uint256 indexed jobId, string resultHash);
    event JobFailed(uint256 indexed jobId);
    event JobDisputed(uint256 indexed jobId);
    event DisputeResolved(uint256 indexed jobId, bool workerWins);
    event ProtocolFeesWithdrawn(address indexed to, uint256 amount);
    event ProtocolFeeUpdated(uint256 newFeeBps);

    constructor(address _gramID, address _gramScore) Ownable(msg.sender) {
        require(_gramID != address(0) && _gramScore != address(0), "GramLink: zero address");
        gramID = IGramID(_gramID);
        gramScore = IGramScore(_gramScore);
    }

    modifier onlyHirer(uint256 jobId) {
        require(gramID.idToOwner(jobs[jobId].hirerAgentId) == msg.sender, "GramLink: not hirer");
        _;
    }

    modifier onlyWorker(uint256 jobId) {
        require(gramID.idToOwner(jobs[jobId].workerAgentId) == msg.sender, "GramLink: not worker");
        _;
    }

    /// @notice Create a job, escrowing msg.value. Caller must own the hirer agent.
    function createJob(uint256 hirerAgentId, uint256 workerAgentId, string calldata taskHash)
        external
        payable
        returns (uint256)
    {
        require(msg.value > 0, "GramLink: payment required");
        require(hirerAgentId != workerAgentId, "GramLink: hirer == worker");

        address hirerOwner = gramID.idToOwner(hirerAgentId);
        require(hirerOwner == msg.sender, "GramLink: not hirer owner");
        require(gramID.isRegistered(hirerOwner), "GramLink: hirer not registered");
        require(gramID.isRegistered(gramID.idToOwner(workerAgentId)), "GramLink: worker not registered");

        totalJobs += 1;
        uint256 jobId = totalJobs;

        jobs[jobId] = Job({
            id: jobId,
            hirerAgentId: hirerAgentId,
            workerAgentId: workerAgentId,
            payment: msg.value,
            status: JobStatus.OPEN,
            taskHash: taskHash,
            resultHash: "",
            createdAt: block.timestamp,
            completedAt: 0
        });

        jobsByAgent[hirerAgentId].push(jobId);
        jobsByAgent[workerAgentId].push(jobId);

        emit JobCreated(jobId, hirerAgentId, workerAgentId, msg.value);
        return jobId;
    }

    /// @notice Worker accepts an OPEN job, moving it to ACTIVE.
    function acceptJob(uint256 jobId) external onlyWorker(jobId) {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.OPEN, "GramLink: not open");
        job.status = JobStatus.ACTIVE;
        emit JobAccepted(jobId);
    }

    /// @notice Worker completes an ACTIVE job; releases payment minus protocol fee.
    function completeJob(uint256 jobId, string calldata resultHash) external nonReentrant onlyWorker(jobId) {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.ACTIVE, "GramLink: not active");

        job.status = JobStatus.COMPLETED;
        job.resultHash = resultHash;
        job.completedAt = block.timestamp;

        uint256 payment = job.payment;
        uint256 fee = (payment * protocolFee) / BPS_DENOMINATOR;
        uint256 workerAmount = payment - fee;
        accruedFees += fee;

        address workerOwner = gramID.idToOwner(job.workerAgentId);

        gramScore.increaseScore(job.workerAgentId, WORKER_REWARD);
        gramScore.increaseScore(job.hirerAgentId, HIRER_REWARD);
        gramScore.recordJobCompleted(job.workerAgentId);

        (bool ok, ) = payable(workerOwner).call{value: workerAmount}("");
        require(ok, "GramLink: payout failed");

        emit JobCompleted(jobId, resultHash);
    }

    /// @notice Hirer marks a job FAILED; refunds escrow and penalizes the worker.
    function failJob(uint256 jobId) external nonReentrant onlyHirer(jobId) {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.OPEN || job.status == JobStatus.ACTIVE, "GramLink: not failable");

        job.status = JobStatus.FAILED;
        uint256 refund = job.payment;
        address hirerOwner = gramID.idToOwner(job.hirerAgentId);

        gramScore.decreaseScore(job.workerAgentId, WORKER_PENALTY);
        gramScore.recordJobFailed(job.workerAgentId);

        (bool ok, ) = payable(hirerOwner).call{value: refund}("");
        require(ok, "GramLink: refund failed");

        emit JobFailed(jobId);
    }

    /// @notice Either party can flag a job as DISPUTED for owner resolution.
    function disputeJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        address hirerOwner = gramID.idToOwner(job.hirerAgentId);
        address workerOwner = gramID.idToOwner(job.workerAgentId);
        require(msg.sender == hirerOwner || msg.sender == workerOwner, "GramLink: not a party");
        require(job.status == JobStatus.OPEN || job.status == JobStatus.ACTIVE, "GramLink: not disputable");

        job.status = JobStatus.DISPUTED;
        emit JobDisputed(jobId);
    }

    /// @notice Owner resolves a dispute, paying the winner accordingly.
    function resolveDispute(uint256 jobId, bool workerWins) external nonReentrant onlyOwner {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.DISPUTED, "GramLink: not disputed");

        uint256 payment = job.payment;

        if (workerWins) {
            job.status = JobStatus.COMPLETED;
            job.completedAt = block.timestamp;
            uint256 fee = (payment * protocolFee) / BPS_DENOMINATOR;
            uint256 workerAmount = payment - fee;
            accruedFees += fee;

            gramScore.increaseScore(job.workerAgentId, WORKER_REWARD);
            gramScore.recordJobCompleted(job.workerAgentId);

            address workerOwner = gramID.idToOwner(job.workerAgentId);
            (bool ok, ) = payable(workerOwner).call{value: workerAmount}("");
            require(ok, "GramLink: payout failed");
        } else {
            job.status = JobStatus.FAILED;
            gramScore.decreaseScore(job.workerAgentId, WORKER_PENALTY);
            gramScore.recordJobFailed(job.workerAgentId);

            address hirerOwner = gramID.idToOwner(job.hirerAgentId);
            (bool ok, ) = payable(hirerOwner).call{value: payment}("");
            require(ok, "GramLink: refund failed");
        }

        emit DisputeResolved(jobId, workerWins);
    }

    function withdrawProtocolFees() external nonReentrant onlyOwner {
        uint256 amount = accruedFees;
        require(amount > 0, "GramLink: no fees");
        accruedFees = 0;
        (bool ok, ) = payable(owner()).call{value: amount}("");
        require(ok, "GramLink: withdraw failed");
        emit ProtocolFeesWithdrawn(owner(), amount);
    }

    function setProtocolFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "GramLink: fee too high"); // cap at 10%
        protocolFee = _feeBps;
        emit ProtocolFeeUpdated(_feeBps);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getJobsByAgent(uint256 agentId) external view returns (uint256[] memory) {
        return jobsByAgent[agentId];
    }
}
