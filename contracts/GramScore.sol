// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GramScore
 * @notice On-chain reputation system for Engram agents. Scores can only be moved by the
 *         GramLink settlement contract (via job outcomes) or slashed manually by the owner.
 */
contract GramScore is Ownable {
    mapping(uint256 => uint256) public scores; // agentId => score
    mapping(uint256 => uint256) public jobsCompleted;
    mapping(uint256 => uint256) public jobsFailed;

    address public gramLink;

    struct ScoreHistory {
        uint256 agentId;
        int256 delta;
        uint256 timestamp;
        string reason;
    }

    // full reputation history per agent
    mapping(uint256 => ScoreHistory[]) public history;

    event ScoreUpdated(uint256 indexed agentId, uint256 newScore);
    event AgentSlashed(uint256 indexed agentId, uint256 amount);
    event GramLinkUpdated(address indexed gramLink);

    modifier onlyGramLink() {
        require(msg.sender == gramLink, "GramScore: only GramLink");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setGramLink(address _gramLink) external onlyOwner {
        gramLink = _gramLink;
        emit GramLinkUpdated(_gramLink);
    }

    function increaseScore(uint256 agentId, uint256 amount) external onlyGramLink {
        scores[agentId] += amount;
        history[agentId].push(ScoreHistory(agentId, int256(amount), block.timestamp, "increase"));
        emit ScoreUpdated(agentId, scores[agentId]);
    }

    function decreaseScore(uint256 agentId, uint256 amount) external onlyGramLink {
        uint256 current = scores[agentId];
        uint256 newScore = current > amount ? current - amount : 0; // floor at 0
        scores[agentId] = newScore;
        history[agentId].push(ScoreHistory(agentId, -int256(amount), block.timestamp, "decrease"));
        emit ScoreUpdated(agentId, newScore);
    }

    /// @notice Manual penalty applied by the protocol owner.
    function slash(uint256 agentId, uint256 amount) external onlyOwner {
        uint256 current = scores[agentId];
        uint256 newScore = current > amount ? current - amount : 0;
        scores[agentId] = newScore;
        history[agentId].push(ScoreHistory(agentId, -int256(amount), block.timestamp, "slash"));
        emit AgentSlashed(agentId, amount);
        emit ScoreUpdated(agentId, newScore);
    }

    /// @notice GramLink-only counters used by getStats. Kept separate from score math.
    function recordJobCompleted(uint256 agentId) external onlyGramLink {
        jobsCompleted[agentId] += 1;
    }

    function recordJobFailed(uint256 agentId) external onlyGramLink {
        jobsFailed[agentId] += 1;
    }

    function getScore(uint256 agentId) external view returns (uint256) {
        return scores[agentId];
    }

    function getStats(uint256 agentId)
        external
        view
        returns (uint256 score, uint256 completed, uint256 failed)
    {
        return (scores[agentId], jobsCompleted[agentId], jobsFailed[agentId]);
    }

    function getHistoryLength(uint256 agentId) external view returns (uint256) {
        return history[agentId].length;
    }
}
