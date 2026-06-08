const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GramID", function () {
  let gramID, owner, alice, bob;
  const STAKE = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const GramID = await ethers.getContractFactory("GramID");
    gramID = await GramID.deploy();
    await gramID.waitForDeployment();
  });

  it("registers an agent and assigns a unique id", async function () {
    await expect(gramID.connect(alice).register("Alice", "ipfs://a", { value: STAKE }))
      .to.emit(gramID, "AgentRegistered")
      .withArgs(1, alice.address, "Alice");

    await expect(gramID.connect(bob).register("Bob", "ipfs://b", { value: STAKE }))
      .to.emit(gramID, "AgentRegistered")
      .withArgs(2, bob.address, "Bob");

    expect(await gramID.totalAgents()).to.equal(2);
    const a = await gramID.getAgent(1);
    expect(a.owner).to.equal(alice.address);
    expect(a.name).to.equal("Alice");
    expect(a.active).to.equal(true);
    expect(await gramID.isRegistered(alice.address)).to.equal(true);
  });

  it("reverts with insufficient stake", async function () {
    await expect(
      gramID.connect(alice).register("Alice", "x", { value: ethers.parseEther("0.0005") })
    ).to.be.revertedWith("GramID: insufficient stake");
  });

  it("reverts on duplicate registration", async function () {
    await gramID.connect(alice).register("Alice", "x", { value: STAKE });
    await expect(
      gramID.connect(alice).register("Alice2", "y", { value: STAKE })
    ).to.be.revertedWith("GramID: already registered");
  });

  it("deregisters and returns the stake", async function () {
    await gramID.connect(alice).register("Alice", "x", { value: STAKE });

    const balBefore = await ethers.provider.getBalance(alice.address);
    const tx = await gramID.connect(alice).deregister(1);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(alice.address);

    expect(balAfter).to.equal(balBefore + STAKE - gas);
    expect(await gramID.isRegistered(alice.address)).to.equal(false);
  });

  it("only owner can deregister", async function () {
    await gramID.connect(alice).register("Alice", "x", { value: STAKE });
    await expect(gramID.connect(bob).deregister(1)).to.be.revertedWith("GramID: not owner");
  });

  it("allows re-registration after deregister", async function () {
    await gramID.connect(alice).register("Alice", "x", { value: STAKE });
    await gramID.connect(alice).deregister(1);
    await expect(gramID.connect(alice).register("AliceAgain", "z", { value: STAKE }))
      .to.emit(gramID, "AgentRegistered")
      .withArgs(2, alice.address, "AliceAgain");
  });

  it("updates metadata only by owner", async function () {
    await gramID.connect(alice).register("Alice", "x", { value: STAKE });
    await expect(gramID.connect(alice).updateMetadata(1, "ipfs://new"))
      .to.emit(gramID, "MetadataUpdated")
      .withArgs(1, "ipfs://new");
    const a = await gramID.getAgentByAddress(alice.address);
    expect(a.metadata).to.equal("ipfs://new");

    await expect(gramID.connect(bob).updateMetadata(1, "hack")).to.be.revertedWith("GramID: not owner");
  });

  it("owner can update the stake amount", async function () {
    await gramID.connect(owner).setStakeAmount(ethers.parseEther("0.002"));
    expect(await gramID.stakeAmount()).to.equal(ethers.parseEther("0.002"));
    await expect(
      gramID.connect(alice).setStakeAmount(0)
    ).to.be.revertedWithCustomError(gramID, "OwnableUnauthorizedAccount");
  });
});
