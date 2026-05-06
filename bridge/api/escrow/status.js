/**
 * GET /api/escrow/status?orderId=00001012
 *
 * Polled by the nexusOrderSystem LWC (via Apex callout) to show
 * the real-time escrow state inside the Order Detail Modal.
 *
 * No auth required — read-only, no state change, no private key needed.
 * (You can add auth if you want to restrict visibility.)
 *
 * Response:
 * {
 *   "success": true,
 *   "orderId": "00001012",
 *   "state":   2,
 *   "stateLabel": "DELIVERED",
 *   "amount":  "10000000000",
 *   "amountUsdc": "10000.00",
 *   "releaseAfter": 1780086400,
 *   "deadline": 1780000000,
 *   "canRelease": false,
 *   "secondsUntilRelease": 3540
 * }
 */

const {
  getEscrowContract,
  getProvider,
  sendOk,
  sendError,
  handleCors,
  STATE_LABELS
} = require("../../lib/escrow");

const { ethers } = require("ethers");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const orderId = req.query?.orderId;
  if (!orderId || typeof orderId !== "string")
    return sendError(res, 400, "orderId query param is required");

  try {
    const escrow = getEscrowContract();
    const data = await escrow.getEscrow(orderId);

    const state = Number(data.state);
    const stateLabel = STATE_LABELS[state] ?? "UNKNOWN";
    const amount = data.amount.toString();
    const releaseAfter = Number(data.releaseAfter);
    const deadline = Number(data.deadline);
    const nowSec = Math.floor(Date.now() / 1000);

    // Convert amount from 6-decimal USDC units to human-readable
    const amountUsdc = (Number(data.amount) / 1_000_000).toFixed(2);
    const canRelease = state === 2 && nowSec >= releaseAfter; // DELIVERED + delay passed
    const secondsUntilRelease =
      state === 2 && releaseAfter > nowSec ? releaseAfter - nowSec : 0;

    return sendOk(res, {
      orderId,
      state,
      stateLabel,
      amount,
      amountUsdc,
      releaseAfter,
      deadline,
      canRelease,
      secondsUntilRelease,
      buyer: data.buyer,
      seller: data.seller
    });
  } catch (err) {
    console.error("[status] Error:", err.message);
    return sendError(res, 500, err.message);
  }
};
