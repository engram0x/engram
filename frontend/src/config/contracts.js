import GramIDAbi from "../abi/GramID.json";
import GramScoreAbi from "../abi/GramScore.json";
import GramLinkAbi from "../abi/GramLink.json";

// Base network config. Engram targets Base only.
export const BASE_MAINNET = {
  chainId: 8453,
  chainIdHex: "0x2105",
  name: "Base",
  rpcUrl: "https://mainnet.base.org",
  explorer: "https://basescan.org",
  currency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

export const BASE_SEPOLIA = {
  chainId: 84532,
  chainIdHex: "0x14a34",
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  explorer: "https://sepolia.basescan.org",
  currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
};

// Active network the dApp expects. Switch to BASE_MAINNET for production.
export const ACTIVE_NETWORK = BASE_SEPOLIA;

// Deployed contract addresses. Populated automatically by scripts/deploy.js
// (which writes deployments/deployments.json). Fill these in after deploying.
export const CONTRACTS = {
  GramID: {
    address: "",
    abi: GramIDAbi,
  },
  GramScore: {
    address: "",
    abi: GramScoreAbi,
  },
  GramLink: {
    address: "",
    abi: GramLinkAbi,
  },
};

export const STAKE_AMOUNT_ETH = "0.001";

export const JOB_STATUS = ["OPEN", "ACTIVE", "COMPLETED", "FAILED", "DISPUTED"];

export function isDeployed() {
  return Boolean(
    CONTRACTS.GramID.address &&
      CONTRACTS.GramScore.address &&
      CONTRACTS.GramLink.address
  );
}
