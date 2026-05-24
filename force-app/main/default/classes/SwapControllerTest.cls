@isTest
private class SwapControllerTest {
  @TestSetup
  static void setup() {
    Contact c1 = new Contact(
      LastName = 'Swapper One',
      Email = 'swapper1@test.nexus'
    );
    Contact c2 = new Contact(
      LastName = 'Swapper Two',
      Email = 'swapper2@test.nexus'
    );
    insert new List<Contact>{ c1, c2 };
  }

  static Contact getContact(String lastName) {
    return [SELECT Id FROM Contact WHERE LastName = :lastName LIMIT 1];
  }

  @isTest
  static void testCreateAndFetchListing() {
    Contact c = getContact('Swapper One');
    Swap_Listing__c listing = new Swap_Listing__c(
      Name = 'Test Device',
      Condition__c = 'Mint',
      Category__c = 'Hardware',
      Status__c = 'Available',
      Owner_Contact__c = c.Id
    );
    insert listing;

    List<Swap_Listing__c> results = [
      SELECT Id, Name, Status__c
      FROM Swap_Listing__c
      WHERE Owner_Contact__c = :c.Id
    ];
    System.assertEquals(1, results.size());
    System.assertEquals('Available', results[0].Status__c);
  }

  @isTest
  static void testSendAndUpdateRequest() {
    Contact owner = getContact('Swapper One');
    Contact requester = getContact('Swapper Two');

    Swap_Listing__c listing = new Swap_Listing__c(
      Name = 'Nexus Hub',
      Condition__c = 'Good',
      Category__c = 'IoT',
      Status__c = 'Available',
      Owner_Contact__c = owner.Id
    );
    insert listing;

    Swap_Request__c req = new Swap_Request__c(
      Listing__c = listing.Id,
      Requester_Contact__c = requester.Id,
      Offered_Item__c = 'Smart Sensor v2',
      Status__c = 'Pending'
    );
    insert req;

    req.Status__c = 'Accepted';
    update req;
    System.assertEquals(
      'Accepted',
      [SELECT Status__c FROM Swap_Request__c WHERE Id = :req.Id].Status__c
    );
  }

  @isTest
  static void testMessageFlow() {
    Contact owner = getContact('Swapper One');
    Contact requester = getContact('Swapper Two');

    Swap_Listing__c listing = new Swap_Listing__c(
      Name = 'Hub Pro',
      Condition__c = 'Fair',
      Category__c = 'Connectivity',
      Status__c = 'Available',
      Owner_Contact__c = owner.Id
    );
    insert listing;

    Swap_Request__c req = new Swap_Request__c(
      Listing__c = listing.Id,
      Requester_Contact__c = requester.Id,
      Offered_Item__c = 'Sensor Pack',
      Status__c = 'Pending'
    );
    insert req;

    Swap_Message__c msg = new Swap_Message__c(
      Request__c = req.Id,
      Sender_Name__c = 'Swapper Two',
      Message__c = 'Is this still available?',
      Is_System_Message__c = false
    );
    insert msg;

    List<Swap_Message__c> msgs = [
      SELECT Id
      FROM Swap_Message__c
      WHERE Request__c = :req.Id
    ];
    System.assertEquals(1, msgs.size());
  }

  @isTest
  static void testCreatePassportAndHistory() {
    Contact owner = getContact('Swapper One');
    Digital_Passport__c pp = new Digital_Passport__c(
      Product_Name__c = 'Nexus Hub v2',
      Condition__c = 'Mint',
      Purchase_Date__c = Date.today(),
      Status__c = 'Active',
      Current_Owner__c = owner.Id,
      Original_Owner__c = owner.Id
    );
    insert pp;

    insert new Ownership_Event__c(
      Passport__c = pp.Id,
      From_Owner_Name__c = 'Nexus',
      To_Owner_Name__c = 'Swapper One',
      Transfer_Type__c = 'Purchase',
      Transfer_Date__c = Date.today(),
      Condition_At_Transfer__c = 'Mint'
    );

    List<Ownership_Event__c> events = [
      SELECT Id
      FROM Ownership_Event__c
      WHERE Passport__c = :pp.Id
    ];
    System.assertEquals(1, events.size());
  }
}
