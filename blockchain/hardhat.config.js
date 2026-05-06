require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Environment variables — never commit real values, use .env
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const DEPLOYER_PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    // ── Local development (npx hardhat node) ──────────────────────────────────
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },

    // ── Polygon Amoy testnet (free, faucet MATIC at faucet.polygon.technology) ─
    amoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts:
        DEPLOYER_PRIVATE_KEY !== "0x" + "0".repeat(64)
          ? [DEPLOYER_PRIVATE_KEY]
          : [],
      chainId: 80002,
      gasPrice: 25_000_000_000 // 25 gwei — fixed low price for testnet
    }
  },

  // Etherscan-compatible explorer for Polygon Amoy
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },

  // Gas reporter — shows cost of each function call in tests
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD"
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
