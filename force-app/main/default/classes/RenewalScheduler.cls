/**
 * RenewalScheduler
 *
 * Scheduled daily at 08:00. Finds all signed quotes whose contract
 * expires exactly 60 days from today and auto-generates a renewal
 * Opportunity + Quote via RenewalService.
 *
 * To schedule (run once in Execute Anonymous):
 *   System.schedule('Nexus Renewal Scheduler', '0 0 8 * * ?', new RenewalScheduler());
 *
 * To reschedule or stop:
 *   List<CronTrigger> jobs = [SELECT Id FROM CronTrigger WHERE CronJobDetail.Name = 'Nexus Renewal Scheduler'];
 *   for (CronTrigger j : jobs) System.abortJob(j.Id);
 */
global class RenewalScheduler implements Schedulable {
  global void execute(SchedulableContext ctx) {
    Date targetDate = Date.today().addDays(60);

    // Collect quote IDs that already have a renewal
    Set<Id> alreadyRenewed = new Set<Id>();
    for (TALEXO_Quote__c r : [
      SELECT Renewal_Of_Quote__c
      FROM TALEXO_Quote__c
      WHERE Renewal_Of_Quote__c != NULL
    ]) {
      alreadyRenewed.add(r.Renewal_Of_Quote__c);
    }

    // Find signed quotes expiring in 60 days without an existing renewal
    List<TALEXO_Quote__c> dueSoon = [
      SELECT Id, Name
      FROM TALEXO_Quote__c
      WHERE
        Status__c = 'Signed'
        AND Contract_End_Date__c = :targetDate
        AND Is_Renewal__c = FALSE
        AND Id NOT IN :alreadyRenewed
    ];

    if (dueSoon.isEmpty())
      return;

    List<String> successes = new List<String>();
    List<String> failures = new List<String>();

    for (TALEXO_Quote__c q : dueSoon) {
      try {
        RenewalService.RenewalResult res = RenewalService.generate(q.Id);
        successes.add(q.Name + ' → ' + res.renewalQuoteName);
      } catch (Exception e) {
        failures.add(q.Name + ': ' + e.getMessage());
      }
    }

    // Log results to debug (visible in Setup → Scheduled Jobs → Last Run)
    System.debug(
      'Renewal Scheduler — Successes (' + successes.size() + '): ' + successes
    );
    if (!failures.isEmpty()) {
      System.debug(
        'Renewal Scheduler — Failures (' + failures.size() + '): ' + failures
      );
    }
  }
}
