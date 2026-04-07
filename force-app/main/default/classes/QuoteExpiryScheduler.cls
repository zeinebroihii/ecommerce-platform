/**
 * QuoteExpiryScheduler
 * Runs daily to mark overdue quotes as Expired.
 *
 * To schedule: run this in Anonymous Apex:
 *   String cron = '0 0 2 * * ?'; // 2 AM every day
 *   System.schedule('Nexus Quote Expiry', cron, new QuoteExpiryScheduler());
 */
global class QuoteExpiryScheduler implements Schedulable {
  global void execute(SchedulableContext sc) {
    QuoteController.expireOverdueQuotes();
  }
}
