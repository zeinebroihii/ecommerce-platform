public class TraccarPollerQueueable implements Queueable, Database.AllowsCallouts {
  public void execute(QueueableContext ctx) {
    try {
      // ── 1. Call Traccar positions API ──────────────────────────────
      String auth =
        'Basic ' +
        EncodingUtil.base64Encode(
          Blob.valueOf(
            LiveTrackingConfig.TRACCAR_EMAIL +
              ':' +
              LiveTrackingConfig.TRACCAR_PASSWORD
          )
        );
      HttpRequest req = new HttpRequest();
      req.setEndpoint(LiveTrackingConfig.TRACCAR_URL + '/api/positions');
      req.setMethod('GET');
      req.setHeader('Authorization', auth);
      req.setHeader('Accept', 'application/json');
      req.setTimeout(10000);

      HttpResponse res = new Http().send(req);
      if (res.getStatusCode() != 200) {
        System.debug('[TraccarPoller] HTTP ' + res.getStatusCode());
        return;
      }

      List<Object> positions = (List<Object>) JSON.deserializeUntyped(
        res.getBody()
      );
      if (positions == null || positions.isEmpty())
        return;

      // ── 2. Build deviceId → lat/lng map ───────────────────────────
      Map<String, Decimal> deviceLat = new Map<String, Decimal>();
      Map<String, Decimal> deviceLng = new Map<String, Decimal>();
      for (Object posObj : positions) {
        Map<String, Object> pos = (Map<String, Object>) posObj;
        Object did = pos.get('deviceId');
        if (did == null)
          continue;
        String key = String.valueOf(((Decimal) did).intValue());
        deviceLat.put(key, toDecimal(pos.get('latitude')));
        deviceLng.put(key, toDecimal(pos.get('longitude')));
      }
      if (deviceLat.isEmpty())
        return;

      // ── 3. Find active Shipped orders ──────────────────────────────
      List<Order> orders = [
        SELECT
          Id,
          Rider_Device_Id__c,
          Live_Latitude__c,
          Live_Longitude__c,
          Dest_Latitude__c,
          Dest_Longitude__c
        FROM Order
        WHERE Status = 'Shipped' AND Rider_Device_Id__c IN :deviceLat.keySet()
      ];
      if (orders.isEmpty())
        return;

      // ── 4. Update changed positions ────────────────────────────────
      List<Order> toUpdate = new List<Order>();
      Order etaCandidate = null;

      for (Order o : orders) {
        Decimal newLat = deviceLat.get(o.Rider_Device_Id__c);
        Decimal newLng = deviceLng.get(o.Rider_Device_Id__c);
        if (newLat == null || newLng == null || newLat == 0 || newLng == 0)
          continue;
        if (newLat == o.Live_Latitude__c && newLng == o.Live_Longitude__c)
          continue;

        o.Live_Latitude__c = newLat;
        o.Live_Longitude__c = newLng;
        toUpdate.add(o);

        if (
          etaCandidate == null &&
          o.Dest_Latitude__c != null &&
          o.Dest_Longitude__c != null
        ) {
          etaCandidate = o;
        }
      }

      if (toUpdate.isEmpty())
        return;
      update toUpdate;

      // ── 5. Queue ETA recompute for first order with dest coords ────
      // (Queueable can only chain one job)
      if (etaCandidate != null) {
        System.enqueueJob(
          new OSRMQueueable(
            etaCandidate.Id,
            etaCandidate.Live_Latitude__c,
            etaCandidate.Live_Longitude__c,
            etaCandidate.Dest_Latitude__c,
            etaCandidate.Dest_Longitude__c
          )
        );
      }
    } catch (Exception e) {
      System.debug('[TraccarPoller] ' + e.getMessage());
    }
  }

  private static Decimal toDecimal(Object val) {
    if (val == null)
      return null;
    try {
      return Decimal.valueOf(String.valueOf(val));
    } catch (Exception ignored) {
      return null;
    }
  }
}
