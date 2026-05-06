/**
 * POST /api/escrow/extend
 *
 * Called by Agentforce Delivery Delay Monitor when buyer agrees to
 * extend the delivery deadline by N days.
 *
 * Body:
 * {
 *   "orderId":     "00001012",
 *   "newDeadline": 1782000000    // New Unix timestamp (must be > current deadline)
 * }
 *
 * Effect: Updates deadline in FUNDED escrow. Buyer has more time to receive delivery.
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

  const { orderId, newDeadline } = req.body || {};
  if (!orderId || typeof orderId !== "string")
    return sendError(res, 400, "orderId is required");
  if (!newDeadline || isNaN(Number(newDeadline)))
    return sendError(res, 400, "newDeadline must be a Unix timestamp");

  try {
    const escrow = getEscrowContract();

    console.log(
      `[extend] Extending deadline for order ${orderId} to ${newDeadline}...`
    );
    const tx = await escrow.extendDeadline(orderId, BigInt(newDeadline));
    const receipt = await tx.wait();
    console.log(`[extend] Extended. tx: ${tx.hash}`);

    return sendOk(res, {
      orderId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      newDeadline: newDeadline
    });
  } catch (err) {
    console.error("[extend] Error:", err.message);
    return sendError(res, 500, err.message);
  }
};
