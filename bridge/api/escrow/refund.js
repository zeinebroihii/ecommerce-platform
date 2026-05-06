/**
 * POST /api/escrow/refund
 *
 * Two scenarios:
 *   A) Admin resolves dispute in buyer's favour → refund from DISPUTED/FROZEN
 *   B) Delivery deadline exceeded, no delivery confirmed → refund expired order
 *
 * Body:
 * {
 *   "orderId":  "00001012",
 *   "expired":  false       // true = deadline-expired refund, false = dispute refund
 * }
 *
 * Effect: USDC returned to buyer wallet.
 */

const {
  getEscrowContract,
  isAuthorised,
  sendOk,
  sendError,
  handleCors
} = require("../../lib/escrow");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (!isAuthorised(req)) return sendError(res, 401, "Unauthorized");
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  const { orderId, expired } = req.body || {};
  if (!orderId || typeof orderId !== "string")
    return sendError(res, 400, "orderId is required");

  try {
    const escrow = getEscrowContract();

    let tx;
    if (expired) {
      console.log(`[refund] Refunding expired order ${orderId}...`);
      tx = await escrow.refundExpired(orderId);
    } else {
      console.log(`[refund] Refunding buyer for disputed order ${orderId}...`);
      tx = await escrow.refundBuyer(orderId);
    }

    const receipt = await tx.wait();
    console.log(`[refund] Refunded. tx: ${tx.hash}`);

    return sendOk(res, {
      orderId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      reason: expired ? "deadline_expired" : "dispute_resolved"
    });
  } catch (err) {
    console.error("[refund] Error:", err.message);
    return sendError(res, 500, err.message);
  }
};
