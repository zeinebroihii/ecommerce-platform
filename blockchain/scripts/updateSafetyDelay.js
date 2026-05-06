/**
 * updateSafetyDelay.js
 * Sets the escrow safety delay to 5 minutes for testing.
 * Run: npx hardhat run scripts/updateSafetyDelay.js --network amoy
 */
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const address = process.env.ESCROW_CONTRACT_ADDRESS;
  if (!address) throw new Error("ESCROW_CONTRACT_ADDRESS not set in .env");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const escrow = await ethers.getContractAt("NexusEscrow", address, signer);

  const current = await escrow.safetyDelay();
  console.log("Current safetyDelay:", current.toString(), "seconds");

  const FIVE_MINUTES = 5 * 60; // 300 seconds
  const tx = await escrow.updateSafetyDelay(FIVE_MINUTES);
  console.log("Tx sent:", tx.hash);
  await tx.wait();

  const updated = await escrow.safetyDelay();
  console.log(
    "New safetyDelay:",
    updated.toString(),
    "seconds (",
    Number(updated) / 60,
    "minutes )"
  );
  console.log("Done ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
