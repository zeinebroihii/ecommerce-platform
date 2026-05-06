/**
 * POST /api/escrow/release
 *
 * Two scenarios trigger this endpoint:
 *   A) Scheduled Apex job fires after 24 h safety delay passes (auto-release)
 *   B) Buyer clicks "Confirm Receipt" in the portal (immediate release)
 *
 * For scenario B, the portal LWC calls this endpoint directly via a
 * Salesforce Apex action (not directly from the browser — keeps private key safe).
 *
 * Body: { "orderId": "00001012", "fromFreeze": false }
 *   fromFreeze: true  → calls releaseFromFreeze (FROZEN → RELEASED, seller wins dispute)
 *   fromFreeze: false → calls releasePayment    (DELIVERED → RELEASED, normal flow)
 *
 * Effect: USDC transferred to seller wallet.
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

  const { orderId, fromFreeze } = req.body || {};
  if (!orderId || typeof orderId !== "string")
    return sendError(res, 400, "orderId is required");

  try {
    const escrow = getEscrowContract();

    let tx;
    if (fromFreeze) {
      console.log(`[release] Releasing from freeze for order ${orderId}...`);
      tx = await escrow.releaseFromFreeze(orderId);
    } else {
      console.log(`[release] Releasing payment for order ${orderId}...`);
      tx = await escrow.releasePayment(orderId);
    }

    const receipt = await tx.wait();
    console.log(`[release] Released. tx: ${tx.hash}`);

    return sendOk(res, {
      orderId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      fromFreeze: !!fromFreeze
    });
  } catch (err) {
    console.error("[release] Error:", err.message);
    return sendError(res, 500, err.message);
  }
};
