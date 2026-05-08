/**
 * EscrowMonitorScheduler
 *
 * Self-rescheduling Schedulable that runs two checks every N minutes:
 *
 *   1. DELIVERED escrows past the safety delay → releasePayment
 *   2. FUNDED escrows past their PaymentDeadline__c → refundBuyer (expired)
 *
 * Test mode  : SAFETY_DELAY_MINUTES = 2,   RESCHEDULE_MINUTES = 3
 * Production : SAFETY_DELAY_MINUTES = 1440, RESCHEDULE_MINUTES = 60
 *
 * To start the monitor from Anonymous Apex:
 *   EscrowMonitorScheduler.kickOff();
 *
 * To run one check immediately (without scheduling):
 *   new EscrowMonitorScheduler().runChecks();
 */
public with sharing class EscrowMonitorScheduler implements Schedulable {
  // ── Timing — swap for production ─────────────────────────────────────────
  @TestVisible
  public static Integer SAFETY_DELAY_MINUTES = 2;
  @TestVisible
  public static Integer RESCHEDULE_MINUTES = 3;

  // ── Schedulable entry point ───────────────────────────────────────────────

  public void execute(SchedulableContext ctx) {
    runChecks();
    reschedule();
  }

  // ── Public so Anonymous Apex / tests can call directly ───────────────────

  public void runChecks() {
    processDeliveredEscrows();
    processExpiredDeadlines();
  }

  // ── Check 1: release after safety delay ──────────────────────────────────

  private void processDeliveredEscrows() {
    DateTime cutoff = DateTime.now().addMinutes(-SAFETY_DELAY_MINUTES);
    List<Order> orders = [
      SELECT Id, OrderNumber
      FROM Order
      WHERE
        PaymentMethod__c = 'USDC_Escrow'
        AND EscrowStatus__c = 'DELIVERED'
        AND DeliveryConfirmedAt__c <= :cutoff
      LIMIT 10
    ];
    if (orders.isEmpty())
      return;

    // Mark as RELEASING first so the scheduler doesn't re-process while the
    // @future callout is in flight
    List<Order> updates = new List<Order>();
    for (Order o : orders) {
      updates.add(new Order(Id = o.Id, EscrowStatus__c = 'RELEASING'));
    }
    update updates;

    for (Order o : orders) {
      EscrowBridgeController.releasePayment(o.OrderNumber, false);
    }
  }

  // ── Check 2: refund when delivery deadline has expired ───────────────────

  private void processExpiredDeadlines() {
    Date today = Date.today();
    List<Order> orders = [
      SELECT Id, OrderNumber
      FROM Order
      WHERE
        PaymentMethod__c = 'USDC_Escrow'
        AND EscrowStatus__c = 'FUNDED'
        AND PaymentDeadline__c < :today
      LIMIT 10
    ];
    if (orders.isEmpty())
      return;

    List<Order> updates = new List<Order>();
    for (Order o : orders) {
      updates.add(new Order(Id = o.Id, EscrowStatus__c = 'REFUNDING'));
    }
    update updates;

    for (Order o : orders) {
      EscrowBridgeController.refundBuyer(o.OrderNumber, true);
    }
  }

  // ── Self-reschedule ───────────────────────────────────────────────────────

  private void reschedule() {
    // Abort any waiting (not executing) instances to avoid accumulation
    for (CronTrigger ct : [
      SELECT Id
      FROM CronTrigger
      WHERE
        CronJobDetail.Name LIKE 'EscrowMonitor%'
        AND State NOT IN ('EXECUTING', 'COMPLETE', 'DELETED', 'ERROR')
    ]) {
      try {
        System.abortJob(ct.Id);
      } catch (Exception e) {
        // ignore — job may have completed between query and abort
      }
    }

    Datetime next = Datetime.now().addMinutes(RESCHEDULE_MINUTES);
    String cron =
      '0 ' +
      next.minute() +
      ' ' +
      next.hour() +
      ' ' +
      next.day() +
      ' ' +
      next.month() +
      ' ? ' +
      next.year();
    System.schedule(
      'EscrowMonitor_' + String.valueOf(next.getTime()),
      cron,
      new EscrowMonitorScheduler()
    );
  }

  // ── Static helper to start the monitor ───────────────────────────────────

  public static void kickOff() {
    // Run one immediate check
    new EscrowMonitorScheduler().runChecks();
    // Schedule the first recurring run 3 minutes from now
    Datetime next = Datetime.now().addMinutes(RESCHEDULE_MINUTES);
    String cron =
      '0 ' +
      next.minute() +
      ' ' +
      next.hour() +
      ' ' +
      next.day() +
      ' ' +
      next.month() +
      ' ? ' +
      next.year();
    System.schedule(
      'EscrowMonitor_' + String.valueOf(next.getTime()),
      cron,
      new EscrowMonitorScheduler()
    );
  }
}
