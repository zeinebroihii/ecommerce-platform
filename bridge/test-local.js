/**
 * test-local.js — end-to-end test against local Hardhat node
 * Run: node test-local.js
 *
 * Tests the full escrow lifecycle:
 *   fund → confirmDelivery → releasePayment
 */

require("dotenv").config();
const { ethers } = require("ethers");

const ESCROW_ABI = [
  "function fundEscrow(string orderId, address buyer, address seller, uint256 amount, uint256 deadline) external",
  "function confirmDelivery(string orderId) external",
  "function releasePayment(string orderId) external",
  "function getEscrow(string orderId) external view returns (tuple(address buyer, address seller, uint256 amount, uint256 deadline, uint256 releaseAfter, uint8 state, uint256 fundedAt, uint256 deliveredAt))",
  "function updateSafetyDelay(uint256 newDelaySeconds) external",
  "function getEscrowState(string orderId) external view returns (uint8)"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];

const STATE_LABELS = [
  "NONE",
  "FUNDED",
  "DELIVERED",
  "DISPUTED",
  "FROZEN",
  "RELEASED",
  "REFUNDED"
];

async function main() {
  console.log("\n═══════════════════════════════════════════");
  console.log("  NexusEscrow — Local End-to-End Test");
  console.log("═══════════════════════════════════════════\n");

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const accounts = await provider.listAccounts();

  // Use Hardhat account #0 as platform (deployer), #1 as buyer, #2 as seller
  const platform = await provider.getSigner(0);
  const buyer = await provider.getSigner(1);
  const seller = await provider.getSigner(2);

  console.log("Platform :", await platform.getAddress());
  console.log("Buyer    :", await buyer.getAddress());
  console.log("Seller   :", await seller.getAddress());

  const escrow = new ethers.Contract(
    process.env.ESCROW_CONTRACT_ADDRESS,
    ESCROW_ABI,
    platform
  );
  const usdc = new ethers.Contract(
    process.env.USDC_CONTRACT_ADDRESS,
    USDC_ABI,
    platform
  );

  const orderId = "TEST-ORDER-001";
  const amount = BigInt(10_000 * 1_000_000); // 10,000 USDC (6 decimals)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600); // 7 days from now

  // ── Step 0: Set safety delay to 0 for instant testing ───────────────────────
  console.log("\n[0] Setting safety delay to 0 seconds for testing...");
  await (await escrow.updateSafetyDelay(0)).wait();
  console.log("    ✓ Safety delay set to 0");

  // ── Step 1: Check USDC balance ───────────────────────────────────────────────
  const bal = await usdc.balanceOf(await platform.getAddress());
  console.log(
    "\n[1] Platform USDC balance:",
    (Number(bal) / 1_000_000).toFixed(2),
    "USDC"
  );

  // ── Step 2: Approve escrow contract to spend USDC ───────────────────────────
  console.log("\n[2] Approving escrow contract to spend USDC...");
  await (
    await usdc.approve(process.env.ESCROW_CONTRACT_ADDRESS, amount)
  ).wait();
  console.log("    ✓ Approved", Number(amount) / 1_000_000, "USDC");

  // ── Step 3: Fund escrow ──────────────────────────────────────────────────────
  console.log("\n[3] Funding escrow for order", orderId, "...");
  await (
    await escrow.fundEscrow(
      orderId,
      await buyer.getAddress(),
      await seller.getAddress(),
      amount,
      deadline
    )
  ).wait();

  let state = await escrow.getEscrowState(orderId);
  console.log("    ✓ State:", STATE_LABELS[Number(state)]); // FUNDED

  // ── Step 4: Confirm delivery ─────────────────────────────────────────────────
  console.log("\n[4] Confirming delivery (sales marks order Delivered)...");
  await (await escrow.confirmDelivery(orderId)).wait();

  state = await escrow.getEscrowState(orderId);
  console.log("    ✓ State:", STATE_LABELS[Number(state)]); // DELIVERED

  // ── Step 5: Release payment (safety delay = 0 so immediate) ─────────────────
  console.log("\n[5] Releasing payment to seller...");
  await (await escrow.releasePayment(orderId)).wait();

  state = await escrow.getEscrowState(orderId);
  console.log("    ✓ State:", STATE_LABELS[Number(state)]); // RELEASED

  // ── Step 6: Check seller received USDC ──────────────────────────────────────
  const sellerBal = await usdc.balanceOf(await seller.getAddress());
  console.log(
    "\n[6] Seller USDC balance:",
    (Number(sellerBal) / 1_000_000).toFixed(2),
    "USDC"
  );

  console.log("\n═══════════════════════════════════════════");
  console.log("  ALL STEPS PASSED — Escrow works correctly");
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n✗ TEST FAILED:", err.message);
  process.exit(1);
});
