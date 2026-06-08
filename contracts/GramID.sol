// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GramID
 * @notice Universal on-chain identity registry for autonomous agents in the Engram protocol.
 *         One active agent profile per address. Registration requires a refundable stake.
 */
contract GramID is Ownable, ReentrancyGuard {
    struct AgentProfile {
        uint256 id;
        address owner;
        string name;
        string metadata; // IPFS hash or JSON string
        uint256 registeredAt;
        bool active;
    }

    mapping(address => AgentProfile) public agents;
    mapping(uint256 => address) public idToOwner;
    uint256 public totalAgents;
    uint256 public stakeAmount = 0.001 ether;

    // actual stake paid per agent id, so refunds are correct even if stakeAmount changes
    mapping(uint256 => uint256) private _stakeOf;

    event AgentRegistered(uint256 indexed id, address indexed owner, string name);
    event AgentDeregistered(uint256 indexed id);
    event MetadataUpdated(uint256 indexed id, string metadata);
    event StakeAmountUpdated(uint256 newStakeAmount);

    constructor() Ownable(msg.sender) {}

    /// @notice Register the caller as an agent. Requires msg.value >= stakeAmount.
    function register(string calldata name, string calldata metadata) external payable returns (uint256) {
        require(msg.value >= stakeAmount, "GramID: insufficient stake");
        require(!agents[msg.sender].active, "GramID: already registered");

        totalAgents += 1;
        uint256 id = totalAgents;

        agents[msg.sender] = AgentProfile({
            id: id,
            owner: msg.sender,
            name: name,
            metadata: metadata,
            registeredAt: block.timestamp,
            active: true
        });
        idToOwner[id] = msg.sender;
        _stakeOf[id] = msg.value;

        emit AgentRegistered(id, msg.sender, name);
        return id;
    }

    /// @notice Deregister an owned agent, mark it inactive and return its stake.
    function deregister(uint256 id) external nonReentrant {
        address agentOwner = idToOwner[id];
        require(agentOwner == msg.sender, "GramID: not owner");
        require(agents[msg.sender].active, "GramID: not active");

        agents[msg.sender].active = false;
        uint256 refund = _stakeOf[id];
        _stakeOf[id] = 0;

        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            require(ok, "GramID: refund failed");
        }

        emit AgentDeregistered(id);
    }

    /// @notice Update the metadata of an owned, active agent.
    function updateMetadata(uint256 id, string calldata metadata) external {
        require(idToOwner[id] == msg.sender, "GramID: not owner");
        require(agents[msg.sender].active, "GramID: not active");
        agents[msg.sender].metadata = metadata;
        emit MetadataUpdated(id, metadata);
    }

    function getAgent(uint256 id) external view returns (AgentProfile memory) {
        return agents[idToOwner[id]];
    }

    function getAgentByAddress(address agentOwner) external view returns (AgentProfile memory) {
        return agents[agentOwner];
    }

    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].active;
    }

    /// @notice Owner can adjust the stake required for future registrations.
    function setStakeAmount(uint256 _stakeAmount) external onlyOwner {
        stakeAmount = _stakeAmount;
        emit StakeAmountUpdated(_stakeAmount);
    }
}
