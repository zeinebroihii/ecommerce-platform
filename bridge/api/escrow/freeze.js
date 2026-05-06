/**
 * POST /api/escrow/freeze
 *
 * Called by the Agentforce Dispute Handler topic (via Salesforce Apex action)
 * when a case is opened with dispute keywords (broken/missing/wrong).
 *
 * Body: { "orderId": "00001012" }
 *
 * Effect: FUNDED | DELIVERED | DISPUTED → FROZEN
 * Funds are locked. No release until admin resolves.
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

  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== "string")
    return sendError(res, 400, "orderId is required");

  try {
    const escrow = getEscrowContract();

    console.log(`[freeze] Freezing escrow for order ${orderId}...`);
    const tx = await escrow.freezeEscrow(orderId);
    const receipt = await tx.wait();
    console.log(`[freeze] Frozen. tx: ${tx.hash}`);

    return sendOk(res, {
      orderId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("[freeze] Error:", err.message);
    return sendError(res, 500, err.message);
  }
};
