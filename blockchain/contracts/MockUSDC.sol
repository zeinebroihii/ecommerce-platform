// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * MockUSDC — test-only ERC20 that mimics USDC (6 decimals).
 * Only used on local hardhat node and Polygon Amoy testnet.
 * On mainnet/production, the real USDC contract address is used instead.
 */
contract MockUSDC is ERC20, Ownable {

    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // Mint 1,000,000 USDC (6 decimals) to the deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // 6 decimals — same as real USDC
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // Anyone can mint on testnet — used to fund test buyer wallets
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
