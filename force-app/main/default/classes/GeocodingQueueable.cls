public class GeocodingQueueable implements Queueable, Database.AllowsCallouts {
  private Id orderId;

  public GeocodingQueueable(Id orderId) {
    this.orderId = orderId;
  }

  public void execute(QueueableContext ctx) {
    try {
      Order o = [
        SELECT
          Id,
          AccountId,
          Shipping_Street__c,
          Shipping_City__c,
          Shipping_State__c,
          Shipping_Zip__c,
          Shipping_Country__c,
          Account.BillingStreet,
          Account.BillingCity,
          Account.BillingState,
          Account.BillingPostalCode,
          Account.BillingCountry
        FROM Order
        WHERE Id = :orderId
        LIMIT 1
      ];

      // If Order has no shipping address, fall back to Account billing address
      if (String.isBlank(o.Shipping_City__c) && o.Account != null) {
        o.Shipping_Street__c = o.Account.BillingStreet;
        o.Shipping_City__c = o.Account.BillingCity;
        o.Shipping_State__c = o.Account.BillingState;
        o.Shipping_Zip__c = o.Account.BillingPostalCode;
        o.Shipping_Country__c = o.Account.BillingCountry;
        update o;
      }

      List<String> parts = new List<String>();
      if (String.isNotBlank(o.Shipping_Street__c))
        parts.add(o.Shipping_Street__c);
      if (String.isNotBlank(o.Shipping_City__c))
        parts.add(o.Shipping_City__c);
      if (String.isNotBlank(o.Shipping_Zip__c))
        parts.add(o.Shipping_Zip__c);
      if (String.isNotBlank(o.Shipping_State__c))
        parts.add(o.Shipping_State__c);
      if (String.isNotBlank(o.Shipping_Country__c))
        parts.add(o.Shipping_Country__c);

      if (parts.isEmpty())
        return;

      GeocodingService.GeoCoords coords = GeocodingService.geocodeAddress(
        String.join(parts, ', ')
      );

      if (coords != null) {
        update new Order(
          Id = orderId,
          Dest_Latitude__c = coords.lat,
          Dest_Longitude__c = coords.lng
        );
        System.debug(
          '[GeocodingQueueable] dest set to ' + coords.lat + ',' + coords.lng
        );

        // If the rider already has a live position, trigger ETA immediately
        // without waiting for the next Traccar poll cycle.
        Order live = [
          SELECT Live_Latitude__c, Live_Longitude__c
          FROM Order
          WHERE Id = :orderId
        ];
        if (live.Live_Latitude__c != null && live.Live_Longitude__c != null) {
          System.enqueueJob(
            new OSRMQueueable(
              orderId,
              live.Live_Latitude__c,
              live.Live_Longitude__c,
              coords.lat,
              coords.lng
            )
          );
        }
      }
    } catch (Exception e) {
      System.debug('[GeocodingQueueable] ' + e.getMessage());
    }
  }
}
