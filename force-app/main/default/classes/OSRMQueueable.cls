public class OSRMQueueable implements Queueable, Database.AllowsCallouts {
  private Id orderId;
  private Decimal fromLat;
  private Decimal fromLng;
  private Decimal toLat;
  private Decimal toLng;

  public OSRMQueueable(
    Id orderId,
    Decimal fromLat,
    Decimal fromLng,
    Decimal toLat,
    Decimal toLng
  ) {
    this.orderId = orderId;
    this.fromLat = fromLat;
    this.fromLng = fromLng;
    this.toLat = toLat;
    this.toLng = toLng;
  }

  public void execute(QueueableContext ctx) {
    try {
      Integer eta = OSRMService.getETA(fromLat, fromLng, toLat, toLng);
      String address = GeocodingService.reverseGeocode(fromLat, fromLng);

      Order o = new Order(Id = orderId);
      if (eta != null)
        o.Live_ETA__c = eta;
      if (address != null)
        o.Live_Address__c = address;
      update o;
    } catch (Exception e) {
      System.debug('[OSRMQueueable] ' + e.getMessage());
    }
  }
}
