const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GramScore", function () {
  let gramScore, owner, link, other;

  beforeEach(async function () {
    [owner, link, other] = await ethers.getSigners();
    const GramScore = await ethers.getContractFactory("GramScore");
    gramScore = await GramScore.deploy();
    await gramScore.waitForDeployment();
    // use `link` EOA as the GramLink address so we can call gated functions directly
    await gramScore.connect(owner).setGramLink(link.address);
  });

  it("only owner can set gramLink", async function () {
    await expect(
      gramScore.connect(other).setGramLink(other.address)
    ).to.be.revertedWithCustomError(gramScore, "OwnableUnauthorizedAccount");
  });

  it("increases score only via gramLink", async function () {
    await expect(gramScore.connect(link).increaseScore(1, 10))
      .to.emit(gramScore, "ScoreUpdated")
      .withArgs(1, 10);
    expect(await gramScore.getScore(1)).to.equal(10);

    await expect(gramScore.connect(other).increaseScore(1, 10)).to.be.revertedWith(
      "GramScore: only GramLink"
    );
  });

  it("decreases score and floors at zero", async function () {
    await gramScore.connect(link).increaseScore(1, 8);
    await gramScore.connect(link).decreaseScore(1, 5);
    expect(await gramScore.getScore(1)).to.equal(3);

    await gramScore.connect(link).decreaseScore(1, 100);
    expect(await gramScore.getScore(1)).to.equal(0);
  });

  it("owner can slash, others cannot", async function () {
    await gramScore.connect(link).increaseScore(1, 20);
    await expect(gramScore.connect(owner).slash(1, 7))
      .to.emit(gramScore, "AgentSlashed")
      .withArgs(1, 7);
    expect(await gramScore.getScore(1)).to.equal(13);

    await expect(
      gramScore.connect(other).slash(1, 1)
    ).to.be.revertedWithCustomError(gramScore, "OwnableUnauthorizedAccount");
  });

  it("tracks job counters via gramLink and reports stats", async function () {
    await gramScore.connect(link).increaseScore(1, 10);
    await gramScore.connect(link).recordJobCompleted(1);
    await gramScore.connect(link).recordJobCompleted(1);
    await gramScore.connect(link).recordJobFailed(1);

    const [score, completed, failed] = await gramScore.getStats(1);
    expect(score).to.equal(10);
    expect(completed).to.equal(2);
    expect(failed).to.equal(1);

    await expect(gramScore.connect(other).recordJobCompleted(1)).to.be.revertedWith(
      "GramScore: only GramLink"
    );
  });

  it("records reputation history", async function () {
    await gramScore.connect(link).increaseScore(1, 10);
    await gramScore.connect(link).decreaseScore(1, 5);
    expect(await gramScore.getHistoryLength(1)).to.equal(2);
  });
});
