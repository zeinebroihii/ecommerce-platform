/**
 * POST /api/escrow/confirm
 *
 * Called by Salesforce Apex (EscrowBridgeController.confirmDelivery)
 * when an Order record's Status field changes to "Delivered".
 *
 * Body: { "orderId": "00001012" }
 *
 * Effect on contract: FUNDED → DELIVERED, starts 24 h safety delay.
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

    console.log(`[confirm] Confirming delivery for order ${orderId}...`);
    const tx = await escrow.confirmDelivery(orderId);
    const receipt = await tx.wait();
    console.log(`[confirm] Confirmed. tx: ${tx.hash}`);

    return sendOk(res, {
      orderId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("[confirm] Error:", err.message);
    return sendError(res, 500, err.message);
  }
};
