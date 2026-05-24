public without sharing class LiveTrackingController {
  public class DispatchInfo {
    @AuraEnabled
    public String orderNumber;
    @AuraEnabled
    public String orderStatus;
    @AuraEnabled
    public String buyerPhone;
    @AuraEnabled
    public String riderDeviceId;
    @AuraEnabled
    public List<RiderOption> riders;
  }

  public class RiderOption {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String deviceId;
  }

  // ── getDispatchInfo ───────────────────────────────────────────────────────
  // Called by the nexusDispatchAction Quick Action LWC when it opens.
  @AuraEnabled
  public static DispatchInfo getDispatchInfo(Id orderId) {
    if (orderId == null)
      throw new AuraHandledException('Order ID is required.');
    List<Order> rows = [
      SELECT
        Id,
        OrderNumber,
        Status,
        Buyer_Whatsapp__c,
        Account.Phone,
        AccountId,
        Rider_Device_Id__c
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];
    if (rows.isEmpty())
      throw new AuraHandledException('Order not found: ' + orderId);
    Order o = rows[0];

    // Prefer Contact MobilePhone/Phone over Account.Phone (Account.Phone is often a billing number)
    String contactPhone = null;
    if (o.AccountId != null) {
      List<Contact> contacts = [
        SELECT MobilePhone, Phone
        FROM Contact
        WHERE AccountId = :o.AccountId
        ORDER BY LastModifiedDate DESC
        LIMIT 1
      ];
      if (!contacts.isEmpty()) {
        contactPhone = String.isNotBlank(contacts[0].MobilePhone)
          ? contacts[0].MobilePhone
          : contacts[0].Phone;
      }
    }

    List<RiderOption> opts = new List<RiderOption>();
    for (Rider__c r : [
      SELECT Id, Name, Device_Id__c
      FROM Rider__c
      WHERE Is_Active__c = TRUE
      ORDER BY Name
    ]) {
      RiderOption opt = new RiderOption();
      opt.id = r.Id;
      opt.name = r.Name;
      opt.deviceId = r.Device_Id__c;
      opts.add(opt);
    }

    DispatchInfo info = new DispatchInfo();
    info.orderNumber = o.OrderNumber;
    info.orderStatus = o.Status;
    info.riders = opts;
    info.riderDeviceId = o.Rider_Device_Id__c;
    info.buyerPhone = String.isNotBlank(o.Buyer_Whatsapp__c)
      ? o.Buyer_Whatsapp__c
      : (contactPhone != null
          ? contactPhone
          : (o.Account != null ? o.Account.Phone : null));
    return info;
  }

  public class TrackingData {
    @AuraEnabled
    public Decimal lat;
    @AuraEnabled
    public Decimal lng;
    @AuraEnabled
    public Integer etaMinutes;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String orderNumber;
    @AuraEnabled
    public String trackingToken;
    @AuraEnabled
    public Boolean isLive;
    @AuraEnabled
    public String riderAddress;
  }

  // ── startDelivery ─────────────────────────────────────────────────────────
  // Called once per order to:
  //   • Set the rider device, destination coords, mark Shipped
  //   • Generate the magic-link token
  //   • Send WhatsApp to buyer (queued so DML completes first)
  @AuraEnabled
  public static String startDelivery(
    Id orderId,
    String riderDeviceId,
    String buyerWhatsapp,
    Decimal destLat,
    Decimal destLng
  ) {
    Order o = [
      SELECT Id, OrderNumber, Tracking_Token__c, Buyer_Whatsapp__c, Status
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];

    if (String.isBlank(o.Tracking_Token__c)) {
      o.Tracking_Token__c = generateToken();
    }
    o.Rider_Device_Id__c = riderDeviceId;
    if (destLat != null)
      o.Dest_Latitude__c = destLat;
    if (destLng != null)
      o.Dest_Longitude__c = destLng;
    if (String.isNotBlank(buyerWhatsapp)) {
      o.Buyer_Whatsapp__c = buyerWhatsapp;
    }
    o.Status = 'Shipped';
    update o;

    String trackingUrl =
      LiveTrackingConfig.SITE_BASE_URL +
      '/tracking?token=' +
      o.Tracking_Token__c;

    // Build WhatsApp dispatch notification
    String msg =
      'Hello!\n\n' +
      'Your *Nexus* delivery (order *' +
      o.OrderNumber +
      '*) is on its way.\n\n' +
      'Track your package in real time:\n' +
      trackingUrl +
      '\n\n' +
      '_This link expires automatically upon delivery._';

    // If no destination coords provided, auto-geocode from the order's shipping address
    if (destLat == null || destLng == null) {
      System.enqueueJob(new GeocodingQueueable(o.Id));
    }

    if (String.isNotBlank(o.Buyer_Whatsapp__c)) {
      System.enqueueJob(new TwilioNotifyQueueable(o.Buyer_Whatsapp__c, msg));
    }

    return trackingUrl;
  }

  // ── getLivePosition ───────────────────────────────────────────────────────
  // Polled every 30 s by nexusOrderSystem to refresh the side-column map.
  @AuraEnabled
  public static TrackingData getLivePosition(Id orderId) {
    Order o = [
      SELECT
        Id,
        OrderNumber,
        Status,
        Live_Latitude__c,
        Live_Longitude__c,
        Live_ETA__c,
        Live_Address__c,
        Tracking_Token__c
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];
    return buildTrackingData(o);
  }

  // ── getTrackingByToken ────────────────────────────────────────────────────
  // Used by the public nexusLiveTracker page (no login required).
  // Must be granted to the Experience Cloud Guest User profile.
  @AuraEnabled
  public static TrackingData getTrackingByToken(String token) {
    if (String.isBlank(token))
      return null;
    List<Order> orders = [
      SELECT
        Id,
        OrderNumber,
        Status,
        Live_Latitude__c,
        Live_Longitude__c,
        Live_ETA__c,
        Live_Address__c,
        Tracking_Token__c
      FROM Order
      WHERE Tracking_Token__c = :token
      LIMIT 1
    ];
    if (orders.isEmpty())
      return null;
    return buildTrackingData(orders[0]);
  }

  // ── confirmDelivery ───────────────────────────────────────────────────────
  @AuraEnabled
  public static void confirmDelivery(Id orderId) {
    update new Order(
      Id = orderId,
      Status = 'Delivered',
      Delivered_Date__c = Datetime.now()
    );
  }

  // ── buyerConfirmReceipt ───────────────────────────────────────────────────
  // Called by the portal when the buyer clicks "Confirm Receipt" on a
  // non-escrow (Stripe) Delivered order. Advances Status → Completed.
  @AuraEnabled
  public static void buyerConfirmReceipt(String orderNumber) {
    List<Order> rows = [
      SELECT Id, Status
      FROM Order
      WHERE OrderNumber = :orderNumber
      LIMIT 1
    ];
    if (!rows.isEmpty() && rows[0].Status == 'Delivered') {
      update new Order(Id = rows[0].Id, Status = 'Completed');
    }
  }

  // ── syncTrackerDeviceId ───────────────────────────────────────────────────
  // Called from the dispatch action when the admin needs to fix a Shipped
  // order's tracker device ID without re-dispatching. Updates both the Order
  // and the associated Rider record so future dispatches inherit the right ID.
  @AuraEnabled
  public static void syncTrackerDeviceId(Id orderId, String traccarDeviceId) {
    if (orderId == null || String.isBlank(traccarDeviceId)) {
      throw new AuraHandledException(
        'Order ID and Traccar Device ID are required.'
      );
    }
    traccarDeviceId = traccarDeviceId.trim();
    Order o = [
      SELECT Id, Status, Rider_Device_Id__c
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];
    if (o.Status != 'Shipped') {
      throw new AuraHandledException(
        'Order is not in Shipped status — only Shipped orders can be synced.'
      );
    }
    String oldDeviceId = o.Rider_Device_Id__c;
    update new Order(Id = o.Id, Rider_Device_Id__c = traccarDeviceId);

    if (String.isNotBlank(oldDeviceId) && oldDeviceId != traccarDeviceId) {
      List<Rider__c> riders = [
        SELECT Id
        FROM Rider__c
        WHERE Device_Id__c = :oldDeviceId
        LIMIT 1
      ];
      if (!riders.isEmpty()) {
        update new Rider__c(Id = riders[0].Id, Device_Id__c = traccarDeviceId);
      }
    }
  }

  // ── getActiveDeliveries ───────────────────────────────────────────────────
  // Returns all currently Shipped orders that have a GPS position.
  // Used by nexusLiveTracker to show other simultaneous deliveries as cards.
  public class DeliveryPin {
    @AuraEnabled
    public String orderNumber;
    @AuraEnabled
    public Decimal lat;
    @AuraEnabled
    public Decimal lng;
    @AuraEnabled
    public String trackingToken;
  }

  @AuraEnabled
  public static List<DeliveryPin> getActiveDeliveries() {
    List<DeliveryPin> pins = new List<DeliveryPin>();
    for (Order o : [
      SELECT OrderNumber, Live_Latitude__c, Live_Longitude__c, Tracking_Token__c
      FROM Order
      WHERE
        Status = 'Shipped'
        AND Live_Latitude__c != NULL
        AND Live_Longitude__c != NULL
      ORDER BY LastModifiedDate DESC
    ]) {
      DeliveryPin p = new DeliveryPin();
      p.orderNumber = o.OrderNumber;
      p.lat = o.Live_Latitude__c;
      p.lng = o.Live_Longitude__c;
      p.trackingToken = o.Tracking_Token__c;
      pins.add(p);
    }
    return pins;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private static TrackingData buildTrackingData(Order o) {
    TrackingData td = new TrackingData();
    td.lat = o.Live_Latitude__c;
    td.lng = o.Live_Longitude__c;
    td.etaMinutes = o.Live_ETA__c != null
      ? Integer.valueOf(o.Live_ETA__c)
      : null;
    td.status = o.Status;
    td.orderNumber = o.OrderNumber;
    td.trackingToken = o.Tracking_Token__c;
    td.isLive = (o.Live_Latitude__c != null &&
    o.Live_Latitude__c != 0 &&
    o.Live_Longitude__c != null &&
    o.Live_Longitude__c != 0 &&
    o.Status == 'Shipped');
    td.riderAddress = o.Live_Address__c;
    return td;
  }

  private static String generateToken() {
    return EncodingUtil.convertToHex(Crypto.generateAesKey(128))
      .substring(0, 32);
  }
}
