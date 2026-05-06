global class DocuSignCleanupBatch implements Database.Batchable<SObject> {
  global Iterable<SObject> start(Database.BatchableContext ctx) {
    return [
      SELECT Id
      FROM CronTrigger
      WHERE CronJobDetail.Name LIKE 'DocuSignPoll%'
    ];
  }

  global void execute(Database.BatchableContext ctx, List<SObject> scope) {
    for (SObject ct : scope) {
      try {
        System.abortJob(ct.Id);
      } catch (Exception e) {
      }
    }
  }

  global void finish(Database.BatchableContext ctx) {
    Integer rem = [
      SELECT COUNT()
      FROM CronTrigger
      WHERE CronJobDetail.Name LIKE 'DocuSignPoll%'
    ];
    System.debug('[DocuSignCleanup] Finished. Remaining jobs: ' + rem);
  }
}
