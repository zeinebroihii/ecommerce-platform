/**
 * DocuSignPollJob
 * ─────────────────────────────────────────────────────────────────────────────
 * Bulletproof scheduler: schedules 6 future runs at once (+2,+4,+6,+8,+10,+12
 * minutes). Each run re-schedules the next 6. Even if 5 fail, the 6th fires.
 *
 * Kick off: DocuSignPollJob.start();
 * Stop:     DocuSignPollJob.stop();
 */
global class DocuSignPollJob implements Schedulable {
  global void execute(SchedulableContext sc) {
    try {
      System.enqueueJob(new DocuSignPollQueueable());
    } catch (Exception e) {
      System.debug('[DocuSignPoll] Enqueue skipped: ' + e.getMessage());
    }
    scheduleNextBatch();
  }

  // ── Schedule 6 runs spread over the next 12 minutes ────────────────────────
  private static void scheduleNextBatch() {
    // Clean up any waiting DocuSignPoll* jobs first to avoid duplicates
    List<CronTrigger> old = [
      SELECT Id
      FROM CronTrigger
      WHERE
        CronJobDetail.Name LIKE 'DocuSignPoll_%'
        AND State IN ('WAITING', 'PAUSED')
    ];
    for (CronTrigger ct : old) {
      try {
        System.abortJob(ct.Id);
      } catch (Exception e) {
      }
    }

    Integer[] offsets = new List<Integer>{ 2, 4, 6, 8, 10, 12 };
    for (Integer offset : offsets) {
      try {
        DateTime t = DateTime.now().addMinutes(offset);
        String jobName = 'DocuSignPoll_' + t.getTime();
        String cron =
          '0 ' +
          t.minute() +
          ' ' +
          t.hour() +
          ' ' +
          t.day() +
          ' ' +
          t.month() +
          ' ? ' +
          t.year();
        System.schedule(jobName, cron, new DocuSignPollJob());
      } catch (Exception e) {
        System.debug(
          '[DocuSignPoll] Schedule +' + offset + 'm failed: ' + e.getMessage()
        );
      }
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  public static void start() {
    stop();
    scheduleNextBatch();
    System.debug('[DocuSignPoll] Started — 6 runs scheduled over next 12 min.');
  }

  public static void stop() {
    List<CronTrigger> active = [
      SELECT Id
      FROM CronTrigger
      WHERE
        CronJobDetail.Name LIKE 'DocuSignPoll%'
        AND State IN ('WAITING', 'PAUSED', 'ACQUIRED')
      LIMIT 100
    ];
    Integer aborted = 0;
    for (CronTrigger ct : active) {
      try {
        System.abortJob(ct.Id);
        aborted++;
      } catch (Exception e) {
      }
    }
    System.debug('[DocuSignPoll] Stopped ' + aborted + ' jobs.');
  }
}
