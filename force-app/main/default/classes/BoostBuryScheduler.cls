global class BoostBuryScheduler implements Schedulable {
  // Schedule daily: BoostBuryScheduler.scheduleDaily();
  global void execute(SchedulableContext sc) {
    BoostBuryEngine.run();
  }

  public static void scheduleDaily() {
    String cron = '0 0 1 * * ?'; // every day at 1:00 AM
    System.schedule(
      'Boost & Bury Daily Recalculation',
      cron,
      new BoostBuryScheduler()
    );
    System.debug('BoostBuryScheduler: scheduled daily at 1AM.');
  }
}
