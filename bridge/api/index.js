const { handleCors } = require("../lib/escrow");

module.exports = (req, res) => {
  if (handleCors(req, res)) return;
  res.status(200).json({
    service: "Nexus Escrow Bridge",
    version: "1.0.0",
    status: "ok",
    endpoints: [
      "POST /api/escrow/fund",
      "POST /api/escrow/confirm",
      "POST /api/escrow/freeze",
      "POST /api/escrow/release",
      "POST /api/escrow/refund",
      "GET  /api/escrow/status"
    ]
  });
};
