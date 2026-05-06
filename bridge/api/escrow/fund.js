/**
 * POST /api/escrow/fund
 *
 * Called by the Vercel backend (Transak webhook handler) when a buyer's
 * card payment is confirmed and USDC has arrived in the platform wallet.
 *
 * Body:
 * {
 *   "orderId":  "00001012",           // Salesforce Order Number
 *   "buyer":    "0xBuyerAddress",     // Managed by platform (invisible UX)
 *   "seller":   "0xSellerAddress",    // Platform/company wallet
 *   "amount":   "10000000000",        // USDC amount in smallest unit (6 decimals)
 *                                     // e.g. 10000 USDC = 10000 * 10^6 = 10000000000
 *   "deadline": 1780000000            // Unix timestamp for delivery deadline
 * }
 *
 * Steps performed:
 *   1. Validate input
 *   2. Approve escrow contract to spend USDC from platform wallet
 *   3. Call escrow.fundEscrow(...)
 *   4. Return transaction hash
 */

const {
  getEscrowContract,
  getUsdcContract,
  isAuthorised,
  sendOk,
  sendError,
  handleCors
} = require("../../lib/escrow");

const { ethers } = require("ethers");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (!isAuthorised(req)) return sendError(res, 401, "Unauthorized");
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  const { orderId, buyer, seller, amount, deadline } = req.body || {};

  // ── Input validation ──────────────────────────────────────────────────────
  if (!orderId || typeof orderId !== "string")
    return sendError(res, 400, "orderId is required");
  if (!buyer || !ethers.isAddress(buyer))
    return sendError(res, 400, "buyer must be a valid Ethereum address");
  if (!seller || !ethers.isAddress(seller))
    return sendError(res, 400, "seller must be a valid Ethereum address");
  if (!amount || isNaN(Number(amount)) || BigInt(amount) <= 0n)
    return sendError(
      res,
      400,
      "amount must be a positive integer (USDC in 6-decimal units)"
    );
  if (
    !deadline ||
    isNaN(Number(deadline)) ||
    Number(deadline) <= Date.now() / 1000
  )
    return sendError(res, 400, "deadline must be a future Unix timestamp");

  try {
    const usdc = getUsdcContract();
    const escrow = getEscrowContract();
    const amt = BigInt(amount);

    // ── Step 1: Approve escrow contract to pull USDC from platform wallet ────
    console.log(`[fund] Approving ${amount} USDC for escrow contract...`);
    const approveTx = await usdc.approve(await escrow.getAddress(), amt);
    await approveTx.wait();
    console.log(`[fund] Approval tx: ${approveTx.hash}`);

    // ── Step 2: Call fundEscrow on-chain ─────────────────────────────────────
    console.log(`[fund] Funding escrow for order ${orderId}...`);
    const fundTx = await escrow.fundEscrow(
      orderId,
      buyer,
      seller,
      amt,
      BigInt(deadline)
    );
    const receipt = await fundTx.wait();
    console.log(
      `[fund] Funded. tx: ${fundTx.hash}, block: ${receipt.blockNumber}`
    );

    return sendOk(res, {
      orderId,
      txHash: fundTx.hash,
      blockNumber: receipt.blockNumber,
      amount: amount,
      deadline: deadline
    });
  } catch (err) {
    console.error("[fund] Error:", err.message);
    return sendError(res, 500, err.message);
  }
};
