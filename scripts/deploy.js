const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying Engram protocol to "${network}" with ${deployer.address}`);

  // 1. GramID
  const GramID = await hre.ethers.getContractFactory("GramID");
  const gramID = await GramID.deploy();
  await gramID.waitForDeployment();
  const gramIDAddress = await gramID.getAddress();
  console.log("GramID deployed:", gramIDAddress);

  // 2. GramScore
  const GramScore = await hre.ethers.getContractFactory("GramScore");
  const gramScore = await GramScore.deploy();
  await gramScore.waitForDeployment();
  const gramScoreAddress = await gramScore.getAddress();
  console.log("GramScore deployed:", gramScoreAddress);

  // 3. GramLink (needs GramID + GramScore addresses)
  const GramLink = await hre.ethers.getContractFactory("GramLink");
  const gramLink = await GramLink.deploy(gramIDAddress, gramScoreAddress);
  await gramLink.waitForDeployment();
  const gramLinkAddress = await gramLink.getAddress();
  console.log("GramLink deployed:", gramLinkAddress);

  // 4. Wire GramScore -> GramLink
  const tx = await gramScore.setGramLink(gramLinkAddress);
  await tx.wait();
  console.log("GramScore.setGramLink ->", gramLinkAddress);

  const deployment = {
    network,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    GramID: gramIDAddress,
    GramScore: gramScoreAddress,
    GramLink: gramLinkAddress,
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "deployments.json"),
    JSON.stringify(deployment, null, 2)
  );
  console.log("Saved deployments/deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
