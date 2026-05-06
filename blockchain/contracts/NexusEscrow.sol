// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * NexusEscrow — B2B USDC escrow for Nexus e-commerce platform.
 *
 * Flow per order:
 *   NONE → FUNDED → DELIVERED → RELEASED
 *                ↘ DISPUTED  → FROZEN → RELEASED | REFUNDED
 *                ↘ EXPIRED   (auto-refund via refundExpired)
 *
 * "Platform" = the Vercel backend wallet. It is the only address
 * authorised to call privileged functions (confirmDelivery, freeze, etc.).
 * The contract owner (deployer) can rotate the platform address if needed.
 */
contract NexusEscrow is ReentrancyGuard, Ownable {

    // ─── State machine ──────────────────────────────────────────────────────────

    enum EscrowState {
        NONE,       // Order not yet registered
        FUNDED,     // USDC locked — waiting for delivery
        DELIVERED,  // Sales confirmed delivery — 24 h safety delay running
        DISPUTED,   // Buyer reported an issue — payment blocked
        FROZEN,     // Agentforce froze while reviewing dispute
        RELEASED,   // USDC transferred to seller — terminal
        REFUNDED    // USDC returned to buyer — terminal
    }

    // ─── Data ────────────────────────────────────────────────────────────────────

    struct EscrowData {
        address buyer;        // Buyer's address (managed by platform for invisible UX)
        address seller;       // Seller's address (platform/company wallet)
        uint256 amount;       // USDC amount (USDC has 6 decimals)
        uint256 deadline;     // Unix timestamp: delivery must happen before this
        uint256 releaseAfter; // Unix timestamp: earliest moment funds can be released
        EscrowState state;
        uint256 fundedAt;
        uint256 deliveredAt;
    }

    IERC20  public immutable usdc;
    address public platform;
    uint256 public safetyDelay = 24 hours;

    // orderId is the Salesforce Order Number (e.g. "00001012")
    mapping(string => EscrowData) private _escrows;

    // ─── Events (immutable audit trail on-chain) ─────────────────────────────────

    event EscrowFunded(
        string  indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 deadline
    );
    event DeliveryConfirmed(string indexed orderId, uint256 releaseAfter);
    event BuyerAcknowledged(string indexed orderId);
    event PaymentReleased(string indexed orderId, address indexed seller, uint256 amount);
    event BuyerRefunded(string indexed orderId, address indexed buyer, uint256 amount);
    event DisputeRaised(string indexed orderId);
    event EscrowFrozen(string indexed orderId);
    event DeadlineExtended(string indexed orderId, uint256 newDeadline);
    event PlatformUpdated(address indexed oldPlatform, address indexed newPlatform);
    event SafetyDelayUpdated(uint256 oldDelay, uint256 newDelay);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyPlatform() {
        require(msg.sender == platform, "NexusEscrow: caller is not the platform");
        _;
    }

    modifier inState(string calldata orderId, EscrowState expected) {
        require(
            _escrows[orderId].state == expected,
            "NexusEscrow: invalid escrow state for this action"
        );
        _;
    }

    modifier orderExists(string calldata orderId) {
        require(
            _escrows[orderId].state != EscrowState.NONE,
            "NexusEscrow: order does not exist"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(address _usdc, address _platform) Ownable(msg.sender) {
        require(_usdc    != address(0), "NexusEscrow: zero USDC address");
        require(_platform != address(0), "NexusEscrow: zero platform address");
        usdc     = IERC20(_usdc);
        platform = _platform;
    }

    // ─── STEP 1 — Fund ───────────────────────────────────────────────────────────
    //
    // Called by the Vercel backend (platform wallet) AFTER Transak delivers USDC
    // to the platform wallet and the platform wallet has approved this contract.
    //
    // Sequence:
    //   1. Transak sends USDC to platform wallet
    //   2. Vercel calls usdc.approve(escrowContract, amount) from platform wallet
    //   3. Vercel calls fundEscrow(...)

    function fundEscrow(
        string  calldata orderId,
        address buyer,
        address seller,
        uint256 amount,
        uint256 deadline
    )
        external
        onlyPlatform
        nonReentrant
    {
        require(_escrows[orderId].state == EscrowState.NONE, "NexusEscrow: order already funded");
        require(amount   > 0,                 "NexusEscrow: amount must be > 0");
        require(deadline > block.timestamp,   "NexusEscrow: deadline must be in the future");
        require(buyer  != address(0),         "NexusEscrow: zero buyer address");
        require(seller != address(0),         "NexusEscrow: zero seller address");

        // Pull USDC from platform wallet into this contract
        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        require(ok, "NexusEscrow: USDC transferFrom failed");

        _escrows[orderId] = EscrowData({
            buyer:        buyer,
            seller:       seller,
            amount:       amount,
            deadline:     deadline,
            releaseAfter: 0,
            state:        EscrowState.FUNDED,
            fundedAt:     block.timestamp,
            deliveredAt:  0
        });

        emit EscrowFunded(orderId, buyer, seller, amount, deadline);
    }

    // ─── STEP 2a — Confirm Delivery ──────────────────────────────────────────────
    //
    // Called by Vercel when the Salesforce Apex trigger fires on
    // Order.Status changing to "Delivered".
    // Starts the 24 h safety delay.

    function confirmDelivery(string calldata orderId)
        external
        onlyPlatform
        inState(orderId, EscrowState.FUNDED)
    {
        EscrowData storage e = _escrows[orderId];
        e.state        = EscrowState.DELIVERED;
        e.deliveredAt  = block.timestamp;
        e.releaseAfter = block.timestamp + safetyDelay;

        emit DeliveryConfirmed(orderId, e.releaseAfter);
    }

    // ─── STEP 2b — Buyer Acknowledges Receipt (optional, skips remaining delay) ──
    //
    // The portal shows a "Confirm Receipt" button after delivery.
    // If the buyer clicks it, funds are released immediately.
    // The platform can also call this on the buyer's behalf (invisible UX).

    function buyerAcknowledge(string calldata orderId)
        external
        inState(orderId, EscrowState.DELIVERED)
    {
        EscrowData storage e = _escrows[orderId];
        require(
            msg.sender == e.buyer || msg.sender == platform,
            "NexusEscrow: only buyer or platform"
        );
        e.releaseAfter = block.timestamp; // Release allowed immediately

        emit BuyerAcknowledged(orderId);
    }

    // ─── STEP 3 — Release Payment ────────────────────────────────────────────────
    //
    // Callable by anyone once the safety delay has passed.
    // In practice, the Vercel backend calls this via a scheduled Apex job.

    function releasePayment(string calldata orderId)
        external
        nonReentrant
        inState(orderId, EscrowState.DELIVERED)
    {
        EscrowData storage e = _escrows[orderId];
        require(
            block.timestamp >= e.releaseAfter,
            "NexusEscrow: safety delay not yet passed"
        );

        uint256 amt    = e.amount;
        address seller = e.seller;
        e.state  = EscrowState.RELEASED;
        e.amount = 0; // Prevent re-entrancy on amount

        bool ok = usdc.transfer(seller, amt);
        require(ok, "NexusEscrow: transfer to seller failed");

        emit PaymentReleased(orderId, seller, amt);
    }

    // ─── Dispute — Buyer Reports Problem ─────────────────────────────────────────
    //
    // Buyer clicks "Report an Issue" in the portal.
    // Platform can also raise on buyer's behalf.
    // Allowed in FUNDED or DELIVERED states (not after release).

    function raiseDispute(string calldata orderId)
        external
        orderExists(orderId)
    {
        EscrowData storage e = _escrows[orderId];
        require(
            e.state == EscrowState.FUNDED || e.state == EscrowState.DELIVERED,
            "NexusEscrow: cannot dispute at this stage"
        );
        require(
            msg.sender == e.buyer || msg.sender == platform,
            "NexusEscrow: only buyer or platform"
        );

        e.state = EscrowState.DISPUTED;

        emit DisputeRaised(orderId);
    }

    // ─── Agentforce — Freeze Escrow ──────────────────────────────────────────────
    //
    // Agentforce detects a negative signal (broken product, non-delivery message)
    // and tells Vercel → Vercel calls freezeEscrow.
    // Allowed from FUNDED, DELIVERED, or DISPUTED.

    function freezeEscrow(string calldata orderId)
        external
        onlyPlatform
        orderExists(orderId)
    {
        EscrowData storage e = _escrows[orderId];
        require(
            e.state == EscrowState.FUNDED   ||
            e.state == EscrowState.DELIVERED ||
            e.state == EscrowState.DISPUTED,
            "NexusEscrow: cannot freeze at this stage"
        );

        e.state = EscrowState.FROZEN;

        emit EscrowFrozen(orderId);
    }

    // ─── Admin — Refund Buyer ────────────────────────────────────────────────────
    //
    // After dispute/freeze is resolved in buyer's favour.
    // Only platform can call this (after Agentforce/admin decision).

    function refundBuyer(string calldata orderId)
        external
        onlyPlatform
        nonReentrant
        orderExists(orderId)
    {
        EscrowData storage e = _escrows[orderId];
        require(
            e.state == EscrowState.DISPUTED || e.state == EscrowState.FROZEN,
            "NexusEscrow: can only refund from DISPUTED or FROZEN"
        );

        uint256 amt   = e.amount;
        address buyer = e.buyer;
        e.state  = EscrowState.REFUNDED;
        e.amount = 0;

        bool ok = usdc.transfer(buyer, amt);
        require(ok, "NexusEscrow: transfer to buyer failed");

        emit BuyerRefunded(orderId, buyer, amt);
    }

    // ─── Agentforce — Extend Deadline ────────────────────────────────────────────
    //
    // Buyer agrees to extend delivery deadline by N days.
    // Only allowed while still in FUNDED (delivery not yet confirmed).

    function extendDeadline(string calldata orderId, uint256 newDeadline)
        external
        onlyPlatform
        inState(orderId, EscrowState.FUNDED)
    {
        EscrowData storage e = _escrows[orderId];
        require(
            newDeadline > e.deadline,
            "NexusEscrow: new deadline must be later than current deadline"
        );

        e.deadline = newDeadline;

        emit DeadlineExtended(orderId, newDeadline);
    }

    // ─── Scheduled — Refund Expired Order ────────────────────────────────────────
    //
    // Called by the Vercel backend (triggered by Apex scheduled job) when
    // the delivery deadline has passed without a delivery confirmation.

    function refundExpired(string calldata orderId)
        external
        onlyPlatform
        nonReentrant
        inState(orderId, EscrowState.FUNDED)
    {
        EscrowData storage e = _escrows[orderId];
        require(
            block.timestamp > e.deadline,
            "NexusEscrow: delivery deadline not yet passed"
        );

        uint256 amt   = e.amount;
        address buyer = e.buyer;
        e.state  = EscrowState.REFUNDED;
        e.amount = 0;

        bool ok = usdc.transfer(buyer, amt);
        require(ok, "NexusEscrow: transfer to buyer failed");

        emit BuyerRefunded(orderId, buyer, amt);
    }

    // ─── Admin — Release After Freeze (seller wins dispute) ──────────────────────

    function releaseFromFreeze(string calldata orderId)
        external
        onlyPlatform
        nonReentrant
        inState(orderId, EscrowState.FROZEN)
    {
        EscrowData storage e = _escrows[orderId];

        uint256 amt    = e.amount;
        address seller = e.seller;
        e.state  = EscrowState.RELEASED;
        e.amount = 0;

        bool ok = usdc.transfer(seller, amt);
        require(ok, "NexusEscrow: transfer to seller failed");

        emit PaymentReleased(orderId, seller, amt);
    }

    // ─── Owner — Rotate Platform Address ─────────────────────────────────────────

    function updatePlatform(address newPlatform) external onlyOwner {
        require(newPlatform != address(0), "NexusEscrow: zero address");
        emit PlatformUpdated(platform, newPlatform);
        platform = newPlatform;
    }

    // ─── Owner — Adjust Safety Delay ─────────────────────────────────────────────

    function updateSafetyDelay(uint256 newDelaySeconds) external onlyOwner {
        emit SafetyDelayUpdated(safetyDelay, newDelaySeconds);
        safetyDelay = newDelaySeconds;
    }

    // ─── Views ───────────────────────────────────────────────────────────────────

    function getEscrow(string calldata orderId)
        external
        view
        returns (EscrowData memory)
    {
        return _escrows[orderId];
    }

    function getEscrowState(string calldata orderId)
        external
        view
        returns (EscrowState)
    {
        return _escrows[orderId].state;
    }

    function getEscrowAmount(string calldata orderId)
        external
        view
        returns (uint256)
    {
        return _escrows[orderId].amount;
    }
}
