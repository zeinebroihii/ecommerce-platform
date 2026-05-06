/**
 * deploy.js — deploys MockUSDC + NexusEscrow to the target network.
 *
 * Usage:
 *   Local:   npx hardhat run scripts/deploy.js --network localhost
 *   Testnet: npx hardhat run scripts/deploy.js --network amoy
 *
 * After running, copy the printed addresses into your .env file.
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n========================================");
  console.log("  NexusEscrow Deployment");
  console.log("========================================");
  console.log("Network  :", hre.network.name);
  console.log("Deployer :", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance  :", hre.ethers.formatEther(balance), "MATIC\n");

  // ── Step 1: Deploy MockUSDC ──────────────────────────────────────────────────
  //
  // On testnet we deploy our own mock USDC.
  // On mainnet you would skip this and use Circle's real USDC address instead:
  //   Polygon mainnet USDC: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
  //
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✓ MockUSDC deployed to:", usdcAddress);

  // ── Step 2: Deploy NexusEscrow ───────────────────────────────────────────────
  //
  // Constructor args:
  //   _usdc     — the USDC token contract address
  //   _platform — the Vercel backend wallet address (can be updated later via owner)
  //
  // On testnet we use the deployer as the platform wallet for simplicity.
  // In production, use a separate dedicated wallet.

  const platformAddress = deployer.address; // Replace with a dedicated wallet in prod

  console.log("\nDeploying NexusEscrow...");
  console.log("  USDC address    :", usdcAddress);
  console.log("  Platform wallet :", platformAddress);

  const NexusEscrow = await hre.ethers.getContractFactory("NexusEscrow");
  const escrow = await NexusEscrow.deploy(usdcAddress, platformAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✓ NexusEscrow deployed to:", escrowAddress);

  // ── Step 3: Verify safety delay ──────────────────────────────────────────────

  const safetyDelay = await escrow.safetyDelay();
  console.log(
    "\n  Safety delay :",
    safetyDelay.toString(),
    "seconds (",
    Number(safetyDelay) / 3600,
    "hours )"
  );

  // ── Step 4: Print .env values ────────────────────────────────────────────────

  console.log("\n========================================");
  console.log("  Copy these values into your .env files");
  console.log("========================================");
  console.log(`USDC_CONTRACT_ADDRESS=${usdcAddress}`);
  console.log(`ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log("========================================\n");

  // ── Step 5: Verify on Polygonscan (only on public networks) ─────────────────

  if (hre.network.name === "amoy" && process.env.POLYGONSCAN_API_KEY) {
    console.log("Waiting 30 s for Polygonscan to index...");
    await new Promise((r) => setTimeout(r, 30_000));

    console.log("Verifying MockUSDC...");
    await hre.run("verify:verify", {
      address: usdcAddress,
      constructorArguments: []
    });

    console.log("Verifying NexusEscrow...");
    await hre.run("verify:verify", {
      address: escrowAddress,
      constructorArguments: [usdcAddress, platformAddress]
    });

    console.log("✓ Contracts verified on Polygonscan");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
