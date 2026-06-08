require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const BASE_RPC = process.env.BASE_RPC || "https://mainnet.base.org";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    tests: "./contracts/test",
  },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      chainId: 84532,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    base: {
      url: BASE_RPC,
      chainId: 8453,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: BASESCAN_API_KEY,
      base: BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
};
