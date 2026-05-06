/**
 * lib/escrow.js
 *
 * Shared helper that every API endpoint imports.
 * Provides:
 *   - getEscrowContract()  — returns a connected, signed contract instance
 *   - getUsdcContract()    — returns the USDC contract (for approvals)
 *   - authMiddleware()     — validates the x-api-key header from Salesforce
 *   - sendError() / sendOk() — uniform JSON response helpers
 *
 * The ABI is inlined here so the bridge folder stays independent
 * from the blockchain/ folder (no cross-folder imports needed on Vercel).
 */

const { ethers } = require("ethers");

// ─── Minimal ABI — only the functions the bridge calls ───────────────────────
// This is enough for ethers.js to encode/decode. Full ABI lives in
// blockchain/artifacts after compilation.

const ESCROW_ABI = [
  // Write functions (platform only)
  "function fundEscrow(string orderId, address buyer, address seller, uint256 amount, uint256 deadline) external",
  "function confirmDelivery(string orderId) external",
  "function freezeEscrow(string orderId) external",
  "function refundBuyer(string orderId) external",
  "function releaseFromFreeze(string orderId) external",
  "function extendDeadline(string orderId, uint256 newDeadline) external",
  "function refundExpired(string orderId) external",
  "function releasePayment(string orderId) external",
  "function buyerAcknowledge(string orderId) external",
  "function raiseDispute(string orderId) external",

  // Read functions (no gas)
  "function getEscrowState(string orderId) external view returns (uint8)",
  "function getEscrowAmount(string orderId) external view returns (uint256)",
  "function getEscrow(string orderId) external view returns (tuple(address buyer, address seller, uint256 amount, uint256 deadline, uint256 releaseAfter, uint8 state, uint256 fundedAt, uint256 deliveredAt))",

  // EscrowState enum mapping (for reference — not callable)
  // 0=NONE, 1=FUNDED, 2=DELIVERED, 3=DISPUTED, 4=FROZEN, 5=RELEASED, 6=REFUNDED

  // Events
  "event EscrowFunded(string indexed orderId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline)",
  "event DeliveryConfirmed(string indexed orderId, uint256 releaseAfter)",
  "event PaymentReleased(string indexed orderId, address indexed seller, uint256 amount)",
  "event BuyerRefunded(string indexed orderId, address indexed buyer, uint256 amount)",
  "event DisputeRaised(string indexed orderId)",
  "event EscrowFrozen(string indexed orderId)"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

// ─── Human-readable state labels ─────────────────────────────────────────────

const STATE_LABELS = {
  0: "NONE",
  1: "FUNDED",
  2: "DELIVERED",
  3: "DISPUTED",
  4: "FROZEN",
  5: "RELEASED",
  6: "REFUNDED"
};

// ─── Provider + Signer ───────────────────────────────────────────────────────

function getProvider() {
  const network = process.env.NETWORK || "amoy";
  if (network === "local") {
    // Local Hardhat node — no API key needed
    return new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  }
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) throw new Error("ALCHEMY_API_KEY not set");
  return new ethers.AlchemyProvider("matic-amoy", apiKey);
}

function getSigner() {
  const privateKey = process.env.PLATFORM_PRIVATE_KEY;
  if (!privateKey) throw new Error("PLATFORM_PRIVATE_KEY not set");
  return new ethers.Wallet(privateKey, getProvider());
}

// ─── Contract instances ──────────────────────────────────────────────────────

function getEscrowContract() {
  const address = process.env.ESCROW_CONTRACT_ADDRESS;
  if (!address) throw new Error("ESCROW_CONTRACT_ADDRESS not set");
  return new ethers.Contract(address, ESCROW_ABI, getSigner());
}

function getUsdcContract() {
  const address = process.env.USDC_CONTRACT_ADDRESS;
  if (!address) throw new Error("USDC_CONTRACT_ADDRESS not set");
  return new ethers.Contract(address, USDC_ABI, getSigner());
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
// Salesforce Named Credential sends: x-api-key: <BRIDGE_API_KEY>

function isAuthorised(req) {
  const expected = process.env.BRIDGE_API_KEY;
  if (!expected) return true; // no key configured → open dev mode
  return req.headers["x-api-key"] === expected;
}

// ─── Response helpers ────────────────────────────────────────────────────────

function sendOk(res, data) {
  res.status(200).json({ success: true, ...data });
}

function sendError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

// ─── CORS preflight helper ────────────────────────────────────────────────────

function handleCors(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = {
  getEscrowContract,
  getUsdcContract,
  getSigner,
  getProvider,
  isAuthorised,
  sendOk,
  sendError,
  handleCors,
  STATE_LABELS,
  ESCROW_ABI,
  USDC_ABI
};
