// Receives live GPS positions forwarded by Traccar and writes them to the matching Order.
// URL: /services/apexrest/tracking/position?secret=<WEBHOOK_SECRET>
// Must be whitelisted for the Experience Cloud guest user in Setup → Digital Experiences → Sites.
@RestResource(urlMapping='/tracking/position')
global without sharing class TraccarWebhookController {
  @HttpPost
  global static void receivePosition() {
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;
    res.addHeader('Content-Type', 'application/json');

    // ── 1. Validate secret ───────────────────────────────────────────────
    String secret = req.params.get('secret');
    if (secret != LiveTrackingConfig.WEBHOOK_SECRET) {
      res.statusCode = 401;
      res.responseBody = Blob.valueOf('{"error":"Unauthorized"}');
      return;
    }

    // ── 2. Parse Traccar JSON body ───────────────────────────────────────
    try {
      String bodyStr = req.requestBody != null
        ? req.requestBody.toString()
        : '';
      if (String.isBlank(bodyStr)) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf('{"error":"Empty body"}');
        return;
      }

      Map<String, Object> pos = (Map<String, Object>) JSON.deserializeUntyped(
        bodyStr
      );

      Decimal lat = toDecimal(pos.get('latitude'));
      Decimal lng = toDecimal(pos.get('longitude'));

      // Prefer the URL ?device= param (manual/Postman tests).
      // For traccar.xml forward.url (no template expansion), fall back to
      // the integer deviceId in the JSON body, stored as a string on Rider__c.
      String deviceKey = req.params.get('device');
      if (String.isBlank(deviceKey)) {
        Object deviceIdObj = pos.get('deviceId');
        if (deviceIdObj != null) {
          deviceKey = String.valueOf(((Decimal) deviceIdObj).intValue());
        }
      }

      if (lat == null || lng == null) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf(
          '{"error":"Missing latitude or longitude"}'
        );
        return;
      }

      // ── 3. Find active Shipped order for this device ─────────────────
      List<Order> orders = [
        SELECT Id, OrderNumber, Dest_Latitude__c, Dest_Longitude__c
        FROM Order
        WHERE Rider_Device_Id__c = :deviceKey AND Status = 'Shipped'
        LIMIT 1
      ];

      if (orders.isEmpty()) {
        // Accept the ping silently — rider might have just started
        res.statusCode = 200;
        res.responseBody = Blob.valueOf('{"ok":true,"matched":false}');
        return;
      }

      Order o = orders[0];
      o.Live_Latitude__c = lat;
      o.Live_Longitude__c = lng;
      update o;

      // ── 4. Queue OSRM callout to recompute ETA ───────────────────────
      if (o.Dest_Latitude__c != null && o.Dest_Longitude__c != null) {
        System.enqueueJob(
          new OSRMQueueable(
            o.Id,
            lat,
            lng,
            o.Dest_Latitude__c,
            o.Dest_Longitude__c
          )
        );
      }

      res.statusCode = 200;
      res.responseBody = Blob.valueOf(
        '{"ok":true,"order":"' + o.OrderNumber + '"}'
      );
    } catch (Exception e) {
      System.debug('[TraccarWebhook] ' + e.getMessage());
      res.statusCode = 500;
      res.responseBody = Blob.valueOf(
        '{"error":"' + e.getMessage().replace('"', '\\"') + '"}'
      );
    }
  }

  private static Decimal toDecimal(Object val) {
    if (val == null)
      return null;
    try {
      return Decimal.valueOf(String.valueOf(val));
    } catch (Exception e) {
      return null;
    }
  }
}
