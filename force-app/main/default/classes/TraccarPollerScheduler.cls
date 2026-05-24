public class TraccarPollerScheduler implements Schedulable {
  public void execute(SchedulableContext ctx) {
    // Only poll when there is at least one active Shipped order
    Integer active = [
      SELECT COUNT()
      FROM Order
      WHERE Status = 'Shipped' AND Rider_Device_Id__c != NULL
    ];
    if (active > 0) {
      System.enqueueJob(new TraccarPollerQueueable());
    }
  }
}
