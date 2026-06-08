const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GramLink", function () {
  let gramID, gramScore, gramLink;
  let owner, hirer, worker, stranger;
  const STAKE = ethers.parseEther("0.001");
  const PAYMENT = ethers.parseEther("1");
  const HIRER_ID = 1;
  const WORKER_ID = 2;

  beforeEach(async function () {
    [owner, hirer, worker, stranger] = await ethers.getSigners();

    const GramID = await ethers.getContractFactory("GramID");
    gramID = await GramID.deploy();
    await gramID.waitForDeployment();

    const GramScore = await ethers.getContractFactory("GramScore");
    gramScore = await GramScore.deploy();
    await gramScore.waitForDeployment();

    const GramLink = await ethers.getContractFactory("GramLink");
    gramLink = await GramLink.deploy(await gramID.getAddress(), await gramScore.getAddress());
    await gramLink.waitForDeployment();

    await gramScore.connect(owner).setGramLink(await gramLink.getAddress());

    // register hirer (id 1) and worker (id 2)
    await gramID.connect(hirer).register("Hirer", "x", { value: STAKE });
    await gramID.connect(worker).register("Worker", "y", { value: STAKE });
  });

  async function createJob() {
    const tx = await gramLink
      .connect(hirer)
      .createJob(HIRER_ID, WORKER_ID, "task://hash", { value: PAYMENT });
    await tx.wait();
    return 1;
  }

  it("creates a job, escrows payment, indexes both agents", async function () {
    await expect(
      gramLink.connect(hirer).createJob(HIRER_ID, WORKER_ID, "task://hash", { value: PAYMENT })
    )
      .to.emit(gramLink, "JobCreated")
      .withArgs(1, HIRER_ID, WORKER_ID, PAYMENT);

    const job = await gramLink.getJob(1);
    expect(job.payment).to.equal(PAYMENT);
    expect(job.status).to.equal(0); // OPEN
    expect(await ethers.provider.getBalance(await gramLink.getAddress())).to.equal(PAYMENT);
    expect(await gramLink.getJobsByAgent(HIRER_ID)).to.deep.equal([1n]);
    expect(await gramLink.getJobsByAgent(WORKER_ID)).to.deep.equal([1n]);
  });

  it("rejects job with no payment or unregistered agents", async function () {
    await expect(
      gramLink.connect(hirer).createJob(HIRER_ID, WORKER_ID, "t", { value: 0 })
    ).to.be.revertedWith("GramLink: payment required");

    await expect(
      gramLink.connect(hirer).createJob(HIRER_ID, 999, "t", { value: PAYMENT })
    ).to.be.revertedWith("GramLink: worker not registered");

    await expect(
      gramLink.connect(stranger).createJob(HIRER_ID, WORKER_ID, "t", { value: PAYMENT })
    ).to.be.revertedWith("GramLink: not hirer owner");
  });

  it("worker accepts the job", async function () {
    await createJob();
    await expect(gramLink.connect(worker).acceptJob(1)).to.emit(gramLink, "JobAccepted").withArgs(1);
    expect((await gramLink.getJob(1)).status).to.equal(1); // ACTIVE

    await expect(gramLink.connect(stranger).acceptJob(1)).to.be.revertedWith("GramLink: not worker");
  });

  it("completes job: pays worker minus fee, updates scores", async function () {
    await createJob();
    await gramLink.connect(worker).acceptJob(1);

    const fee = (PAYMENT * 250n) / 10000n;
    const workerAmount = PAYMENT - fee;

    const balBefore = await ethers.provider.getBalance(worker.address);
    const tx = await gramLink.connect(worker).completeJob(1, "result://hash");
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(worker.address);

    expect(balAfter).to.equal(balBefore + workerAmount - gas);
    expect(await gramLink.accruedFees()).to.equal(fee);

    expect(await gramScore.getScore(WORKER_ID)).to.equal(10);
    expect(await gramScore.getScore(HIRER_ID)).to.equal(2);
    const [, completed] = await gramScore.getStats(WORKER_ID);
    expect(completed).to.equal(1);

    const job = await gramLink.getJob(1);
    expect(job.status).to.equal(2); // COMPLETED
    expect(job.resultHash).to.equal("result://hash");
  });

  it("cannot complete a job that is not active", async function () {
    await createJob();
    await expect(gramLink.connect(worker).completeJob(1, "r")).to.be.revertedWith("GramLink: not active");
  });

  it("fails job: refunds hirer, penalizes worker", async function () {
    await createJob();
    await gramLink.connect(worker).acceptJob(1);

    const balBefore = await ethers.provider.getBalance(hirer.address);
    const tx = await gramLink.connect(hirer).failJob(1);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(hirer.address);

    expect(balAfter).to.equal(balBefore + PAYMENT - gas);
    expect(await gramScore.getScore(WORKER_ID)).to.equal(0); // floored
    const [, , failed] = await gramScore.getStats(WORKER_ID);
    expect(failed).to.equal(1);
    expect((await gramLink.getJob(1)).status).to.equal(3); // FAILED

    await expect(gramLink.connect(stranger).failJob(1)).to.be.reverted;
  });

  it("dispute flow: either party disputes, owner resolves for worker", async function () {
    await createJob();
    await gramLink.connect(worker).acceptJob(1);

    await expect(gramLink.connect(worker).disputeJob(1)).to.emit(gramLink, "JobDisputed").withArgs(1);
    expect((await gramLink.getJob(1)).status).to.equal(4); // DISPUTED

    const fee = (PAYMENT * 250n) / 10000n;
    const balBefore = await ethers.provider.getBalance(worker.address);
    await gramLink.connect(owner).resolveDispute(1, true);
    const balAfter = await ethers.provider.getBalance(worker.address);

    expect(balAfter).to.equal(balBefore + (PAYMENT - fee));
    expect(await gramScore.getScore(WORKER_ID)).to.equal(10);
    expect((await gramLink.getJob(1)).status).to.equal(2); // COMPLETED
  });

  it("dispute resolved against worker refunds hirer", async function () {
    await createJob();
    await gramLink.connect(worker).acceptJob(1);
    await gramLink.connect(hirer).disputeJob(1);

    const balBefore = await ethers.provider.getBalance(hirer.address);
    await gramLink.connect(owner).resolveDispute(1, false);
    const balAfter = await ethers.provider.getBalance(hirer.address);

    expect(balAfter).to.equal(balBefore + PAYMENT);
    expect((await gramLink.getJob(1)).status).to.equal(3); // FAILED

    await expect(
      gramLink.connect(stranger).resolveDispute(1, true)
    ).to.be.revertedWithCustomError(gramLink, "OwnableUnauthorizedAccount");
  });

  it("owner withdraws accrued protocol fees", async function () {
    await createJob();
    await gramLink.connect(worker).acceptJob(1);
    await gramLink.connect(worker).completeJob(1, "r");

    const fee = (PAYMENT * 250n) / 10000n;
    const balBefore = await ethers.provider.getBalance(owner.address);
    const tx = await gramLink.connect(owner).withdrawProtocolFees();
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(owner.address);

    expect(balAfter).to.equal(balBefore + fee - gas);
    expect(await gramLink.accruedFees()).to.equal(0);

    await expect(gramLink.connect(owner).withdrawProtocolFees()).to.be.revertedWith("GramLink: no fees");
  });
});
