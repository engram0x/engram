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
export const ACTIVE_NETWORK = BASE_MAINNET;

// Deployed contract addresses. Live on Base mainnet (chainId 8453),
// deployed 2026-06-11. Mirrors deployments/deployments.json.
export const CONTRACTS = {
  GramID: {
    address: "0x100b0b3335Ce56Aa32E37b6F2dec442Ca4375caf",
    abi: GramIDAbi,
  },
  GramScore: {
    address: "0xac79082D30be390b47De500e43947b3B9405283F",
    abi: GramScoreAbi,
  },
  GramLink: {
    address: "0x189A8cab846FF12e868681f2A4559b4fdB026A73",
    abi: GramLinkAbi,
  },
};

export const JOB_STATUS = ["OPEN", "ACTIVE", "COMPLETED", "FAILED", "DISPUTED"];

// Master switch for the dApp's on-chain calls. The contracts above are
// deployed on Base mainnet, but the dApp is not wired up for public use yet —
// keep this false so /app shows "deploying soon" instead of making reverting
// reads (which surface as CALL_EXCEPTION). Flip to true to go live.
export const CONTRACTS_LIVE = false;

export function isDeployed() {
  return (
    CONTRACTS_LIVE &&
    Boolean(
      CONTRACTS.GramID.address &&
        CONTRACTS.GramScore.address &&
        CONTRACTS.GramLink.address
    )
  );
}
