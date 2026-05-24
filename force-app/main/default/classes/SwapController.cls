public without sharing class SwapController {
  // ─── Helpers ────────────────────────────────────────────────────────────────

  private static Id getCurrentContactId() {
    try {
      User u = [
        SELECT ContactId
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      return u.ContactId;
    } catch (Exception e) {
      return null;
    }
  }

  private static String getContactName(Id contactId) {
    if (contactId == null)
      return 'Unknown';
    try {
      return [SELECT Name FROM Contact WHERE Id = :contactId LIMIT 1].Name;
    } catch (Exception e) {
      return 'Unknown';
    }
  }

  // ─── Listings ────────────────────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<Swap_Listing__c> getAvailableListings(
    String category,
    String searchQuery
  ) {
    Id myContactId = getCurrentContactId();
    String soql =
      'SELECT Id, Name, Condition__c, Category__c, Status__c, Description__c, ' +
      'CO2_Saved__c, Is_Verified__c, Image_URL__c, ' +
      'Owner_Contact__c, Owner_Contact__r.Name, CreatedDate ' +
      'FROM Swap_Listing__c WHERE Status__c = \'Available\'';
    if (myContactId != null) {
      soql +=
        ' AND Owner_Contact__c != \'' +
        String.escapeSingleQuotes(String.valueOf(myContactId)) +
        '\'';
    }
    if (String.isNotBlank(category) && category != 'All') {
      soql +=
        ' AND Category__c = \'' +
        String.escapeSingleQuotes(category) +
        '\'';
    }
    if (String.isNotBlank(searchQuery)) {
      soql +=
        ' AND Name LIKE \'%' +
        String.escapeSingleQuotes(searchQuery) +
        '%\'';
    }
    soql += ' ORDER BY CreatedDate DESC LIMIT 50';
    return Database.query(soql);
  }

  @AuraEnabled(cacheable=true)
  public static List<Swap_Listing__c> getMyListings() {
    Id myContactId = getCurrentContactId();
    if (myContactId == null)
      return new List<Swap_Listing__c>();
    return [
      SELECT
        Id,
        Name,
        Condition__c,
        Category__c,
        Status__c,
        Description__c,
        CO2_Saved__c,
        Is_Verified__c,
        Image_URL__c,
        CreatedDate
      FROM Swap_Listing__c
      WHERE Owner_Contact__c = :myContactId
      ORDER BY CreatedDate DESC
    ];
  }

  @AuraEnabled
  public static Swap_Listing__c createListing(
    String productName,
    String condition,
    String category,
    String description,
    Decimal co2Saved,
    String imageUrl
  ) {
    Id myContactId = getCurrentContactId();
    if (myContactId == null)
      throw new AuraHandledException(
        'You must be a registered customer to list items.'
      );
    Swap_Listing__c listing = new Swap_Listing__c(
      Name = productName,
      Condition__c = condition,
      Category__c = category,
      Description__c = description,
      CO2_Saved__c = co2Saved != null ? co2Saved : 0,
      Status__c = 'Available',
      Owner_Contact__c = myContactId,
      Image_URL__c = String.isNotBlank(imageUrl) ? imageUrl : null
    );
    insert listing;
    return listing;
  }

  @AuraEnabled
  public static void cancelListing(Id listingId) {
    Id myContactId = getCurrentContactId();
    Swap_Listing__c listing = [
      SELECT Id, Owner_Contact__c
      FROM Swap_Listing__c
      WHERE Id = :listingId
      LIMIT 1
    ];
    if (listing.Owner_Contact__c != myContactId)
      throw new AuraHandledException('Unauthorized.');
    listing.Status__c = 'Cancelled';
    update listing;
  }

  // ─── Requests ────────────────────────────────────────────────────────────────

  @AuraEnabled
  public static Swap_Request__c sendSwapRequest(
    Id listingId,
    String offeredItem
  ) {
    Id myContactId = getCurrentContactId();
    if (myContactId == null)
      throw new AuraHandledException(
        'You must be a registered customer to request a swap.'
      );
    Swap_Listing__c listing = [
      SELECT Id, Owner_Contact__c, Owner_Contact__r.Name, Status__c
      FROM Swap_Listing__c
      WHERE Id = :listingId
      LIMIT 1
    ];
    if (listing.Status__c != 'Available')
      throw new AuraHandledException('This item is no longer available.');
    if (listing.Owner_Contact__c == myContactId)
      throw new AuraHandledException('You cannot swap with yourself.');
    Swap_Request__c req = new Swap_Request__c(
      Listing__c = listingId,
      Requester_Contact__c = myContactId,
      Offered_Item__c = offeredItem,
      Status__c = 'Pending'
    );
    insert req;
    insert new Swap_Message__c(
      Request__c = req.Id,
      Sender_Name__c = 'System',
      Message__c = 'Swap request sent to ' +
        listing.Owner_Contact__r.Name +
        '. Waiting for response.',
      Is_System_Message__c = true
    );
    listing.Status__c = 'Pending';
    update listing;
    return req;
  }

  @AuraEnabled(cacheable=true)
  public static List<Swap_Request__c> getMySentRequests() {
    Id myContactId = getCurrentContactId();
    if (myContactId == null)
      return new List<Swap_Request__c>();
    return [
      SELECT
        Id,
        Name,
        Status__c,
        Offered_Item__c,
        CreatedDate,
        Listing__c,
        Listing__r.Name,
        Listing__r.Condition__c,
        Listing__r.Category__c,
        Listing__r.Image_URL__c,
        Listing__r.Owner_Contact__r.Name
      FROM Swap_Request__c
      WHERE Requester_Contact__c = :myContactId
      ORDER BY CreatedDate DESC
    ];
  }

  @AuraEnabled(cacheable=true)
  public static List<Swap_Request__c> getReceivedRequests() {
    Id myContactId = getCurrentContactId();
    if (myContactId == null)
      return new List<Swap_Request__c>();
    return [
      SELECT
        Id,
        Name,
        Status__c,
        Offered_Item__c,
        CreatedDate,
        Listing__c,
        Listing__r.Name,
        Listing__r.Condition__c,
        Requester_Contact__c,
        Requester_Contact__r.Name
      FROM Swap_Request__c
      WHERE Listing__r.Owner_Contact__c = :myContactId
      ORDER BY CreatedDate DESC
    ];
  }

  @AuraEnabled
  public static void updateRequestStatus(Id requestId, String newStatus) {
    Id myContactId = getCurrentContactId();
    Swap_Request__c req = [
      SELECT
        Id,
        Status__c,
        Offered_Item__c,
        Listing__c,
        Listing__r.Owner_Contact__c,
        Listing__r.Owner_Contact__r.Name,
        Listing__r.Name,
        Requester_Contact__c,
        Requester_Contact__r.Name
      FROM Swap_Request__c
      WHERE Id = :requestId
      LIMIT 1
    ];
    Boolean isOwner = req.Listing__r.Owner_Contact__c == myContactId;
    Boolean isRequester = req.Requester_Contact__c == myContactId;
    if (!isOwner && !isRequester)
      throw new AuraHandledException('Unauthorized.');
    if (newStatus == 'Accepted' && !isOwner)
      throw new AuraHandledException('Only the listing owner can accept.');
    if (newStatus == 'Cancelled' && !isRequester)
      throw new AuraHandledException('Only the requester can cancel.');

    req.Status__c = newStatus;
    update req;

    String sysMsg = '';
    if (newStatus == 'Accepted')
      sysMsg =
        req.Listing__r.Owner_Contact__r.Name +
        ' accepted the swap request. Please confirm once you have the item.';
    if (newStatus == 'Confirmed')
      sysMsg = 'Both parties confirmed. Complete the swap once the physical exchange is done.';
    if (newStatus == 'Completed')
      sysMsg = 'Swap completed! A Nexus Seal Certificate will be issued shortly.';
    if (newStatus == 'Cancelled')
      sysMsg = 'Swap request was cancelled.';

    if (String.isNotBlank(sysMsg)) {
      insert new Swap_Message__c(
        Request__c = requestId,
        Sender_Name__c = 'System',
        Message__c = sysMsg,
        Is_System_Message__c = true
      );
    }

    if (newStatus == 'Accepted') {
      update new Swap_Listing__c(Id = req.Listing__c, Status__c = 'Pending');
    }
    if (newStatus == 'Completed') {
      update new Swap_Listing__c(Id = req.Listing__c, Status__c = 'Completed');
      issueSealAndUpdatePassports(req);
    }
    if (newStatus == 'Cancelled') {
      update new Swap_Listing__c(Id = req.Listing__c, Status__c = 'Available');
    }
  }

  private static void issueSealAndUpdatePassports(Swap_Request__c req) {
    String ownerName = req.Listing__r.Owner_Contact__r.Name;
    String requesterName = req.Requester_Contact__r.Name;

    // Transfer Digital Passport ownership if the listed item has one
    List<Digital_Passport__c> passports = [
      SELECT Id, Current_Owner__c, Condition__c
      FROM Digital_Passport__c
      WHERE
        Current_Owner__c = :req.Listing__r.Owner_Contact__c
        AND Product_Name__c = :req.Listing__r.Name
      LIMIT 1
    ];
    if (!passports.isEmpty()) {
      Digital_Passport__c pp = passports[0];
      pp.Current_Owner__c = req.Requester_Contact__c;
      pp.Status__c = 'Transferred';
      update pp;
      insert new Ownership_Event__c(
        Passport__c = pp.Id,
        From_Owner_Name__c = ownerName,
        To_Owner_Name__c = requesterName,
        Transfer_Type__c = 'Swap',
        Transfer_Date__c = Date.today(),
        Condition_At_Transfer__c = pp.Condition__c,
        Swap_Request__c = req.Id
      );
    }
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  @AuraEnabled(cacheable=false)
  public static List<Swap_Message__c> getMessages(Id requestId) {
    Id myContactId = getCurrentContactId();
    Swap_Request__c req = [
      SELECT Requester_Contact__c, Listing__r.Owner_Contact__c
      FROM Swap_Request__c
      WHERE Id = :requestId
      LIMIT 1
    ];
    if (
      req.Requester_Contact__c != myContactId &&
      req.Listing__r.Owner_Contact__c != myContactId
    ) {
      throw new AuraHandledException('Unauthorized.');
    }
    return [
      SELECT Id, Sender_Name__c, Message__c, Is_System_Message__c, CreatedDate
      FROM Swap_Message__c
      WHERE Request__c = :requestId
      ORDER BY CreatedDate ASC
      LIMIT 100
    ];
  }

  @AuraEnabled
  public static Swap_Message__c sendMessage(Id requestId, String messageText) {
    if (String.isBlank(messageText))
      throw new AuraHandledException('Message cannot be empty.');
    Id myContactId = getCurrentContactId();
    Swap_Request__c req = [
      SELECT
        Requester_Contact__c,
        Requester_Contact__r.Name,
        Listing__r.Owner_Contact__c,
        Listing__r.Owner_Contact__r.Name
      FROM Swap_Request__c
      WHERE Id = :requestId
      LIMIT 1
    ];
    Boolean isOwner = req.Listing__r.Owner_Contact__c == myContactId;
    Boolean isRequester = req.Requester_Contact__c == myContactId;
    if (!isOwner && !isRequester)
      throw new AuraHandledException('Unauthorized.');
    String senderName = isOwner
      ? req.Listing__r.Owner_Contact__r.Name
      : req.Requester_Contact__r.Name;
    Swap_Message__c msg = new Swap_Message__c(
      Request__c = requestId,
      Sender_Name__c = senderName,
      Message__c = messageText,
      Is_System_Message__c = false
    );
    insert msg;
    return msg;
  }

  // ─── Digital Passports ───────────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<Digital_Passport__c> getMyPassports() {
    Id myContactId = getCurrentContactId();
    if (myContactId == null)
      return new List<Digital_Passport__c>();
    return [
      SELECT
        Id,
        Name,
        Product_Name__c,
        Condition__c,
        Purchase_Date__c,
        Warranty_Expiry__c,
        CO2_Saved__c,
        Status__c,
        Original_Owner__c,
        Original_Owner__r.Name,
        Current_Owner__c,
        Current_Owner__r.Name
      FROM Digital_Passport__c
      WHERE Current_Owner__c = :myContactId
      ORDER BY Purchase_Date__c DESC NULLS LAST
    ];
  }

  @AuraEnabled(cacheable=true)
  public static List<Ownership_Event__c> getPassportHistory(Id passportId) {
    Id myContactId = getCurrentContactId();
    Digital_Passport__c pp = [
      SELECT Current_Owner__c, Original_Owner__c
      FROM Digital_Passport__c
      WHERE Id = :passportId
      LIMIT 1
    ];
    if (
      pp.Current_Owner__c != myContactId &&
      pp.Original_Owner__c != myContactId
    ) {
      throw new AuraHandledException('Unauthorized.');
    }
    return [
      SELECT
        Id,
        From_Owner_Name__c,
        To_Owner_Name__c,
        Transfer_Type__c,
        Transfer_Date__c,
        Condition_At_Transfer__c
      FROM Ownership_Event__c
      WHERE Passport__c = :passportId
      ORDER BY Transfer_Date__c ASC
    ];
  }

  @AuraEnabled(cacheable=true)
  public static Map<String, String> getProductDetailsForPassport(
    Id passportId
  ) {
    Map<String, String> result = new Map<String, String>();
    try {
      Digital_Passport__c pp = [
        SELECT Product_Name__c
        FROM Digital_Passport__c
        WHERE Id = :passportId
        LIMIT 1
      ];
      List<Product2> prods = [
        SELECT
          Name,
          Description,
          Family,
          ProductCode,
          Brand__c,
          Subcategory__c,
          Specs__c,
          Image_URL__c,
          (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
        FROM Product2
        WHERE Name = :pp.Product_Name__c
        LIMIT 1
      ];
      if (!prods.isEmpty()) {
        Product2 p = prods[0];
        result.put('description', p.Description != null ? p.Description : '');
        result.put('family', p.Family != null ? p.Family : '');
        result.put('productCode', p.ProductCode != null ? p.ProductCode : '');
        result.put('brand', p.Brand__c != null ? p.Brand__c : '');
        result.put(
          'category',
          p.Subcategory__c != null
            ? p.Subcategory__c
            : (p.Family != null ? p.Family : '')
        );
        result.put('specs', p.Specs__c != null ? p.Specs__c : '');
        result.put('imageUrl', p.Image_URL__c != null ? p.Image_URL__c : '');
        if (!p.PricebookEntries.isEmpty()) {
          result.put('price', String.valueOf(p.PricebookEntries[0].UnitPrice));
        }
      }
    } catch (Exception e) {
    }
    return result;
  }

  @AuraEnabled
  public static Digital_Passport__c createPassport(
    String productName,
    String condition,
    Date purchaseDate,
    Date warrantyExpiry,
    Decimal co2Saved
  ) {
    Id myContactId = getCurrentContactId();
    if (myContactId == null)
      throw new AuraHandledException(
        'You must be a registered customer to create a passport.'
      );
    String ownerName = getContactName(myContactId);
    Digital_Passport__c pp = new Digital_Passport__c(
      Product_Name__c = productName,
      Condition__c = condition,
      Purchase_Date__c = purchaseDate,
      Warranty_Expiry__c = warrantyExpiry,
      CO2_Saved__c = co2Saved != null ? co2Saved : 0,
      Status__c = 'Active',
      Current_Owner__c = myContactId,
      Original_Owner__c = myContactId
    );
    insert pp;
    insert new Ownership_Event__c(
      Passport__c = pp.Id,
      From_Owner_Name__c = 'Nexus',
      To_Owner_Name__c = ownerName,
      Transfer_Type__c = 'Purchase',
      Transfer_Date__c = purchaseDate != null ? purchaseDate : Date.today(),
      Condition_At_Transfer__c = condition
    );
    return pp;
  }
}
