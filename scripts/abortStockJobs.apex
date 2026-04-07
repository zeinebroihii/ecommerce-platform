// Abort all StockVelocityEngine scheduled jobs
List<CronTrigger> jobs = [SELECT Id FROM CronTrigger WHERE CronJobDetail.Name LIKE '%Stock%'];
for (CronTrigger ct : jobs) System.abortJob(ct.Id);
System.debug('Aborted ' + jobs.size() + ' scheduled jobs');
